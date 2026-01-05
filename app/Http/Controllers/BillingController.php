<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class BillingController extends Controller
{
    /**
     * Get billing history for authenticated user
     * Returns all subscription billing records with pagination
     */
    public function getBillingHistory(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $perPage = (int)$request->get('per_page', 15);
            $status = $request->get('status');
            $sort = $request->get('sort', 'date');

            Log::info('Billing history request', [
                'user_id' => $user->id,
                'per_page' => $perPage,
                'status' => $status,
                'sort' => $sort
            ]);

            $query = Subscription::where('user_id', $user->id)
                ->with('product')
                ->select([
                    'id',
                    'subscription_reference',
                    'tier',
                    'price',
                    'currency',
                    'started_at',
                    'next_billing_date',
                    'status',
                    'product_id'
                ]);

            // Apply status filter
            if ($status && $status !== '') {
                $query->where('status', $status);
            }

            // Apply sorting
            match ($sort) {
                'oldest' => $query->orderBy('started_at', 'asc'),
                'amount_high' => $query->orderBy('price', 'desc'),
                'amount_low' => $query->orderBy('price', 'asc'),
                default => $query->orderBy('started_at', 'desc'),
            };

            $subscriptions = $query->paginate($perPage);

            // Transform the data to match frontend expectations
            $billingData = $subscriptions->map(function ($subscription) {
                return [
                    'id' => (int)$subscription->id,
                    'subscription_id' => (int)$subscription->id,
                    'product_title' => $subscription->product ? $subscription->product->title : 'N/A',
                    'plan_name' => ($subscription->product ? $subscription->product->title : 'N/A') . ' - ' . ucfirst($subscription->tier),
                    'tier' => (string)$subscription->tier,
                    'amount' => (float)$subscription->price,
                    'currency' => (string)$subscription->currency,
                    'billing_date' => $subscription->started_at ? $subscription->started_at->toIso8601String() : null,
                    'due_date' => $subscription->next_billing_date ? $subscription->next_billing_date->toIso8601String() : null,
                    'status' => (string)$subscription->status,
                    'subscription_reference' => (string)$subscription->subscription_reference,
                    'invoice_number' => 'INV-' . str_pad($subscription->id, 8, '0', STR_PAD_LEFT)
                ];
            })->toArray();

            Log::info('Billing history retrieved', [
                'user_id' => $user->id,
                'count' => count($billingData),
                'total' => $subscriptions->total()
            ]);

            return response()->json([
                'success' => true,
                'data' => $billingData,
                'current_page' => $subscriptions->currentPage(),
                'last_page' => $subscriptions->lastPage(),
                'per_page' => $subscriptions->perPage(),
                'total' => $subscriptions->total()
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving billing history: ' . $e->getMessage(), [
                'exception' => $e
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve billing history',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Download invoice as PDF
     * Generates a professional PDF invoice for a billing record
     */
    public function downloadInvoice($billingId)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                abort(401, 'Unauthorized');
            }

            // Get subscription billing record
            $subscription = Subscription::with(['product', 'user'])
                ->where('id', $billingId)
                ->where('user_id', $user->id)
                ->firstOrFail();

            // Prepare invoice data
            $invoiceData = [
                'invoice_number' => 'INV-' . str_pad($subscription->id, 8, '0', STR_PAD_LEFT),
                'invoice_date' => $subscription->started_at->format('Y-m-d'),
                'due_date' => $subscription->next_billing_date->format('Y-m-d'),
                'subscription_reference' => $subscription->subscription_reference,
                'product_name' => $subscription->product->title,
                'tier' => ucfirst($subscription->tier),
                'amount' => (float)$subscription->price,
                'currency' => $subscription->currency,
                'currency_symbol' => $this->getCurrencySymbol($subscription->currency),
                'status' => ucfirst($subscription->status),
                'user_name' => $subscription->user->name,
                'user_email' => $subscription->user->email,
                'user_phone' => $subscription->user->phone ?? 'N/A',
                'user_company' => $subscription->user->company ?? 'N/A',
                'subscription_started' => $subscription->started_at->format('Y-m-d H:i:s'),
                'billing_period' => $subscription->started_at->format('F Y') . ' - ' . $subscription->next_billing_date->format('F Y')
            ];

            // Generate PDF
            $pdf = Pdf::loadView('invoices.subscription-invoice', $invoiceData);
            
            Log::info('Invoice generated', [
                'subscription_id' => $subscription->id,
                'user_id' => $user->id,
                'invoice_number' => $invoiceData['invoice_number']
            ]);

            return $pdf->download('Invoice-' . $invoiceData['invoice_number'] . '.pdf');
        } catch (\Exception $e) {
            Log::error('Error downloading invoice: ' . $e->getMessage());
            abort(500, 'Failed to generate invoice');
        }
    }

    /**
     * Get billing summary for dashboard
     */
    public function getBillingSummary(): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $activeSubscriptions = Subscription::where('user_id', $user->id)
                ->where('status', 'active')
                ->count();

            $totalMonthlySpend = (float)Subscription::where('user_id', $user->id)
                ->where('status', 'active')
                ->sum('price');

            $pendingBills = Subscription::where('user_id', $user->id)
                ->where('status', 'pending')
                ->count();

            $upcomingBillings = Subscription::where('user_id', $user->id)
                ->where('status', 'active')
                ->where('next_billing_date', '<=', now()->addDays(7))
                ->where('next_billing_date', '>', now())
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'active_subscriptions' => $activeSubscriptions,
                    'total_monthly_spend' => $totalMonthlySpend,
                    'pending_bills' => $pendingBills,
                    'upcoming_billings_7_days' => $upcomingBillings
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving billing summary: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve billing summary'
            ], 500);
        }
    }

    /**
     * Get invoice details for a specific billing record
     */
    public function getInvoiceDetails($billingId): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $subscription = Subscription::with(['product', 'user'])
                ->where('id', $billingId)
                ->where('user_id', $user->id)
                ->firstOrFail();

            return response()->json([
                'success' => true,
                'data' => [
                    'invoice_number' => 'INV-' . str_pad($subscription->id, 8, '0', STR_PAD_LEFT),
                    'invoice_date' => $subscription->started_at->format('Y-m-d'),
                    'due_date' => $subscription->next_billing_date->format('Y-m-d'),
                    'subscription_reference' => $subscription->subscription_reference,
                    'product_name' => $subscription->product->title,
                    'tier' => ucfirst($subscription->tier),
                    'amount' => (float)$subscription->price,
                    'currency' => $subscription->currency,
                    'status' => ucfirst($subscription->status),
                    'user' => [
                        'name' => $subscription->user->name,
                        'email' => $subscription->user->email,
                        'phone' => $subscription->user->phone,
                        'company' => $subscription->user->company
                    ],
                    'billing_period' => $subscription->started_at->format('F Y') . ' - ' . $subscription->next_billing_date->format('F Y')
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving invoice details: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found'
            ], 404);
        }
    }

    /**
     * Export billing history as CSV
     */
    public function exportBillingHistory(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                abort(401, 'Unauthorized');
            }

            $billingRecords = Subscription::where('user_id', $user->id)
                ->with('product')
                ->select(['subscription_reference', 'tier', 'price', 'currency', 'started_at', 'next_billing_date', 'status', 'product_id'])
                ->orderBy('started_at', 'desc')
                ->get();

            $csvData = "Subscription Reference,Product Title,Tier,Price,Currency,Started At,Next Billing Date,Status\n";

            foreach ($billingRecords as $record) {
                $productTitle = $record->product ? $record->product->title : 'N/A';
                $csvData .= "\"{$record->subscription_reference}\",\"{$productTitle}\",\"{$record->tier}\",{$record->price},{$record->currency},\"{$record->started_at}\",\"{$record->next_billing_date}\",\"{$record->status}\"\n";
            }

            Log::info('Billing history exported', [
                'user_id' => $user->id,
                'records_count' => count($billingRecords)
            ]);

            return response($csvData)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', 'attachment; filename="billing-history-' . now()->format('Y-m-d') . '.csv"');
        } catch (\Exception $e) {
            Log::error('Error exporting billing history: ' . $e->getMessage());
            abort(500, 'Failed to export billing history');
        }
    }

    /**
     * Helper function to get currency symbol
     */
    private function getCurrencySymbol(string $currency): string
    {
        return match ($currency) {
            'KES' => 'KSh',
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£',
            'JPY' => '¥',
            default => $currency
        };
    }
}