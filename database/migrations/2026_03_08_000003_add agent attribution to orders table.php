<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: add_agent_attribution_to_orders_table
 *
 * Adds three nullable columns to the `orders` table:
 *
 *   agent_code          – The agent code entered at checkout (denormalised for
 *                         display even if the agent record is later deleted).
 *   discount_percentage – The percentage that was applied (e.g. 10.00).
 *   discount_amount     – The flat KES amount saved (e.g. 500.00).
 *
 * The existing `agent_id` FK (integer) already links the order to an agent and
 * is used by the SalesController to scope orders.  These new columns store the
 * checkout-time snapshot so the sales-detail view is always accurate.
 *
 * Run with:
 *   php artisan migrate
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Only add if not already present (safe to run twice)
            if (!Schema::hasColumn('orders', 'agent_code')) {
                $table->string('agent_code', 50)
                      ->nullable()
                      ->after('agent_id')
                      ->comment('Snapshot of the agent code used at checkout');
            }

            if (!Schema::hasColumn('orders', 'discount_percentage')) {
                $table->decimal('discount_percentage', 5, 2)
                      ->nullable()
                      ->after('agent_code')
                      ->comment('Discount rate applied (%) – null if none');
            }

            if (!Schema::hasColumn('orders', 'discount_amount')) {
                $table->decimal('discount_amount', 12, 2)
                      ->nullable()
                      ->after('discount_percentage')
                      ->comment('Flat discount amount deducted (KES) – null if none');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['agent_code', 'discount_percentage', 'discount_amount']);
        });
    }
};