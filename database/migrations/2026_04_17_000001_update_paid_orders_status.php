<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update all orders that have payments to status 'paid'
        DB::statement("UPDATE orders SET status = 'paid' WHERE id IN (SELECT DISTINCT order_id FROM payments)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert paid orders back to served
        DB::statement("UPDATE orders SET status = 'served' WHERE status = 'paid' AND id IN (SELECT DISTINCT order_id FROM payments)");
    }
};
