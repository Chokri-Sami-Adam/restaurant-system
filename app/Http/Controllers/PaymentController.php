<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Order;
use App\Models\Setting;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    /**
     * List all payments
     */
    public function index()
    {
        $payments = Payment::with('order')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $payments
        ]);
    }

    /**
     * Process a payment for an order
     */
    public function store(Request $request)
    {
        $settings = Setting::query()->pluck('value', 'key');

        $allowedMethods = [];
        if (($settings['payment_cash'] ?? '1') === '1') {
            $allowedMethods[] = 'cash';
        }
        if (($settings['payment_card'] ?? '1') === '1') {
            $allowedMethods[] = 'card';
        }
        if (($settings['payment_online'] ?? '0') === '1') {
            $allowedMethods[] = 'mobile';
        }
        if (empty($allowedMethods)) {
            return response()->json([
                'message' => 'Aucune méthode de paiement n\'est activée dans les paramètres.'
            ], 422);
        }

        // ✅ validation
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'method' => 'required|in:' . implode(',', $allowedMethods)
        ]);

        $order = Order::findOrFail($request->order_id);

        // Only allow payment if order is served
        if ($order->status !== 'served') {
            return response()->json([
                'message' => 'Order must be served before payment. Current status: ' . $order->status
            ], 422);
        }

        // Prevent double payment
        $existingPayment = Payment::where('order_id', $order->id)->first();
        if ($existingPayment) {
            return response()->json([
                'message' => 'This order has already been paid'
            ], 422);
        }

        $taxRate = (float) ($settings['tax_rate'] ?? 0);
        $subtotal = (float) $order->total_price;
        $taxAmount = round(($subtotal * $taxRate) / 100, 2);
        $total = round($subtotal + $taxAmount, 2);

        // Create payment
        $payment = Payment::create([
            'order_id' => $order->id,
            'amount' => $total,
            'method' => $request->method,
            'status' => 'paid'
        ]);

        return response()->json([
            'message' => 'Payment successful',
            'payment' => $payment,
            'receipt' => [
                'restaurant_name' => $settings['restaurant_name'] ?? 'RestauPro',
                'restaurant_address' => $settings['restaurant_address'] ?? '',
                'restaurant_phone' => $settings['restaurant_phone'] ?? '',
                'restaurant_email' => $settings['restaurant_email'] ?? '',
                'opening_hours' => $settings['opening_hours'] ?? '',
                'logo_url' => !empty($settings['restaurant_logo_path']) ? asset('storage/' . $settings['restaurant_logo_path']) : null,
                'show_logo' => ($settings['receipt_show_logo'] ?? '1') === '1',
                'show_tax_details' => ($settings['receipt_show_tax_details'] ?? '1') === '1',
                'footer_message' => $settings['receipt_footer_message'] ?? 'Merci pour votre visite',
                'currency' => $settings['currency'] ?? 'MAD',
                'subtotal' => $subtotal,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'total' => $total,
            ],
        ]);
    }
}
