<?php

namespace App\Services;

use App\Mail\VerificationCodeMail;
use App\Models\User;
use App\Models\VerificationCode;
use Illuminate\Support\Facades\Mail;

class VerificationService
{
    /**
     * Generate and send verification code
     * 
     * @param User $user
     * @param string $type
     * @param string $purpose
     * @param string|null $code Optional: use a specific code instead of generating one
     */
    public static function sendVerificationCode(
        User $user,
        string $type = 'email',
        string $purpose = 'email_verification',
        ?string $code = null
    ): VerificationCode {
        // Generate 6-digit code if not provided
        if ($code === null) {
            $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        }

        // Invalidate previous unverified codes
        VerificationCode::where('user_id', $user->id)
            ->where('type', $type)
            ->where('verified_at', null)
            ->delete();

        // Create new verification code (valid for 15 minutes)
        $verificationCode = VerificationCode::create([
            'user_id' => $user->id,
            'code' => $code,
            'type' => $type,
            'expires_at' => now()->addMinutes(15),
        ]);

        // Send email if type is email
        if ($type === 'email') {
            Mail::send(new VerificationCodeMail($user, $code, $purpose));
        }

        // For SMS, you'll handle it in a separate service later

        return $verificationCode;
    }

    /**
     * Verify the code
     */
    public static function verifyCode(
        User $user,
        string $code,
        string $type = 'email'
    ): bool {
        $verification = VerificationCode::where('user_id', $user->id)
            ->where('code', $code)
            ->where('type', $type)
            ->first();

        if (!$verification || !$verification->isValid()) {
            return false;
        }

        $verification->markAsVerified();

        return true;
    }

    /**
     * Get valid code for user
     */
    public static function getValidCode(User $user, string $type = 'email'): ?VerificationCode
    {
        return VerificationCode::where('user_id', $user->id)
            ->where('type', $type)
            ->where('verified_at', null)
            ->where('expires_at', '>', now())
            ->first();
    }
}