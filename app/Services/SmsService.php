<?php
// File: app/Services/SmsService.php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class SmsService
{
    private $apiKey;
    private $apiSecret;
    private $baseUrl = 'https://api.smsleopard.com/v1/sms/send';
    private $senderId = 'Lixnet'; // Default sender ID - customize as needed

    public function __construct()
    {
        $this->apiKey = config('services.sms_leopard.api_key');
        $this->apiSecret = config('services.sms_leopard.api_secret');
    }

    /**
     * Send SMS to a phone number using URL parameters
     */
    public function sendSms(string $phoneNumber, string $message, string $type = 'subscription'): array
    {
        try {
            // Validate phone number
            $phoneNumber = $this->formatPhoneNumber($phoneNumber);
            if (!$phoneNumber) {
                return [
                    'success' => false,
                    'error' => 'Invalid phone number format'
                ];
            }

            // Validate message length
            if (strlen($message) > 160) {
                $message = substr($message, 0, 157) . '...';
            }

            Log::info('Attempting SMS send', [
                'phone_number' => $phoneNumber,
                'type' => $type,
                'message_length' => strlen($message)
            ]);

            // Build URL with parameters for SMS Leopard API
            $url = $this->baseUrl . '?' . http_build_query([
                'username' => $this->apiKey,
                'password' => $this->apiSecret,
                'message' => $message,
                'destination' => $phoneNumber,
                'source' => $this->senderId
            ]);

            // Make GET request to SMS Leopard API
            $response = Http::timeout(15)->get($url);

            if ($response->successful()) {
                Log::info('SMS sent successfully', [
                    'phone_number' => $phoneNumber,
                    'type' => $type,
                    'response' => $response->json()
                ]);

                return [
                    'success' => true,
                    'message' => 'SMS sent successfully',
                    'response' => $response->json()
                ];
            }

            Log::error('SMS send failed', [
                'phone_number' => $phoneNumber,
                'type' => $type,
                'status' => $response->status(),
                'response' => $response->body()
            ]);

            return [
                'success' => false,
                'error' => $response->json()['message'] ?? 'Failed to send SMS'
            ];

        } catch (\Exception $e) {
            Log::error('Error sending SMS: ' . $e->getMessage(), [
                'phone_number' => $phoneNumber ?? 'unknown',
                'type' => $type
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Format and validate phone number for SMS Leopard
     * Accepts formats: +254123456789, 0123456789, 254123456789
     */
    private function formatPhoneNumber(string $phone): ?string
    {
        // Remove all non-numeric characters except +
        $phone = preg_replace('/[^\d+]/', '', $phone);

        // If starts with +, keep it; if starts with 0, replace with country code
        if (strpos($phone, '+') === 0) {
            $phone = str_replace('+', '', $phone);
        } elseif (strpos($phone, '0') === 0) {
            $phone = '254' . substr($phone, 1);
        }

        // Validate it's a reasonable length (Kenya numbers are 12 digits with country code)
        if (strlen($phone) < 10 || strlen($phone) > 15) {
            return null;
        }

        return $phone;
    }

    /**
     * Send subscription created SMS
     */
    public function sendSubscriptionCreatedSms($subscription): array
    {
        $message = "Hi {$subscription->user->name}, you have successfully subscribed to {$subscription->product->title} ({$subscription->tier} tier). Thank you!";
        
        return $this->sendSms($subscription->user->phone, $message, 'subscription_created');
    }

    /**
     * Send subscription renewal reminder SMS
     */
    public function sendRenewalReminderSms($subscription, int $daysUntilRenewal): array
    {
        $message = "Reminder: Your {$subscription->product->title} subscription renews in {$daysUntilRenewal} days on {$subscription->next_billing_date->format('M d')}. Ensure sufficient balance.";
        
        return $this->sendSms($subscription->user->phone, $message, 'renewal_reminder');
    }

    /**
     * Send subscription cancellation SMS
     */
    public function sendCancellationSms($subscription): array
    {
        $message = "Your {$subscription->product->title} subscription has been cancelled. You can resubscribe anytime. Thank you!";
        
        return $this->sendSms($subscription->user->phone, $message, 'subscription_cancelled');
    }

    /**
     * Send subscription tier change SMS
     */
    public function sendTierChangeSms($subscription, string $oldTier, string $newTier): array
    {
        $message = "Your {$subscription->product->title} subscription has been upgraded from {$oldTier} to {$newTier} tier.";
        
        return $this->sendSms($subscription->user->phone, $message, 'tier_changed');
    }

    /**
     * Send payment success SMS
     */
    public function sendPaymentSuccessSms($subscription, float $amount): array
    {
        $message = "Payment of KES {$amount} for {$subscription->product->title} received successfully. Your subscription is now active.";
        
        return $this->sendSms($subscription->user->phone, $message, 'payment_success');
    }

    /**
     * Send payment failed SMS
     */
    public function sendPaymentFailedSms($subscription, float $amount, string $reason = ''): array
    {
        $reasonText = $reason ? " Reason: {$reason}." : '';
        $message = "Payment of KES {$amount} for {$subscription->product->title} failed.{$reasonText} Please try again.";
        
        return $this->sendSms($subscription->user->phone, $message, 'payment_failed');
    }

    /**
     * Send subscription renewal success SMS
     */
    public function sendRenewalSuccessSms($subscription): array
    {
        $nextRenewal = $subscription->next_billing_date->format('M d, Y');
        $message = "Your {$subscription->product->title} subscription has been renewed. Next renewal: {$nextRenewal}.";
        
        return $this->sendSms($subscription->user->phone, $message, 'renewal_success');
    }

    /**
     * Send generic SMS
     */
    public function send(string $phoneNumber, string $message): array
    {
        return $this->sendSms($phoneNumber, $message, 'generic');
    }
}