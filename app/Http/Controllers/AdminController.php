<?php

namespace App\Http\Controllers;

use App\Services\BackupService;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Ingredient;
use App\Models\User;
use App\Models\Setting;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    /**
     * 📊 Dashboard Statistics
     */
    public function stats()
    {
        $totalOrders = Order::count();
        // Revenue from PAID orders only
        $totalRevenue = Payment::where('status', 'paid')->sum('amount');
        $totalProducts = Product::count();
        $totalPayments = Payment::where('status', 'paid')->count();
        $pendingOrders = Order::where('status', 'pending')->count();
        $lowStockCount = Ingredient::whereColumn('quantity', '<=', 'alert_threshold')->count();
        $totalUsers = User::count();

        return response()->json([
            'total_orders' => $totalOrders,
            'total_revenue' => $totalRevenue,
            'total_products' => $totalProducts,
            'total_payments' => $totalPayments,
            'pending_orders' => $pendingOrders,
            'low_stock_count' => $lowStockCount,
            'total_users' => $totalUsers,
        ]);
    }

    /**
     * 📊 Enhanced Dashboard Analytics - Revenue by Period
     */
    public function analyticsRevenue()
    {
        // Revenue from PAID payments only
        $today = Payment::whereDate('created_at', Carbon::today())
            ->where('status', 'paid')
            ->sum('amount');

        $thisWeek = Payment::whereBetween('created_at', [
            Carbon::now()->startOfWeek(),
            Carbon::now()->endOfWeek()
        ])->where('status', 'paid')->sum('amount');

        $thisMonth = Payment::whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->where('status', 'paid')
            ->sum('amount');

        return response()->json([
            'daily' => $today,
            'weekly' => $thisWeek,
            'monthly' => $thisMonth,
        ]);
    }

    /**
     * 🏆 Get Best-Selling Products
     */
    public function bestSellingProducts(Request $request)
    {
        $limit = $request->query('limit', 10);

        $products = Product::select('products.id', 'products.name', 'products.price')
            ->selectRaw('COALESCE(SUM(order_items.quantity), 0) as total_sold')
            ->leftJoin('order_items', 'products.id', '=', 'order_items.product_id')
            ->groupBy('products.id', 'products.name', 'products.price')
            ->orderByRaw('total_sold DESC')
            ->limit($limit)
            ->get();

        return response()->json(['data' => $products]);
    }

    /**
     * 📈 System Activity - Recent Orders
     */
    public function systemActivity($limit = 20)
    {
        $recentOrders = Order::with('items.product')
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get();

        return response()->json(['data' => $recentOrders]);
    }

    /**
     * 📋 Performance Metrics
     */
    public function performanceMetrics()
    {
        $paidPayments = Payment::where('status', 'paid');
        $totalRevenue = $paidPayments->sum('amount');
        $paidCount = $paidPayments->count();
        $averageOrderValue = $paidCount > 0 ? $totalRevenue / $paidCount : 0;

        return response()->json([
            'total_orders' => Order::count(),
            'completed_orders' => Order::where('status', 'served')->count(),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'total_revenue' => $totalRevenue,
            'average_order_value' => $averageOrderValue,
            'total_users' => User::count(),
            'total_products' => Product::count(),
            'low_stock_items' => Ingredient::whereColumn('quantity', '<=', 'alert_threshold')->count(),
        ]);
    }

    /**
     * 📊 Generate Sales Report
     */
    public function salesReport(Request $request)
    {
        $from = $request->query('from') ? Carbon::parse($request->query('from')) : Carbon::now()->subMonth();
        $to = $request->query('to') ? Carbon::parse($request->query('to')) : Carbon::now();

        // Get orders with their paid payments
        $orders = Order::whereBetween('created_at', [$from, $to])
            ->with(['items.product', 'payments' => function ($q) {
                $q->where('status', 'paid');
            }])
            ->get()
            ->filter(function ($order) {
                return $order->payments->count() > 0;
            });

        $totalRevenue = $orders->sum(function ($order) {
            return $order->payments->sum('amount');
        });
        $totalOrders = $orders->count();
        $averageOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        return response()->json([
            'period' => ['from' => $from, 'to' => $to],
            'total_revenue' => $totalRevenue,
            'total_orders' => $totalOrders,
            'average_order_value' => $averageOrderValue,
            'orders' => $orders,
        ]);
    }

    /**
     * 📉 Analyze Trends
     */
    public function trendAnalysis(Request $request)
    {
        $from = $request->query('from') ? Carbon::parse($request->query('from')) : Carbon::now()->subDays(29);
        $to = $request->query('to') ? Carbon::parse($request->query('to')) : Carbon::now();

        $last30Days = [];
        $currentDate = clone $from;

        while ($currentDate <= $to) {
            $date = $currentDate->format('Y-m-d');
            $revenue = Payment::whereDate('created_at', $date)
                ->where('status', 'paid')
                ->sum('amount');

            $last30Days[$date] = $revenue;
            $currentDate->addDay();
        }

        return response()->json($last30Days);
    }

    /**
     * 💰 Profit Margins Analysis
     */
    public function profitMargins(Request $request)
    {
        $products = Product::with('ingredients')
            ->get()
            ->map(function ($product) {
                // Calculate total cost (if ingredients have 'cost' field, sum it; otherwise use 0)
                $totalCost = 0;
                if ($product->ingredients && !empty($product->ingredients)) {
                    $totalCost = $product->ingredients->sum(function($ing) {
                        return isset($ing->cost) ? $ing->cost : 0;
                    });
                }

                $profit = max(0, $product->price - $totalCost);
                $margin = $product->price > 0 ? ($profit / $product->price) * 100 : 0;

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'price' => $product->price,
                    'cost' => $totalCost,
                    'profit' => $profit,
                    'margin_percentage' => $margin,
                ];
            });

        return response()->json(['data' => $products]);
    }

    /**
     * ⚙️ System Settings - Get All
     */
    public function settings()
    {
        $defaults = [
            'app_name' => config('app.name', 'RestauPro'),
            'app_url' => config('app.url', 'http://localhost'),
            'timezone' => 'Africa/Casablanca',
            'currency' => 'MAD',
            'notifications' => true,
            'maintenance_mode' => false,
            'backup_enabled' => true,
            'debug_mode' => false,
            'restaurant_name' => 'RestauPro',
            'language' => 'fr',
        ];

        // Read settings from database
        $storedSettings = Setting::pluck('value', 'key')->toArray();

        return response()->json(array_merge($defaults, $storedSettings));
    }

    /**
     * 🌐 Public Settings - Get public settings (no auth required)
     */
    public function publicSettings()
    {
        // Read settings from database
        $settings = Setting::pluck('value', 'key')->toArray();

        // Logo path is always at /storage/restaurant-logos/logo.png
        $baseUrl = env('APP_URL', 'http://localhost:8000');
        $logoUrl = $baseUrl . '/storage/restaurant-logos/logo.png';

        return response()->json([
            'restaurant_name' => $settings['restaurant_name'] ?? 'RestauPro',
            'restaurant_logo_url' => $logoUrl,
            'language' => $settings['language'] ?? 'fr',
        ]);
    }

    /**
     * ⚙️ System Settings - Update
     */
    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'app_name' => 'sometimes|string|max:255',
            'app_url' => 'sometimes|string|url',
            'timezone' => 'sometimes|string',
            'currency' => 'sometimes|string|max:3',
            'notifications' => 'sometimes|boolean',
            'maintenance_mode' => 'sometimes|boolean',
            'backup_enabled' => 'sometimes|boolean',
            'debug_mode' => 'sometimes|boolean',
            'restaurant_name' => 'sometimes|string|max:255',
            'restaurant_logo' => 'nullable|image|max:5120',
            'language' => 'sometimes|string|max:10',
        ]);

        // Handle logo file upload - always save as logo.png (replaces old logo)
        if ($request->hasFile('restaurant_logo')) {
            try {
                $file = $request->file('restaurant_logo');
                
                // Delete old logo if it exists
                Storage::disk('public')->delete('restaurant-logos/logo.png');
                
                // Save the new file with exact name
                $path = Storage::disk('public')->putFileAs(
                    'restaurant-logos',
                    $file,
                    'logo.png'
                );
                
                \Log::info('Logo saved to: ' . $path);
                
            } catch (\Exception $e) {
                \Log::error('Logo upload error: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Erreur lors de l\'upload du logo: ' . $e->getMessage(),
                ], 422);
            }
        }

        // Save each other setting to database
        foreach ($validated as $key => $value) {
            if ($key === 'restaurant_logo') continue;
            $storeValue = $value;
            if (is_bool($value)) {
                $storeValue = $value ? '1' : '0';
            } else if (!is_string($storeValue) && !is_null($storeValue)) {
                $storeValue = (string)$storeValue;
            }
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $storeValue]
            );
        }

        // Re-fetch all settings from database to return
        $allSettings = Setting::pluck('value', 'key')->toArray();

        // Also store in cache for faster access
        cache()->put('app_settings', $allSettings, now()->addDays(365));

        return response()->json([
            'message' => 'Paramètres mis à jour avec succès',
            'data' => $allSettings,
        ]);
    }

    /**
     * Create a JSON backup of the main application data.
     */
    public function createBackup(BackupService $backupService)
    {
        try {
            $backup = $backupService->create();

            return response()->json([
                'message' => 'Backup created successfully',
                'file' => $backup['file'],
                'path' => $backup['path'],
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
