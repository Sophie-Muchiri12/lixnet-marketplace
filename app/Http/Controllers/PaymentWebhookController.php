<?php
// File: app/Http/Controllers/PaymentWebhookController.php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Services\SubscriptionService;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    protected $subscriptionService;
    protected $smsService;

    public function __construct(SubscriptionService $subscriptionService, SmsService $smsService)
    {
        $this->subscriptionService = $subscriptionService;
        $this->smsService = $smsService;
    }

    /**
     * Handle payment success callback from Pesapal
     */
    public function paymentSuccess(Request $request): JsonResponse
    {
        try {
            $orderTrackingId = $request->input('OrderTrackingId');

            if (!$orderTrackingId) {
                Log::error('Payment webhook: Missing OrderTrackingId');
                return response()->json([
                    'success' => false,
                    'message' => 'Missing OrderTrackingId'
                ], 400);
            }

            // Find subscription by payment reference
            $subscription = Subscription::where('payment_reference', $orderTrackingId)
                ->first();

            if (!$subscription) {
                Log::warning('Payment webhook: Subscription not found', [
                    'order_tracking_id' => $orderTrackingId
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Subscription not found'
                ], 404);
            }

            // Mark subscription as paid
            $this->subscriptionService->markSubscriptionAsPaid($subscription);

            // Send payment success SMS
            if ($subscription->user->phone) {
                $smsResult = $this->smsService->sendPaymentSuccessSms($subscription, $subscription->price);
                
                if ($smsResult['success']) {
                    Log::info('Payment success SMS sent', [
                        'subscription_id' => $subscription->id,
                        'order_tracking_id' => $orderTrackingId
                    ]);
                } else {
                    Log::warning('Failed to send payment success SMS', [
                        'subscription_id' => $subscription->id,
                        'error' => $smsResult['error'] ?? 'Unknown error'
                    ]);
                }
            }

            Log::info('Payment confirmed via webhook', [
                'subscription_id' => $subscription->id,
                'order_tracking_id' => $orderTrackingId,
                'amount' => $subscription->price
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment confirmed',
                'subscription_id' => $subscription->id
            ]);

        } catch (\Exception $e) {
            Log::error('Error processing payment webhook: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error processing payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle payment failure callback from Pesapal
     */
    public function paymentFailure(Request $request): JsonResponse
    {
        try {
            $orderTrackingId = $request->input('OrderTrackingId');
            $errorMessage = $request->input('error', 'Payment failed');

            if (!$orderTrackingId) {
                Log::error('Payment failure webhook: Missing OrderTrackingId');
                return response()->json([
                    'success' => false,
                    'message' => 'Missing OrderTrackingId'
                ], 400);
            }

            // Find subscription by payment reference
            $subscription = Subscription::where('payment_reference', $orderTrackingId)
                ->first();

            if (!$subscription) {
                Log::warning('Payment failure webhook: Subscription not found', [
                    'order_tracking_id' => $orderTrackingId
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Subscription not found'
                ], 404);
            }

            // Send payment failed SMS
            if ($subscription->user->phone) {
                $smsResult = $this->smsService->sendPaymentFailedSms(
                    $subscription,
                    $subscription->price,
                    $errorMessage
                );

                if ($smsResult['success']) {
                    Log::info('Payment failure SMS sent', [
                        'subscription_id' => $subscription->id,
                        'order_tracking_id' => $orderTrackingId
                    ]);
                } else {
                    Log::warning('Failed to send payment failure SMS', [
                        'subscription_id' => $subscription->id,
                        'error' => $smsResult['error'] ?? 'Unknown error'
                    ]);
                }
            }

            Log::warning('Payment failed via webhook', [
                'subscription_id' => $subscription->id,
                'order_tracking_id' => $orderTrackingId,
                'amount' => $subscription->price,
                'error_message' => $errorMessage
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment failure recorded',
                'subscription_id' => $subscription->id
            ]);

        } catch (\Exception $e) {
            Log::error('Error processing payment failure webhook: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error processing payment failure',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}