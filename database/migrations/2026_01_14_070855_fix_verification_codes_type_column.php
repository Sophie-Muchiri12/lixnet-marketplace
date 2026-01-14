<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix the verification_codes table
        Schema::table('verification_codes', function (Blueprint $table) {
            // Change type column to string with proper length
            $table->string('type')->change(); // Change from char to string
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('verification_codes', function (Blueprint $table) {
            $table->char('type')->change();
        });
    }
};