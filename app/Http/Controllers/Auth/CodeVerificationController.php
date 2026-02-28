<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\VerificationService;
use App\Services\VerificationRateLimitService;
use App\Services\SmsService;
use App\Services\WhatsappService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;

class CodeVerificationController extends Controller
{
    protected $smsService;
    protected $whatsappService;

    /**
     * Constructor - Inject SMS and WhatsApp services
     * 
     * @param SmsService $smsService
     * @param WhatsappService $whatsappService
     */
    public function __construct(SmsService $smsService, WhatsappService $whatsappService)
    {
        $this->smsService = $smsService;
        $this->whatsappService = $whatsappService;
    }

    /**
     * Show the code verification page
     * 
     * Displays the verification form with user information and remaining attempts
     * 
     * @param Request $request
     * @return Response
     */
    public function create(Request $request): Response
    {
        $user = $request->user();
        $emailVerified = !is_null($user->email_verified_at);
        $phoneVerified = !is_null($user->phone_verified_at);

        // Get rate limit info
        $rateLimitInfo = VerificationRateLimitService::getInfo($user);
        $isLocked = VerificationRateLimitService::isAttemptRateLimited($user);

        return Inertia::render('auth/verify-code', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $this->maskPhone($user->phone),
                'email_verified' => $emailVerified,
                'phone_verified' => $phoneVerified,
            ],
            'remaining_attempts' => VerificationRateLimitService::getRemainingAttempts($user),
            'is_locked' => $isLocked,
            'lockout_seconds' => $isLocked ? VerificationRateLimitService::getLockoutSecondsRemaining($user) : 0,
            'rate_limit_info' => $rateLimitInfo,
        ]);
    }

    /**
     * Store verification code submission
     * 
     * Handles code verification for both email and phone.
     * The same code works for both email and phone verification.
     * Includes rate limiting protection.
     * 
     * @param Request $request
     * @return RedirectResponse
     */
    public function store(Request $request): RedirectResponse
    {
        try {
            $user = $request->user();

            // CHECK RATE LIMITING FIRST
            if (VerificationRateLimitService::isAttemptRateLimited($user)) {
                $lockoutSeconds = VerificationRateLimitService::getLockoutSecondsRemaining($user);
                $lockoutMinutes = ceil($lockoutSeconds / 60);
                
                Log::warning('Verification rate limit exceeded', [
                    'user_id' => $user->id,
                    'ip' => $request->ip(),
                    'lockout_minutes' => $lockoutMinutes
                ]);

                throw ValidationException::withMessages([
                    'code' => "Too many failed attempts. Please try again in {$lockoutMinutes} minutes.",
                ]);
            }

            // Validate the code format (6 digits)
            $request->validate([
                'code' => 'required|string|size:6|regex:/^\d+$/',
            ]);

            $code = $request->input('code');

            // Log the verification attempt (mask the code for security)
            Log::info('Verification attempt', [
                'user_id' => $user->id,
                'code_preview' => substr($code, 0, 2) . '****',
                'email_verified' => $user->hasVerifiedEmail(),
                'phone_verified' => $user->hasVerifiedPhone(),
            ]);

            $emailVerified = false;
            $phoneVerified = false;

            // Try to verify email if not already verified
            if (!$user->hasVerifiedEmail()) {
                if (VerificationService::verifyCode($user, $code, 'email')) {
                    $user->email_verified_at = now();
                    $user->save();
                    $emailVerified = true;

                    Log::info('Email verified successfully', [
                        'user_id' => $user->id,
                    ]);
                }
            } else {
                $emailVerified = true;
            }

            // Try to verify phone if not already verified
            if (!$user->hasVerifiedPhone()) {
                if (VerificationService::verifyCode($user, $code, 'phone')) {
                    $user->phone_verified_at = now();
                    $user->save();
                    $phoneVerified = true;

                    Log::info('Phone verified successfully', [
                        'user_id' => $user->id,
                    ]);
                }
            } else {
                $phoneVerified = true;
            }

            // If both are verified (either just now or already were), redirect with success
            if ($emailVerified && $phoneVerified) {
                // Clear rate limit on success
                VerificationRateLimitService::clearLimit($user);
                
                Log::info('User fully verified', [
                    'user_id' => $user->id,
                ]);

                return redirect()->intended(route('marketplace'))
                    ->with('status', 'Account verified successfully!');
            }

            // Code was invalid or expired - record attempt
            $attempts = VerificationRateLimitService::recordAttempt($user);
            $remaining = VerificationRateLimitService::getRemainingAttempts($user);

            Log::info('Verification attempt failed', [
                'user_id' => $user->id,
                'attempt_number' => $attempts,
                'remaining_attempts' => $remaining,
            ]);

            // If this was the last attempt, include lockout warning
            if ($remaining === 0) {
                throw ValidationException::withMessages([
                    'code' => 'Invalid code. You have been locked out for 15 minutes.',
                ]);
            }

            throw ValidationException::withMessages([
                'code' => "The verification code is invalid or expired. {$remaining} attempts remaining.",
            ]);

        } catch (ValidationException $e) {
            Log::warning('Verification validation failed', [
                'user_id' => $request->user()->id ?? 'unknown',
                'errors' => $e->errors()
            ]);
            
            return back()->withErrors($e->errors());

        } catch (\Exception $e) {
            Log::error('Verification error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? 'unknown',
                'exception' => get_class($e)
            ]);
            
            return back()->withErrors(['code' => 'An error occurred. Please try again.']);
        }
    }

    /**
     * Resend verification code via email, SMS, and/or WhatsApp
     * 
     * Request body should contain:
     * {
     *     "type": "email" | "sms" | "whatsapp" | "all"
     * }
     * 
     * Includes cooldown protection to prevent spam
     * 
     * @param Request $request
     * @return RedirectResponse
     */
    public function resend(Request $request): RedirectResponse
    {
        // Validate the channel type
        $request->validate([
            'type' => 'required|in:email,sms,whatsapp,all',
        ]);

        $user = $request->user();
        $type = $request->input('type');

        try {
            // CHECK RESEND COOLDOWN
            if (!VerificationRateLimitService::canResendCode($user, $type)) {
                $cooldown = VerificationRateLimitService::getResendCooldownSeconds($user, $type);
                
                Log::info('Resend cooldown active', [
                    'user_id' => $user->id,
                    'type' => $type,
                    'cooldown_seconds' => $cooldown
                ]);

                throw ValidationException::withMessages([
                    'resend' => "Please wait {$cooldown} seconds before requesting another code.",
                ]);
            }

            // Generate ONE code for all channels (same code everywhere)
            $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            // Track which channels are being used
            $successfulChannels = [];
            $failedChannels = [];
            $channels = self::parseChannels($type);

            // Invalidate all previous unverified codes for this user
            \App\Models\VerificationCode::where('user_id', $user->id)
                ->where('verified_at', null)
                ->delete();

            // Send via email if requested
            if (in_array('email', $channels)) {
                try {
                    VerificationService::sendVerificationCode($user, 'email', 'email_verification', $code);
                    $successfulChannels[] = 'email';

                    Log::info('Email verification code sent', [
                        'user_id' => $user->id,
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send email verification code', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage()
                    ]);
                    $failedChannels[] = 'email';
                }
            }

            // Send via SMS if requested
            if (in_array('sms', $channels)) {
                try {
                    $this->sendPhoneVerificationCode($user, $code, 'sms');
                    $successfulChannels[] = 'SMS';

                    Log::info('SMS verification code sent', [
                        'user_id' => $user->id,
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send SMS verification code', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage()
                    ]);
                    $failedChannels[] = 'SMS';
                }
            }

            // Send via WhatsApp if requested
            if (in_array('whatsapp', $channels)) {
                try {
                    $this->sendPhoneVerificationCode($user, $code, 'whatsapp');
                    $successfulChannels[] = 'WhatsApp';

                    Log::info('WhatsApp verification code sent', [
                        'user_id' => $user->id,
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send WhatsApp verification code', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage()
                    ]);
                    $failedChannels[] = 'WhatsApp';
                }
            }

            // If no channels were successful, throw error
            if (empty($successfulChannels)) {
                Log::error('All verification channels failed', [
                    'user_id' => $user->id,
                    'type' => $type
                ]);

                throw new \Exception('Failed to send code via any channel');
            }

            // Record resend time for cooldown
            VerificationRateLimitService::recordResend($user, $type);

            // Build the response message
            $messageText = 'Verification code resent to: ' . implode(', ', $successfulChannels);
            if (!empty($failedChannels)) {
                $messageText .= '. Failed to send to: ' . implode(', ', $failedChannels);
            }

            Log::info('Verification code resent', [
                'user_id' => $user->id,
                'type' => $type,
                'successful_channels' => $successfulChannels,
                'failed_channels' => $failedChannels
            ]);

            // Return JSON or redirect based on request type
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $messageText,
                    'sent' => $successfulChannels,
                    'failed' => $failedChannels,
                ]);
            }

            return back()->with('status', $messageText);

        } catch (ValidationException $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'errors' => $e->errors()
                ], 422);
            }
            return back()->withErrors($e->errors());

        } catch (\Exception $e) {
            Log::error('Error resending verification code: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'type' => $type
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to resend code. Please try again.'
                ], 500);
            }

            return back()->withErrors(['error' => 'Failed to resend code']);
        }
    }

    /**
     * Send phone verification code via SMS or WhatsApp
     * 
     * This method handles sending verification codes through either SMS or WhatsApp
     * It stores the code in the database and sends it via the specified channel
     * 
     * @param \App\Models\User $user
     * @param string $code The 6-digit verification code
     * @param string $channel 'sms' or 'whatsapp'
     * @return void
     * @throws \Exception
     */
    private function sendPhoneVerificationCode($user, string $code, string $channel = 'sms'): void
    {
        try {
            if ($channel === 'sms') {
                // Store code in database for SMS verification
                \App\Models\VerificationCode::create([
                    'user_id' => $user->id,
                    'code' => $code,
                    'type' => 'phone',
                    'expires_at' => now()->addMinutes(15),
                ]);

                // Send SMS via SmsService
                $message = "Your Lixnet verification code is: {$code}. Valid for 15 minutes.";
                $smsResult = $this->smsService->send($user->phone, $message);

                if (!$smsResult['success']) {
                    Log::warning('Failed to send phone verification SMS', [
                        'user_id' => $user->id,
                        'error' => $smsResult['error'] ?? 'Unknown error'
                    ]);
                    throw new \Exception('Failed to send SMS code: ' . ($smsResult['error'] ?? 'Unknown error'));
                }

                Log::info('Phone verification code sent via SMS', [
                    'user_id' => $user->id,
                ]);

            } elseif ($channel === 'whatsapp') {
                // Store code in database for WhatsApp verification
                \App\Models\VerificationCode::create([
                    'user_id' => $user->id,
                    'code' => $code,
                    'type' => 'phone',
                    'expires_at' => now()->addMinutes(15),
                ]);

                // Send WhatsApp via WhatsappService
                $whatsappResult = $this->whatsappService->sendVerificationCode($user->phone, $code);

                if (!$whatsappResult['success']) {
                    Log::warning('Failed to send phone verification via WhatsApp', [
                        'user_id' => $user->id,
                        'error' => $whatsappResult['error'] ?? 'Unknown error'
                    ]);
                    throw new \Exception('Failed to send WhatsApp code: ' . ($whatsappResult['error'] ?? 'Unknown error'));
                }

                Log::info('Phone verification code sent via WhatsApp', [
                    'user_id' => $user->id,
                ]);
            }

        } catch (\Exception $e) {
            Log::error("Error sending {$channel} verification code: " . $e->getMessage(), [
                'user_id' => $user->id
            ]);
            throw $e;
        }
    }

    /**
     * Parse channel type string and return array of channels
     * 
     * Converts shorthand channel types to arrays of actual channels
     * Example: 'email_sms' => ['email', 'sms']
     * 
     * @param string $type
     * @return array
     */
    private static function parseChannels(string $type): array
    {
        return match($type) {
            'email' => ['email'],
            'sms' => ['sms'],
            'whatsapp' => ['whatsapp'],
            'all' => ['email', 'sms', 'whatsapp'],
            default => ['email']
        };
    }

    /**
     * Mask phone number for display
     * 
     * @param string $phone
     * @return string Masked phone number
     */
    private function maskPhone(string $phone): string
    {
        return substr($phone, 0, 3) . '****' . substr($phone, -2);
    }
}