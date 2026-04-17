<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get all PAID orders that DON'T have payment records
        $paidOrdersWithoutPayments = DB::select("
            SELECT o.id, o.total_price
            FROM orders o
            WHERE o.status = 'paid'
            AND o.id NOT IN (SELECT DISTINCT order_id FROM payments)
        ");

        // Get tax rate from settings
        $taxRate = (float) DB::table('settings')->where('key', 'tax_rate')->value('value') ?? 0;

        // Create payment records for each PAID order without payment
        foreach ($paidOrdersWithoutPayments as $order) {
            $subtotal = (float) $order->total_price;
            $taxAmount = round(($subtotal * $taxRate) / 100, 2);
            $total = round($subtotal + $taxAmount, 2);

            DB::table('payments')->insert([
                'order_id' => $order->id,
                'amount' => $total,
                'method' => 'cash', // default method
                'status' => 'paid',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Delete payments that were created for PAID orders
        $paidOrdersWithPayments = DB::select("
            SELECT DISTINCT order_id FROM payments
            WHERE order_id IN (SELECT id FROM orders WHERE status = 'paid')
        ");

        foreach ($paidOrdersWithPayments as $payment) {
            DB::table('payments')->where('order_id', $payment->order_id)->delete();
        }
    }
};
