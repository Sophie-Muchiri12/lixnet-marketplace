<?php

namespace App\Services;

use App\Mail\VerificationCodeMail;
use App\Models\User;
use App\Models\VerificationCode;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class VerificationService
{
    protected $whatsappService;
    protected $smsService;

    public function __construct(WhatsappService $whatsappService, SmsService $smsService)
    {
        $this->whatsappService = $whatsappService;
        $this->smsService = $smsService;
    }

    /**
     * Generate and send verification code via multiple channels.
     *
     * Stores separate DB records per verifiable type:
     *   - 'email'  → type='email'
     *   - 'sms' or 'whatsapp' → type='phone'
     *
     * This ensures CodeVerificationController can find the code when it
     * queries verifyCode($user, $code, 'email') and verifyCode($user, $code, 'phone').
     *
     * @param User        $user
     * @param string      $type    Channel: 'email','sms','whatsapp','all','email_sms','email_whatsapp','sms_whatsapp'
     * @param string      $purpose 'email_verification' | 'password_reset' etc.
     * @param string|null $code    Optional pre-generated code
     * @return VerificationCode    Returns the last created record
     * @throws \Exception
     */
    public static function sendVerificationCode(
        User $user,
        string $type = 'email',
        string $purpose = 'email_verification',
        ?string $code = null
    ): VerificationCode {
        try {
            if (!$user || !$user->id) {
                throw new \Exception('Invalid user provided');
            }

            if (empty($type)) {
                throw new \Exception('Channel type cannot be empty');
            }

            // Generate 6-digit code if not provided
            if ($code === null) {
                $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            }

            if (!preg_match('/^\d{6}$/', $code)) {
                throw new \Exception('Code must be exactly 6 digits');
            }

            $channels = self::parseChannels($type);

            // Determine which DB record types are needed
            $needsEmailRecord = in_array('email', $channels);
            $needsPhoneRecord = in_array('sms', $channels) || in_array('whatsapp', $channels);

            // Invalidate previous unverified codes for the affected record types
            $typesToClear = [];
            if ($needsEmailRecord) {
                $typesToClear[] = 'email';
            }
            if ($needsPhoneRecord) {
                $typesToClear[] = 'phone';
            }

            if (!empty($typesToClear)) {
                VerificationCode::where('user_id', $user->id)
                    ->whereIn('type', $typesToClear)
                    ->where('verified_at', null)
                    ->delete();
            }

            $verificationCode = null;

            // Store one record per verifiable type so verifyCode() can find it
            if ($needsEmailRecord) {
                $verificationCode = VerificationCode::create([
                    'user_id'    => $user->id,
                    'code'       => $code,
                    'type'       => 'email',
                    'expires_at' => now()->addMinutes(15),
                ]);
            }

            if ($needsPhoneRecord) {
                $verificationCode = VerificationCode::create([
                    'user_id'    => $user->id,
                    'code'       => $code,
                    'type'       => 'phone',
                    'expires_at' => now()->addMinutes(15),
                ]);
            }

            Log::info('Verification code generated', [
                'user_id'        => $user->id,
                'type'           => $type,
                'purpose'        => $purpose,
                'db_types_stored' => $typesToClear,
            ]);

            // Send via all requested channels
            self::sendViaChannels($user, $code, $type, $purpose);

            return $verificationCode;

        } catch (\Exception $e) {
            Log::error('Error generating verification code: ' . $e->getMessage(), [
                'user_id' => $user->id ?? 'unknown',
                'type'    => $type,
            ]);
            throw $e;
        }
    }

    /**
     * Send verification code via specified channels.
     */
    private static function sendViaChannels(User $user, string $code, string $type, string $purpose): void
    {
        try {
            $whatsappService = app(WhatsappService::class);
            $smsService      = app(SmsService::class);
            $channels        = self::parseChannels($type);

            if (in_array('email', $channels)) {
                try {
                    Mail::send(new VerificationCodeMail($user, $code, $purpose));
                    Log::info('Verification code sent via email', [
                        'user_id' => $user->id,
                        'purpose' => $purpose,
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send email verification code', [
                        'user_id' => $user->id,
                        'error'   => $e->getMessage(),
                    ]);
                }
            }

            if (in_array('sms', $channels) && $user->phone) {
                try {
                    $message   = "Your Lixnet verification code is: {$code}. Valid for 15 minutes.";
                    $smsResult = $smsService->send($user->phone, $message);

                    if ($smsResult['success']) {
                        Log::info('Verification code sent via SMS', [
                            'user_id' => $user->id,
                            'purpose' => $purpose,
                        ]);
                    } else {
                        Log::warning('Failed to send SMS verification code', [
                            'user_id' => $user->id,
                            'error'   => $smsResult['error'] ?? 'Unknown error',
                            'purpose' => $purpose,
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Exception sending SMS verification code', [
                        'user_id' => $user->id,
                        'error'   => $e->getMessage(),
                    ]);
                }
            }

            if (in_array('whatsapp', $channels) && $user->phone) {
                try {
                    $whatsappResult = $whatsappService->sendVerificationCode($user->phone, $code);

                    if ($whatsappResult['success']) {
                        Log::info('Verification code sent via WhatsApp', [
                            'user_id' => $user->id,
                            'purpose' => $purpose,
                        ]);
                    } else {
                        Log::warning('Failed to send WhatsApp verification code', [
                            'user_id' => $user->id,
                            'error'   => $whatsappResult['error'] ?? 'Unknown error',
                            'code'    => $whatsappResult['code'] ?? 'UNKNOWN',
                            'purpose' => $purpose,
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Exception sending WhatsApp verification code', [
                        'user_id' => $user->id,
                        'error'   => $e->getMessage(),
                    ]);
                }
            }

        } catch (\Exception $e) {
            Log::error('Error in sendViaChannels: ' . $e->getMessage(), [
                'user_id' => $user->id,
            ]);
        }
    }

    /**
     * Parse channel string into an array of individual channels.
     */
    private static function parseChannels(string $type): array
    {
        return match($type) {
            'email'           => ['email'],
            'sms'             => ['sms'],
            'whatsapp'        => ['whatsapp'],
            'email_sms'       => ['email', 'sms'],
            'email_whatsapp'  => ['email', 'whatsapp'],
            'sms_whatsapp'    => ['sms', 'whatsapp'],
            'all'             => ['email', 'sms', 'whatsapp'],
            default           => ['email'],
        };
    }

    /**
     * Verify a submitted code against the database.
     *
     * @param User   $user
     * @param string $code  6-digit code
     * @param string $type  'email' or 'phone'
     * @return bool
     */
    public static function verifyCode(
        User $user,
        string $code,
        string $type = 'email'
    ): bool {
        try {
            if (!preg_match('/^\d{6}$/', $code)) {
                return false;
            }

            $verification = VerificationCode::where('user_id', $user->id)
                ->where('code', $code)
                ->where('type', $type)
                ->first();

            if (!$verification || !$verification->isValid()) {
                return false;
            }

            $verification->markAsVerified();

            Log::info('Code verified successfully', [
                'user_id' => $user->id,
                'type'    => $type,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Error verifying code: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'type'    => $type,
            ]);
            return false;
        }
    }

    /**
     * Get the current valid (unexpired, unverified) code for a user.
     *
     * @param User   $user
     * @param string $type  'email' or 'phone'
     * @return VerificationCode|null
     */
    public static function getValidCode(User $user, string $type = 'email'): ?VerificationCode
    {
        return VerificationCode::where('user_id', $user->id)
            ->where('type', $type)
            ->where('verified_at', null)
            ->where('expires_at', '>', now())
            ->first();
    }

    /**
     * Generate and send a password reset code.
     *
     * Stores record with type='email' so PasswordResetCodeController::store()
     * can verify it via verifyCode($user, $code, 'email').
     *
     * @param User        $user
     * @param string      $type
     * @param string|null $code
     * @return VerificationCode
     * @throws \Exception
     */
    public static function sendPasswordResetCode(
        User $user,
        string $type = 'email',
        ?string $code = null
    ): VerificationCode {
        try {
            if ($code === null) {
                $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            }

            $channels      = self::parseChannels($type);
            $typesToClear  = [];

            if (in_array('email', $channels)) {
                $typesToClear[] = 'email';
            }
            if (in_array('sms', $channels) || in_array('whatsapp', $channels)) {
                $typesToClear[] = 'phone';
            }

            if (!empty($typesToClear)) {
                VerificationCode::where('user_id', $user->id)
                    ->whereIn('type', $typesToClear)
                    ->where('verified_at', null)
                    ->delete();
            }

            $verificationCode = null;

            if (in_array('email', $channels)) {
                $verificationCode = VerificationCode::create([
                    'user_id'    => $user->id,
                    'code'       => $code,
                    'type'       => 'email',
                    'expires_at' => now()->addMinutes(15),
                ]);
            }

            if (in_array('sms', $channels) || in_array('whatsapp', $channels)) {
                $verificationCode = VerificationCode::create([
                    'user_id'    => $user->id,
                    'code'       => $code,
                    'type'       => 'phone',
                    'expires_at' => now()->addMinutes(15),
                ]);
            }

            Log::info('Password reset code generated', [
                'user_id' => $user->id,
                'type'    => $type,
            ]);

            self::sendPasswordResetViaChannels($user, $code, $type);

            return $verificationCode;

        } catch (\Exception $e) {
            Log::error('Error sending password reset code: ' . $e->getMessage(), [
                'user_id' => $user->id,
            ]);
            throw $e;
        }
    }

    /**
     * Dispatch password reset messages via the resolved channels.
     */
    private static function sendPasswordResetViaChannels(User $user, string $code, string $type): void
    {
        try {
            $whatsappService = app(WhatsappService::class);
            $smsService      = app(SmsService::class);
            $channels        = self::parseChannels($type);

            if (in_array('email', $channels)) {
                try {
                    Mail::send(new VerificationCodeMail($user, $code, 'password_reset'));
                    Log::info('Password reset code sent via email', ['user_id' => $user->id]);
                } catch (\Exception $e) {
                    Log::error('Failed to send password reset email', [
                        'user_id' => $user->id,
                        'error'   => $e->getMessage(),
                    ]);
                }
            }

            if (in_array('sms', $channels) && $user->phone) {
                try {
                    $message = "Your Lixnet password reset code is: {$code}. Valid for 15 minutes.";
                    $result  = $smsService->send($user->phone, $message);

                    if ($result['success']) {
                        Log::info('Password reset code sent via SMS', ['user_id' => $user->id]);
                    } else {
                        Log::warning('Failed to send password reset SMS', [
                            'user_id' => $user->id,
                            'error'   => $result['error'] ?? 'Unknown error',
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Exception sending password reset SMS', [
                        'user_id' => $user->id,
                        'error'   => $e->getMessage(),
                    ]);
                }
            }

            if (in_array('whatsapp', $channels) && $user->phone) {
                try {
                    $result = $whatsappService->sendPasswordResetCode($user->phone, $code);

                    if ($result['success']) {
                        Log::info('Password reset code sent via WhatsApp', ['user_id' => $user->id]);
                    } else {
                        Log::warning('Failed to send password reset WhatsApp', [
                            'user_id' => $user->id,
                            'error'   => $result['error'] ?? 'Unknown error',
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Exception sending password reset WhatsApp', [
                        'user_id' => $user->id,
                        'error'   => $e->getMessage(),
                    ]);
                }
            }

        } catch (\Exception $e) {
            Log::error('Error in sendPasswordResetViaChannels: ' . $e->getMessage());
        }
    }

    /**
     * Check if a VerificationCode model instance is still valid.
     */
    public static function isCodeValid(VerificationCode $code): bool
    {
        return $code->verified_at === null && $code->expires_at > now();
    }
}