<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TestProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $category = Category::where('slug', 'pos')->firstOrFail();

        Product::firstOrCreate(
            ['title' => 'Test Product'],
            [
                'category_id' => $category->id,
                'description' => 'This is a test product for Pesapal integration',
                'price' => 2, // 2 KES
                'rating' => 5.0,
                'rating_count' => 1,
                'note' => 'Test product - Do not purchase',
            ]
        );
    }
}
