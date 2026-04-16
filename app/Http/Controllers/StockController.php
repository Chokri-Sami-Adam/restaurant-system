<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\Setting;
use App\Models\StockMovement;

class StockController extends Controller
{
    /**
     * Get ingredients below or at their alert threshold
     */
    public function lowStock()
    {
        $notifyLowStock = Setting::query()->where('key', 'notify_low_stock')->value('value');
        if ($notifyLowStock === '0') {
            return response()->json([
                'message' => 'Low stock alerts are disabled',
                'data' => [],
            ]);
        }

        $ingredients = Ingredient::whereColumn('quantity', '<=', 'alert_threshold')->get();

        return response()->json([
            'message' => 'Low stock alert',
            'data' => $ingredients
        ]);
    }

    /**
     * Get stock movements history (in/out)
     */
    public function movements()
    {
        $movements = StockMovement::with('ingredient')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json([
            'data' => $movements
        ]);
    }
}
