<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use Illuminate\Database\Seeder;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        // ===== 1. CATEGORIES =====
        $pizza = Category::firstOrCreate(['name' => 'Pizza']);
        $burger = Category::firstOrCreate(['name' => 'Burgers']);
        $beverage = Category::firstOrCreate(['name' => 'Beverages']);

        // ===== 2. INGREDIENTS =====
        $tomato = Ingredient::updateOrCreate(['name' => 'Tomato'], ['unit' => 'kg', 'quantity' => 50]);
        $cheese = Ingredient::updateOrCreate(['name' => 'Cheese'], ['unit' => 'kg', 'quantity' => 30]);
        $flour = Ingredient::updateOrCreate(['name' => 'Flour'], ['unit' => 'kg', 'quantity' => 100]);
        $beef = Ingredient::updateOrCreate(['name' => 'Beef'], ['unit' => 'kg', 'quantity' => 20]);
        $lettuce = Ingredient::updateOrCreate(['name' => 'Lettuce'], ['unit' => 'kg', 'quantity' => 15]);

        // ===== 3. PRODUCTS =====
        $margherita = Product::updateOrCreate(
            ['name' => 'Margherita Pizza'],
            ['category_id' => $pizza->id, 'price' => 12.99, 'description' => 'Fresh mozzarella and basil']
        );
        $margherita->ingredients()->sync([
            $tomato->id => ['quantity_used' => 0.3],
            $cheese->id => ['quantity_used' => 0.2],
            $flour->id => ['quantity_used' => 0.5],
        ]);

        $pepperoni = Product::updateOrCreate(
            ['name' => 'Pepperoni Pizza'],
            ['category_id' => $pizza->id, 'price' => 14.99, 'description' => 'Classic pepperoni']
        );
        $pepperoni->ingredients()->sync([
            $tomato->id => ['quantity_used' => 0.3],
            $cheese->id => ['quantity_used' => 0.25],
            $flour->id => ['quantity_used' => 0.5],
        ]);

        $classicBurger = Product::updateOrCreate(
            ['name' => 'Classic Burger'],
            ['category_id' => $burger->id, 'price' => 10.99, 'description' => 'Beef burger with lettuce']
        );
        $classicBurger->ingredients()->sync([
            $beef->id => ['quantity_used' => 0.25],
            $lettuce->id => ['quantity_used' => 0.1],
            $cheese->id => ['quantity_used' => 0.1],
        ]);

        $coke = Product::updateOrCreate(
            ['name' => 'Coca Cola'],
            ['category_id' => $beverage->id, 'price' => 2.50, 'description' => '330ml bottle']
        );

        $water = Product::updateOrCreate(
            ['name' => 'Water'],
            ['category_id' => $beverage->id, 'price' => 1.50, 'description' => 'Bottled water']
        );

        // ===== 4. TEST ORDERS WITH VARIOUS STATUSES =====

        // ⏳ PENDING ORDER (waiting to be prepared)
        $pendingOrder = Order::create([
            'user_id' => 1,
            'status' => 'pending',
            'type' => 'dine-in',
            'total_price' => 0,
        ]);
        OrderItem::create([
            'order_id' => $pendingOrder->id,
            'product_id' => $margherita->id,
            'quantity' => 1,
            'price' => $margherita->price,
        ]);
        OrderItem::create([
            'order_id' => $pendingOrder->id,
            'product_id' => $coke->id,
            'quantity' => 2,
            'price' => $coke->price * 2,
        ]);
        $pendingOrder->update(['total_price' => $margherita->price + ($coke->price * 2)]);

        // 👨‍🍳 PREPARING ORDER (being cooked)
        $preparingOrder = Order::create([
            'user_id' => 1,
            'status' => 'preparing',
            'type' => 'takeaway',
            'total_price' => 0,
        ]);
        OrderItem::create([
            'order_id' => $preparingOrder->id,
            'product_id' => $pepperoni->id,
            'quantity' => 2,
            'price' => $pepperoni->price * 2,
        ]);
        $preparingOrder->update(['total_price' => $pepperoni->price * 2]);

        // ✅ READY ORDER (waiting to be picked up - READY FOR PAYMENT)
        $readyOrder = Order::create([
            'user_id' => 1,
            'status' => 'ready',
            'type' => 'dine-in',
            'total_price' => 0,
        ]);
        OrderItem::create([
            'order_id' => $readyOrder->id,
            'product_id' => $classicBurger->id,
            'quantity' => 1,
            'price' => $classicBurger->price,
        ]);
        OrderItem::create([
            'order_id' => $readyOrder->id,
            'product_id' => $coke->id,
            'quantity' => 1,
            'price' => $coke->price,
        ]);
        $readyOrder->update(['total_price' => $classicBurger->price + $coke->price]);

        // 🍽️ SERVED ORDER (delivered - READY FOR PAYMENT)
        $servedOrder = Order::create([
            'user_id' => 1,
            'status' => 'served',
            'type' => 'dine-in',
            'total_price' => 0,
        ]);
        OrderItem::create([
            'order_id' => $servedOrder->id,
            'product_id' => $margherita->id,
            'quantity' => 2,
            'price' => $margherita->price * 2,
        ]);
        OrderItem::create([
            'order_id' => $servedOrder->id,
            'product_id' => $water->id,
            'quantity' => 2,
            'price' => $water->price * 2,
        ]);
        $servedOrder->update(['total_price' => ($margherita->price * 2) + ($water->price * 2)]);

        // ❌ CANCELLED ORDER
        $cancelledOrder = Order::create([
            'user_id' => 1,
            'status' => 'cancelled',
            'type' => 'takeaway',
            'total_price' => 0,
        ]);
        OrderItem::create([
            'order_id' => $cancelledOrder->id,
            'product_id' => $pepperoni->id,
            'quantity' => 1,
            'price' => $pepperoni->price,
        ]);
        $cancelledOrder->update(['total_price' => $pepperoni->price]);
    }
}
