<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class WhatsappService
{
    private $apiKey;
    private $baseUrl = 'https://bot.sendwo.com/api/v1/whatsapp/send';
    private const TIMEOUT_SECONDS = 15;
    private const MAX_RETRIES = 3;
    private const RETRY_DELAY_MS = 1000;

    public function __construct()
    {
        $this->apiKey = config('services.sendwo.api_key');

        if (!$this->apiKey) {
            Log::error('Sendwo API key not configured', [
                'config_key' => 'services.sendwo.api_key',
            ]);
        }
    }

    /**
     * Send a WhatsApp message via Sendwo.
     *
     * @param string $phoneNumber Phone number in international format (e.g. 254712345678)
     * @param string $message     Message body (max 4096 chars)
     * @param string $type        Internal label for logging
     * @return array{success: bool, error?: string, code?: string, message_id?: string}
     */
    public function send(string $phoneNumber, string $message, string $type = 'notification'): array
    {
        try {
            $phoneNumber = $this->formatPhoneNumber($phoneNumber);
            if (!$phoneNumber) {
                return [
                    'success' => false,
                    'error'   => 'Invalid phone number format',
                    'code'    => 'INVALID_PHONE',
                ];
            }

            if (empty($message) || strlen($message) > 4096) {
                return [
                    'success' => false,
                    'error'   => 'Message must be between 1 and 4096 characters',
                    'code'    => 'INVALID_MESSAGE',
                ];
            }

            if (!$this->apiKey) {
                Log::critical('Sendwo API key missing', ['type' => $type]);
                return [
                    'success' => false,
                    'error'   => 'WhatsApp service not configured',
                    'code'    => 'SERVICE_MISCONFIGURED',
                ];
            }

            Log::info('Attempting WhatsApp send via Sendwo', [
                'phone_number'   => $this->maskPhoneNumber($phoneNumber),
                'type'           => $type,
                'message_length' => strlen($message),
            ]);

            // Sendwo authenticates via Bearer token in the Authorization header.
            // The api_key must NOT be sent in the POST body.
            $response = Http::timeout(self::TIMEOUT_SECONDS)
                ->withHeaders([
                    'Accept'        => 'application/json',
                    'Content-Type'  => 'application/json',
                    'Authorization' => 'Bearer ' . $this->apiKey,
                ])
                ->post($this->baseUrl, [
                    'to'      => $phoneNumber,
                    'message' => $message,
                    'type'    => 'text',
                ]);

            // Guard against HTML error pages (e.g. 401/403 from a WAF)
            $contentType = $response->header('Content-Type');
            if (stripos($contentType, 'text/html') !== false) {
                Log::error('Sendwo API returned HTML response', [
                    'phone_number' => $this->maskPhoneNumber($phoneNumber),
                    'type'         => $type,
                    'status'       => $response->status(),
                    'body_preview' => substr($response->body(), 0, 100),
                ]);

                return [
                    'success' => false,
                    'error'   => 'WhatsApp service authentication failed. Please check API credentials.',
                    'code'    => 'AUTH_FAILED',
                ];
            }

            try {
                $responseData = $response->json();
            } catch (\Exception $e) {
                Log::error('Sendwo API returned invalid JSON', [
                    'phone_number'    => $this->maskPhoneNumber($phoneNumber),
                    'type'            => $type,
                    'status'          => $response->status(),
                    'error'           => $e->getMessage(),
                    'response_preview' => substr($response->body(), 0, 200),
                ]);

                return [
                    'success' => false,
                    'error'   => 'Invalid response from WhatsApp service',
                    'code'    => 'INVALID_RESPONSE',
                ];
            }

            if ($response->successful() && isset($responseData['success']) && $responseData['success'] === true) {
                Log::info('WhatsApp message sent successfully', [
                    'phone_number' => $this->maskPhoneNumber($phoneNumber),
                    'type'         => $type,
                    'message_id'   => $responseData['message_id'] ?? null,
                ]);

                return [
                    'success'    => true,
                    'message'    => 'WhatsApp message sent successfully',
                    'message_id' => $responseData['message_id'] ?? null,
                    'code'       => 'SENT',
                ];
            }

            $errorMessage = $responseData['message'] ?? $responseData['error'] ?? 'Unknown error from WhatsApp service';
            $errorCode    = $responseData['code'] ?? 'UNKNOWN_ERROR';

            Log::error('WhatsApp send failed', [
                'phone_number' => $this->maskPhoneNumber($phoneNumber),
                'type'         => $type,
                'status'       => $response->status(),
                'error'        => $errorMessage,
                'error_code'   => $errorCode,
            ]);

            return [
                'success'     => false,
                'error'       => $errorMessage,
                'code'        => $errorCode,
                'status_code' => $response->status(),
            ];

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Sendwo connection failed', [
                'type'  => $type,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error'   => 'Failed to connect to WhatsApp service. Please try again.',
                'code'    => 'CONNECTION_ERROR',
            ];

        } catch (\Exception $e) {
            Log::error('Error sending WhatsApp message: ' . $e->getMessage(), [
                'type'      => $type,
                'exception' => get_class($e),
            ]);

            return [
                'success' => false,
                'error'   => 'An unexpected error occurred',
                'code'    => 'EXCEPTION',
            ];
        }
    }

    /**
     * Send a 6-digit verification code via WhatsApp.
     */
    public function sendVerificationCode(string $phoneNumber, string $code): array
    {
        $message = "Your Lixnet verification code is: *{$code}*\n\nValid for 15 minutes. Do not share this code with anyone.";

        return $this->send($phoneNumber, $message, 'verification');
    }

    /**
     * Send a 6-digit password reset code via WhatsApp.
     */
    public function sendPasswordResetCode(string $phoneNumber, string $code): array
    {
        $message = "Your Lixnet password reset code is: *{$code}*\n\nValid for 15 minutes. If you didn't request this, please ignore.";

        return $this->send($phoneNumber, $message, 'password_reset');
    }

    /**
     * Send an account-verified confirmation via WhatsApp.
     */
    public function sendVerificationSuccess(string $phoneNumber, string $userName): array
    {
        $message = "Hi {$userName},\n\nYour Lixnet account has been successfully verified! 🎉\n\nYou can now access all features. Welcome to Lixnet!";

        return $this->send($phoneNumber, $message, 'verification_success');
    }

    /**
     * Send a login notification via WhatsApp.
     */
    public function sendLoginNotification(string $phoneNumber, string $userName, ?string $device = null): array
    {
        $deviceText = $device ? "from {$device}" : '';
        $message    = "Hi {$userName},\n\nYour Lixnet account was logged in {$deviceText}.\n\nIf this wasn't you, please reset your password immediately.";

        return $this->send($phoneNumber, $message, 'login_notification');
    }

    /**
     * Send a password-change confirmation via WhatsApp.
     */
    public function sendPasswordChangeConfirmation(string $phoneNumber, string $userName): array
    {
        $message = "Hi {$userName},\n\nYour Lixnet password has been changed successfully.\n\nIf you didn't make this change, please reset your password immediately.";

        return $this->send($phoneNumber, $message, 'password_change');
    }

    /**
     * Send a subscription notification via WhatsApp.
     */
    public function sendSubscriptionNotification(string $phoneNumber, string $productName, string $tier): array
    {
        $message = "You have successfully subscribed to *{$productName}* ({$tier} tier) on Lixnet! 🎉\n\nThank you for your subscription.";

        return $this->send($phoneNumber, $message, 'subscription_notification');
    }

    /**
     * Send a renewal reminder via WhatsApp.
     */
    public function sendRenewalReminder(string $phoneNumber, string $productName, int $daysUntilRenewal, string $renewalDate): array
    {
        $message = "Reminder: Your *{$productName}* subscription renews in {$daysUntilRenewal} days on {$renewalDate}.\n\nEnsure you have sufficient balance. 📱";

        return $this->send($phoneNumber, $message, 'renewal_reminder');
    }

    /**
     * Send a payment success notification via WhatsApp.
     */
    public function sendPaymentSuccess(string $phoneNumber, string $productName, float $amount): array
    {
        $message = "Payment of KES {$amount} for *{$productName}* received successfully! ✓\n\nYour subscription is now active.";

        return $this->send($phoneNumber, $message, 'payment_success');
    }

    /**
     * Send a payment failure notification via WhatsApp.
     */
    public function sendPaymentFailure(string $phoneNumber, string $productName, float $amount, ?string $reason = null): array
    {
        $reasonText = $reason ? "\nReason: {$reason}" : '';
        $message    = "Payment of KES {$amount} for *{$productName}* failed. ✗{$reasonText}\n\nPlease try again.";

        return $this->send($phoneNumber, $message, 'payment_failure');
    }

    /**
     * Format and validate a phone number for Sendwo.
     * Accepts: +254123456789 | 0123456789 | 254123456789
     * Returns: 254123456789 (no + prefix)
     */
    private function formatPhoneNumber(string $phone): ?string
    {
        $phone = preg_replace('/[^\d+]/', '', $phone);

        if (empty($phone)) {
            return null;
        }

        if (str_starts_with($phone, '+')) {
            $phone = ltrim($phone, '+');
        } elseif (str_starts_with($phone, '0')) {
            $phone = '254' . substr($phone, 1);
        }

        if (strlen($phone) < 10 || strlen($phone) > 15) {
            return null;
        }

        return $phone;
    }

    /**
     * Mask a phone number for safe logging (e.g. 254****78).
     */
    private function maskPhoneNumber(string $phone): string
    {
        return substr($phone, 0, 3) . '****' . substr($phone, -2);
    }
}