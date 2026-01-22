<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $bySlug = fn ($slug) =>
            Category::where('slug', $slug)->firstOrFail()->id;

        $products = [

            // Payroll & HR
            [
                'category' => 'payroll-hr',
                'title' => 'Evolve Payroll & HR',
                'description' => 'A complete payroll and human resource management system built for Kenyan businesses. Automates salary processing, statutory deductions, employee records, and HR workflows.',
                'rating' => 4.8,
                'rating_count' => 2680,
                'note' => 'NHIF, NSSF & KRA compliant',
                'is_subscription' => true,
                'subscription_tiers' => [
                    'free' => [
                        'price' => 0,
                        'features' => 'Employee records|Manual payroll|Basic payslips|Attendance tracking'
                    ],
                    'basic' => [
                        'price' => 3500,
                        'features' => 'Up to 20 employees|Basic payroll|Statutory compliance'
                    ],
                    'standard' => [
                        'price' => 8500,
                        'features' => '21 to 100 employees|Performance management|Self-service portal'
                    ],
                    'premium' => [
                        'price' => 50000,
                        'features' => '101+ employees|Multi-branch|Analytics|API access'
                    ],
                ],
            ],

            // SACCO
            [
                'category' => 'sacco',
                'title' => 'Evolve Sacco CBS',
                'description' => 'A robust core banking system for SACCOs covering member registration, savings, loans, dividends, and regulatory compliance.',
                'rating' => 5.0,
                'rating_count' => 2145,
                'note' => 'SASRA compliant',
                'is_subscription' => true,
                'subscription_tiers' => [
                    'free' => [
                        'price' => 0,
                        'features' => 'Member registration|Basic savings tracking|Manual loan records'
                    ],
                    'basic' => [
                        'price' => 25000,
                        'features' => 'Up to 1,000 members|Basic savings/loans|Regulatory reporting'
                    ],
                    'standard' => [
                        'price' => 50000,
                        'features' => '1,001 to 2,500 members|Mobile banking|Multi-branch|Biometric auth'
                    ],
                    'premium' => [
                        'price' => 100000,
                        'features' => 'Unlimited members|USSD/mobile app|Agency banking|Real-time analytics'
                    ],
                ],
            ],

            // POS
            [
                'category' => 'pos',
                'title' => 'Evolve POS',
                'description' => 'A modern point of sale system for retail shops, supermarkets, and restaurants with inventory tracking, sales reports, and receipt printing.',
                'rating' => 4.6,
                'rating_count' => 2470,
                'note' => 'M-Pesa & receipt printing supported',
                'is_subscription' => true,
                'subscription_tiers' => [
                    'free' => [
                        'price' => 0,
                        'features' => 'Single outlet|Up to 1,000 SKUs|Basic inventory|Sales reporting'
                    ],
                    'basic' => [
                        'price' => 5000,
                        'features' => 'Single outlet|Up to 1,000 SKUs|Basic inventory|Sales reporting'
                    ],
                    'standard' => [
                        'price' => 25000,
                        'features' => '2-5 Outlets|3,000 SKUs|Loyalty program|Accounting integration'
                    ],
                    'premium' => [
                        'price' => 50000,
                        'features' => '>6 Outlets|Multi-location dashboard|E-commerce integration|Omnichannel retail|Custom hardware integration|Advanced AI features'
                    ],
                ],
            ],

            // Property Manager
            [
                'category' => 'inventory',
                'title' => 'Evolve Property Manager',
                'description' => 'A property and rental management solution for landlords and real estate firms. Manages properties, units, tenants, rent billing, and expenses.',
                'rating' => 4.7,
                'rating_count' => 1820,
                'note' => 'Ideal for rentals & apartments',
                'is_subscription' => true,
                'subscription_tiers' => [
                    'free' => [
                        'price' => 0,
                        'features' => 'Property & unit listing|Tenant records|Manual rent tracking'
                    ],
                    'basic' => [
                        'price' => 5000,
                        'features' => 'Up to 20 units|Tenant management|Rent tracking|Maintenance portal'
                    ],
                    'standard' => [
                        'price' => 20000,
                        'features' => '21 to 100 units|Online payments|Vacancy listing|Contractor management'
                    ],
                    'premium' => [
                        'price' => 50000,
                        'features' => '>100 Units|Portfolio management|Marketing automation|Custom workflows'
                    ],
                ],
            ],

            // Accounting
            [
                'category' => 'accounting',
                'title' => 'Evolve Accounting Software',
                'description' => 'A comprehensive accounting system for SMEs with invoicing, expense tracking, tax compliance, and financial reporting.',
                'rating' => 5.0,
                'rating_count' => 1910,
                'note' => 'KRA compliant',
                'is_subscription' => true,
                'subscription_tiers' => [
                    'free' => [
                        'price' => 0,
                        'features' => 'Basic invoicing|Expense tracking|Customer records'
                    ],
                    'basic' => [
                        'price' => 2000,
                        'features' => 'Up to 500 transactions/month|Basic invoicing|VAT|Bank reconciliation'
                    ],
                    'standard' => [
                        'price' => 5000,
                        'features' => 'Up to 5,000 transactions/month|Multi-currency|Budgeting|Tax automation'
                    ],
                    'premium' => [
                        'price' => 15000,
                        'features' => '>5,000 transactions|Consolidation|Advanced auditing|Custom reports'
                    ],
                ],
            ],

            // School
            [
                'category' => 'school',
                'title' => 'Evolve School Manager',
                'description' => 'An all-in-one school management system for primary and secondary schools, handling students, fees, exams, and communication.',
                'rating' => 4.9,
                'rating_count' => 1765,
                'note' => 'For primary & secondary schools',
                'is_subscription' => true,
                'subscription_tiers' => [
                    'free' => [
                        'price' => 0,
                        'features' => 'Student records|Class management|Attendance|Exam entry'
                    ],
                    'basic' => [
                        'price' => 6000,
                        'features' => 'Up to 200 students|Fee management|Attendance|Parent portal'
                    ],
                    'standard' => [
                        'price' => 50000,
                        'features' => 'Up to 500 students|Library/hostel management|Transport tracking'
                    ],
                    'premium' => [
                        'price' => 50000,
                        'features' => '>800 students|Multi-campus|LMS|Biometric|Mobile apps'
                    ],
                ],
            ],
        ];

        /**
         * ---------------------------------------------------------
         * SYNC STEP (KEY FIX)
         * ---------------------------------------------------------
         * Delete products that are no longer defined above
         * WITHOUT wiping the entire database.
         */
        $titles = collect($products)->pluck('title')->toArray();

        Product::whereNotIn('title', $titles)->delete();

        /**
         * ---------------------------------------------------------
         * UPSERT PRODUCTS
         * ---------------------------------------------------------
         */
        foreach ($products as $p) {
            $basicPrice = $p['subscription_tiers']['basic']['price'] ?? 0;

            Product::updateOrCreate(
                ['title' => $p['title']],
                [
                    'category_id' => $bySlug($p['category']),
                    'description' => $p['description'],
                    'price' => $basicPrice,
                    'rating' => $p['rating'],
                    'rating_count' => $p['rating_count'],
                    'note' => $p['note'],
                    'is_subscription' => true,
                    'subscription_tiers' => $p['subscription_tiers'],
                ]
            );
        }
    }
}