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
                        'price' => 1999,
                        'features' => 'Up to 50 employees|Automated payroll|NHIF & NSSF deductions|Leave management|Email payslips'
                    ],
                    'premium' => [
                        'price' => 4999,
                        'features' => 'Unlimited employees|PAYE & KRA integration|Advanced HR analytics|Audit trails|Priority support'
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
                        'price' => 4999,
                        'features' => 'Up to 500 members|Loan processing|Interest calculations|Savings accounts|Member statements'
                    ],
                    'premium' => [
                        'price' => 9999,
                        'features' => 'Unlimited members|Automated dividends|SASRA reports|Multi-branch support|Member portal'
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
                        'features' => 'Single terminal|Basic sales recording|Manual product entry'
                    ],
                    'basic' => [
                        'price' => 2999,
                        'features' => 'Inventory management|Barcode scanning|Sales reports|Low stock alerts'
                    ],
                    'premium' => [
                        'price' => 6999,
                        'features' => 'Multi-store support|Advanced inventory|Supplier management|Sales analytics'
                    ],
                ],
            ],

            // Property Manager (Inventory category)
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
                        'price' => 2499,
                        'features' => 'Rent invoicing|Payment tracking|Expense tracking|Tenant statements|Occupancy reports'
                    ],
                    'premium' => [
                        'price' => 5999,
                        'features' => 'Multi-property support|Automated rent reminders|M-Pesa integration|Profit & loss reports'
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
                        'price' => 1999,
                        'features' => 'Double-entry accounting|Financial statements|Bank reconciliation|Tax reports'
                    ],
                    'premium' => [
                        'price' => 4999,
                        'features' => 'Multi-business support|Advanced analytics|Budgeting & forecasting|Audit trails'
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
                        'price' => 2999,
                        'features' => 'Fee management|Exam reports|Parent communication|Performance tracking'
                    ],
                    'premium' => [
                        'price' => 6999,
                        'features' => 'Online fee payments|Parent portal|Advanced analytics|SMS & email notifications'
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
