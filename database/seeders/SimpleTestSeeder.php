<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class SimpleTestSeeder extends Seeder
{
    public function run(): void
    {
        // Create simple categories
        $pizza = Category::firstOrCreate(['name' => 'Pizza']);
        $beverage = Category::firstOrCreate(['name' => 'Beverages']);

        // Create simple products
        $margherita = Product::firstOrCreate(
            ['name' => 'Margherita Pizza'],
            ['category_id' => $pizza->id, 'price' => 25.00]
        );

        $coke = Product::firstOrCreate(
            ['name' => 'Coca Cola'],
            ['category_id' => $beverage->id, 'price' => 5.00]
        );

        // CREATE 7 TEST ORDERS - ONE PER DAY FOR LAST 7 DAYS
        $now = Carbon::now();
        for ($i = 6; $i >= 0; $i--) {
            $orderDate = $now->copy()->subDays($i);

            // Order amount: 25-50 MAD
            $amount = 25 + rand(0, 25);

            // Create order
            $order = Order::create([
                'user_id' => 1,
                'status' => 'served',
                'type' => 'dine-in',
                'total_price' => $amount,
                'created_at' => $orderDate,
                'updated_at' => $orderDate,
            ]);

            // Add order item
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $margherita->id,
                'quantity' => 1,
                'price' => $amount,
                'created_at' => $orderDate,
                'updated_at' => $orderDate,
            ]);

            // Add PAID payment (THIS IS CRITICAL - API FILTERS FOR PAID STATUS)
            Payment::create([
                'order_id' => $order->id,
                'amount' => $amount,
                'method' => 'cash',
                'status' => 'paid',
                'created_at' => $orderDate,
                'updated_at' => $orderDate,
            ]);

            echo "✓ Created order #{$order->id} for " . $orderDate->format('Y-m-d') . " - Amount: {$amount} MAD\n";
        }
    }
}
