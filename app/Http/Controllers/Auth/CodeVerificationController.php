<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\VerificationService;
use App\Services\SmsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;

class CodeVerificationController extends Controller
{
    protected $smsService;

    public function __construct(SmsService $smsService)
    {
        $this->smsService = $smsService;
    }

    /**
     * Show the code verification page.
     */
    public function create(Request $request): Response
    {
        $user = $request->user();
        $emailVerified = !is_null($user->email_verified_at);
        $phoneVerified = !is_null($user->phone_verified_at);

        return Inertia::render('auth/verify-code', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'email_verified' => $emailVerified,
                'phone_verified' => $phoneVerified,
            ],
        ]);
    }

    /**
     * Store verification code (handles both email and phone with same code).
     */
    public function store(Request $request): RedirectResponse
    {
        try {
            $request->validate([
                'code' => 'required|string|size:6',
            ]);

            $user = $request->user();
            $code = $request->input('code');

            Log::info('Verification attempt', [
                'user_id' => $user->id,
                'code_received' => substr($code, 0, 3) . '***',
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
                        'email' => $user->email
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
                        'phone' => $user->phone
                    ]);
                }
            } else {
                $phoneVerified = true;
            }

            // If both are verified (either just now or already were), redirect with success
            if ($emailVerified && $phoneVerified) {
                return redirect()->intended(route('marketplace'))->with('status', 'Account verified successfully!');
            }

            // If code was invalid or expired
            throw ValidationException::withMessages([
                'code' => 'The verification code is invalid or expired.',
            ]);

        } catch (ValidationException $e) {
            Log::warning('Verification failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors(['code' => 'The verification code is invalid or expired.']);
        } catch (\Exception $e) {
            Log::error('Verification error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id
            ]);
            
            return back()->withErrors(['code' => 'An error occurred. Please try again.']);
        }
    }

    /**
     * Resend verification code (both email and phone).
     */
    public function resend(Request $request): RedirectResponse
    {
        $request->validate([
            'type' => 'required|in:email,phone,both',
        ]);

        $user = $request->user();
        $type = $request->input('type');

        try {
            // Generate ONE code for both
            $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            if ($type === 'email' || $type === 'both') {
                VerificationService::sendVerificationCode($user, 'email', 'email_verification', $code);
            }

            if ($type === 'phone' || $type === 'both') {
                $this->sendPhoneVerificationCode($user, $code);
            }

            Log::info('Verification code resent', [
                'user_id' => $user->id,
                'type' => $type
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Verification code resent to your email and phone',
                ]);
            }

            return back()->with('status', 'Verification code resent to your email and phone');
        } catch (\Exception $e) {
            Log::error('Error resending verification code: ' . $e->getMessage());

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to resend code'
                ], 500);
            }

            return back()->withErrors(['error' => 'Failed to resend code']);
        }
    }

    /**
     * Send phone verification code via SMS
     */
    private function sendPhoneVerificationCode($user, string $code): void
    {
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
    }
}