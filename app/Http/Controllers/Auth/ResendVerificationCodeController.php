<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\VerificationService;
use App\Services\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ResendVerificationCodeController extends Controller
{
    protected $smsService;

    public function __construct(SmsService $smsService)
    {
        $this->smsService = $smsService;
    }

    /**
     * Resend verification code (email or phone)
     * POST /verification/resend
     */
    public function resend(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'type' => 'required|in:email,phone,both',
            ]);

            $user = $request->user();
            $type = $request->input('type');

            // Check if already verified
            if ($type === 'email' || $type === 'both') {
                if ($user->hasVerifiedEmail()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Email is already verified'
                    ], 422);
                }
            }

            if ($type === 'phone' || $type === 'both') {
                if ($user->hasVerifiedPhone()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Phone is already verified'
                    ], 422);
                }
            }

            // Generate a SINGLE code to use for both email and SMS
            $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            $messages = [];
            $sent = [];

            // Send email code if requested or "both"
            if ($type === 'email' || $type === 'both') {
                // Invalidate previous email codes
                \App\Models\VerificationCode::where('user_id', $user->id)
                    ->where('type', 'email')
                    ->where('verified_at', null)
                    ->delete();

                // Store the code for email
                \App\Models\VerificationCode::create([
                    'user_id' => $user->id,
                    'code' => $code,
                    'type' => 'email',
                    'expires_at' => now()->addMinutes(15),
                ]);

                // Send email with the code
                \Illuminate\Support\Facades\Mail::send(new \App\Mail\VerificationCodeMail($user, $code, 'email_verification'));

                $messages[] = 'Verification code sent to your email';
                $sent[] = 'email';
                
                Log::info('Email verification code resent', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'code' => substr($code, 0, 3) . '***'
                ]);
            }

            // Send phone code if requested or "both" - USE THE SAME CODE
            if ($type === 'phone' || $type === 'both') {
                // Invalidate previous phone codes
                \App\Models\VerificationCode::where('user_id', $user->id)
                    ->where('type', 'phone')
                    ->where('verified_at', null)
                    ->delete();

                // Store the SAME code for phone
                \App\Models\VerificationCode::create([
                    'user_id' => $user->id,
                    'code' => $code,
                    'type' => 'phone',
                    'expires_at' => now()->addMinutes(15),
                ]);

                // Send SMS with the SAME code
                $smsMessage = "Your Lixnet verification code is: {$code}. Valid for 15 minutes.";
                $smsResult = $this->smsService->send($user->phone, $smsMessage);

                if (!$smsResult['success']) {
                    Log::warning('Failed to send phone verification SMS', [
                        'user_id' => $user->id,
                        'phone' => $user->phone,
                        'error' => $smsResult['error']
                    ]);
                    throw new \Exception('Failed to send SMS code: ' . ($smsResult['error'] ?? 'Unknown error'));
                }

                $messages[] = 'Verification code sent to your phone';
                $sent[] = 'phone';
                
                Log::info('Phone verification code resent via SMS', [
                    'user_id' => $user->id,
                    'phone' => $user->phone,
                    'code' => substr($code, 0, 3) . '***'
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => implode(' & ', $messages),
                'sent' => $sent,
                'type' => $type
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error resending verification code: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? 'unknown',
                'type' => $request->input('type') ?? 'unknown'
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to resend code. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Send phone verification code via SMS
     */
    private function sendPhoneVerificationCode($user, $code = null): void
    {
        // Generate code if not provided
        if (!$code) {
            $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        }

        // Invalidate previous codes
        \App\Models\VerificationCode::where('user_id', $user->id)
            ->where('type', 'phone')
            ->where('verified_at', null)
            ->delete();

        // Store code
        \App\Models\VerificationCode::create([
            'user_id' => $user->id,
            'code' => $code,
            'type' => 'phone',
            'expires_at' => now()->addMinutes(15),
        ]);

        // Send SMS
        $message = "Your Lixnet verification code is: {$code}. Valid for 15 minutes.";
        $smsResult = $this->smsService->send($user->phone, $message);

        if (!$smsResult['success']) {
            Log::warning('Failed to send phone verification SMS', [
                'user_id' => $user->id,
                'phone' => $user->phone,
                'error' => $smsResult['error']
            ]);
            throw new \Exception('Failed to send SMS code: ' . ($smsResult['error'] ?? 'Unknown error'));
        }

        Log::info('Phone verification code sent via SMS', [
            'user_id' => $user->id,
            'phone' => $user->phone
        ]);
    }
}