<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Setting;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        $settings = Setting::query()->pluck('value', 'key');

        $allowedTypes = [];
        if (($settings['order_dine_in'] ?? '1') === '1') {
            $allowedTypes[] = 'dine-in';
        }
        if (($settings['order_takeaway'] ?? '1') === '1') {
            $allowedTypes[] = 'takeaway';
        }
        if (($settings['order_delivery'] ?? '0') === '1') {
            $allowedTypes[] = 'delivery';
        }
        if (empty($allowedTypes)) {
            $allowedTypes = ['dine-in'];
        }

        $defaultStatus = $settings['default_order_status'] ?? 'pending';
        $autoStockDeduction = ($settings['auto_stock_deduction'] ?? '1') === '1';

        // ✅ validation
        $request->validate([
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'type' => 'nullable|in:' . implode(',', $allowedTypes),
        ]);

        try {
            $order = DB::transaction(function () use ($request, $defaultStatus, $autoStockDeduction) {

                $total = 0;

                // ✅ create order
                $order = Order::create([
                    'user_id' => auth()->id(),
                    'status' => $defaultStatus,
                    'type' => $request->type ?? 'dine-in',
                    'total_price' => 0
                ]);

                foreach ($request->items as $item) {

                    // 🔥 Get product with ingredients
                    $product = Product::with('ingredients')->findOrFail($item['product_id']);

                    $price = $product->price * $item['quantity'];
                    $total += $price;

                    // ✅ create order item
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'quantity' => $item['quantity'],
                        'price' => $price
                    ]);

                    // Stock management can be disabled via settings
                    if ($autoStockDeduction) {
                        foreach ($product->ingredients as $ingredient) {
                            $usedQty = $ingredient->pivot->quantity_used * $item['quantity'];

                            if ($ingredient->quantity < $usedQty) {
                                throw new \Exception('Stock not enough for ' . $ingredient->name);
                            }

                            $ingredient->decrement('quantity', $usedQty);

                            StockMovement::create([
                                'ingredient_id' => $ingredient->id,
                                'quantity' => $usedQty,
                                'type' => 'out'
                            ]);
                        }
                    }
                }

                // ✅ update total
                $order->update([
                    'total_price' => $total
                ]);

                $this->sendOrderNotifications($order);

                return $order->load('items.product');
            });

            return response()->json([
                'message' => 'Order created successfully',
                'data' => $order
            ]);
        } catch (\Exception $e) {
            \Log::error('Order creation error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error creating order: ' . $e->getMessage()
            ], 500);
        }
    }

    public function index()
    {
        return Order::with('items.product', 'user')->get();
    }

    /**
     * Get a specific order by ID
     */
    public function show($id)
    {
        $order = Order::with('items.product', 'user')->findOrFail($id);
        return response()->json(['data' => $order]);
    }

    public function updateStatus(Request $request, $id)
    {
        $settings = Setting::query()->pluck('value', 'key');
        $autoUpdate = ($settings['auto_update_order_status'] ?? '0') === '1';

        $request->validate([
            'status' => 'nullable|in:pending,preparing,ready,served,cancelled'
        ]);

        $order = Order::findOrFail($id);

        $nextStatus = $request->status;
        if ($autoUpdate && !$nextStatus) {
            $flow = [
                'pending' => 'preparing',
                'preparing' => 'ready',
                'ready' => 'served',
            ];
            $nextStatus = $flow[$order->status] ?? $order->status;
        }
        if (!$nextStatus) {
            return response()->json([
                'message' => 'Status is required when auto-update is disabled.'
            ], 422);
        }

        $order->update([
            'status' => $nextStatus
        ]);

        return $order;
    }

    /**
     * Update an order (admin only)
     */
    public function update(Request $request, $id)
    {
        // Validate before transaction
        $request->validate([
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'type' => 'nullable|in:dine-in,takeaway,delivery',
        ]);

        try {
            $order = DB::transaction(function () use ($request, $id) {
                $order = Order::with('items')->findOrFail($id);

                // Prevent updating served or cancelled orders
                if (in_array($order->status, ['served', 'cancelled'])) {
                    throw new \Exception('Cannot modify an order that has been served or cancelled');
                }

                $settings = Setting::query()->pluck('value', 'key');
                $autoStockDeduction = ($settings['auto_stock_deduction'] ?? '1') === '1';

                // Restore stock from old items
                foreach ($order->items as $oldItem) {
                    $product = Product::with('ingredients')->find($oldItem->product_id);
                    if ($product && $autoStockDeduction) {
                        foreach ($product->ingredients as $ingredient) {
                            $usedQty = $ingredient->pivot->quantity_used * $oldItem->quantity;
                            $ingredient->increment('quantity', $usedQty);
                        }
                    }
                }

                // Delete old items
                $order->items()->delete();

                $total = 0;

                // Add new items
                foreach ($request->items as $item) {
                    $product = Product::with('ingredients')->findOrFail($item['product_id']);
                    $price = $product->price * $item['quantity'];
                    $total += $price;

                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'quantity' => $item['quantity'],
                        'price' => $price
                    ]);

                    // Deduct stock for new items
                    if ($autoStockDeduction) {
                        foreach ($product->ingredients as $ingredient) {
                            $usedQty = $ingredient->pivot->quantity_used * $item['quantity'];
                            if ($ingredient->quantity < $usedQty) {
                                throw new \Exception('Stock not enough for ' . $ingredient->name);
                            }
                            $ingredient->decrement('quantity', $usedQty);
                            StockMovement::create([
                                'ingredient_id' => $ingredient->id,
                                'quantity' => $usedQty,
                                'type' => 'out'
                            ]);
                        }
                    }
                }

                // Update order
                $order->update([
                    'total_price' => $total,
                    'type' => $request->type ?? $order->type
                ]);

                return $order->load('items.product');
            });

            return response()->json([
                'message' => 'Order updated successfully',
                'data' => $order
            ]);
        } catch (\Exception $e) {
            \Log::error('Order update error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error updating order: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $result = DB::transaction(function () use ($id) {
                $order = Order::with('items')->findOrFail($id);

                // Prevent deleting served orders (allow pending, preparing, ready, cancelled)
                if ($order->status === 'served') {
                    throw new \Exception('Cannot delete an order that has been served');
                }

                $settings = Setting::query()->pluck('value', 'key');
                $autoStockDeduction = ($settings['auto_stock_deduction'] ?? '1') === '1';

                // Restore stock from order items
                if ($autoStockDeduction) {
                    foreach ($order->items as $item) {
                        $product = Product::with('ingredients')->find($item->product_id);
                        if ($product) {
                            foreach ($product->ingredients as $ingredient) {
                                $usedQty = $ingredient->pivot->quantity_used * $item->quantity;
                                $ingredient->increment('quantity', $usedQty);

                                // Record stock movement as return
                                StockMovement::create([
                                    'ingredient_id' => $ingredient->id,
                                    'quantity' => $usedQty,
                                    'type' => 'in'
                                ]);
                            }
                        }
                    }
                }

                // Delete order items
                $order->items()->delete();

                // Delete the order
                $order->delete();

                return true;
            });

            return response()->json(['message' => 'Order deleted successfully']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Order deletion error: ' . $e->getMessage(), [
                'order_id' => $id,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error deleting order: ' . $e->getMessage()
            ], 500);
        }
    }

    private function sendOrderNotifications(Order $order): void
    {
        $settings = Setting::query()->pluck('value', 'key');

        $notifyEmail = ($settings['notify_email'] ?? '0') === '1';
        $notifySms = ($settings['notify_sms'] ?? '0') === '1';

        $restaurantEmail = $settings['restaurant_email'] ?? null;
        $restaurantPhone = $settings['restaurant_phone'] ?? null;

        if ($notifyEmail && !empty($restaurantEmail)) {
            try {
                Mail::raw(
                    'Nouvelle commande #' . $order->id . ' - Total: ' . $order->total_price,
                    function ($message) use ($restaurantEmail, $order) {
                        $message->to($restaurantEmail)->subject('Nouvelle commande #' . $order->id);
                    }
                );
            } catch (\Throwable $e) {
                Log::warning('Email notification failed', ['order_id' => $order->id, 'error' => $e->getMessage()]);
            }
        }

        if ($notifySms && !empty($restaurantPhone) && env('SMS_WEBHOOK_URL')) {
            try {
                Http::timeout(5)->post(env('SMS_WEBHOOK_URL'), [
                    'to' => $restaurantPhone,
                    'message' => 'Nouvelle commande #' . $order->id . ' total ' . $order->total_price,
                ]);
            } catch (\Throwable $e) {
                Log::warning('SMS notification failed', ['order_id' => $order->id, 'error' => $e->getMessage()]);
            }
        }
    }
}
