<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adds a 'status' column to the commissions table so records can be
     * marked as 'pending' (calculated, not yet paid) or 'paid'.
     * Also adds commission_rate column for easy querying without joining tiers.
     */
    public function up(): void
    {
        Schema::table('commissions', function (Blueprint $table) {
            if (!Schema::hasColumn('commissions', 'status')) {
                $table->enum('status', ['pending', 'paid', 'cancelled'])
                    ->default('pending')
                    ->after('period_end');
            }

            if (!Schema::hasColumn('commissions', 'commission_rate')) {
                $table->decimal('commission_rate', 5, 2)->nullable()->after('tier_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('commissions', function (Blueprint $table) {
            $table->dropColumnIfExists('status');
            $table->dropColumnIfExists('commission_rate');
        });
    }
};