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

            // Try to verify as email first if not already verified
            if (!$user->hasVerifiedEmail()) {
                if (VerificationService::verifyCode($user, $code, 'email')) {
                    // Mark email as verified
                    $user->email_verified_at = now();
                    $user->save();

                    Log::info('Email verified successfully', [
                        'user_id' => $user->id,
                        'email' => $user->email
                    ]);

                    // Check if phone is also verified now
                    if ($user->hasVerifiedPhone()) {
                        return redirect()->intended(route('marketplace'))->with('status', 'Account verified successfully!');
                    }

                    return back()->with('status', 'Email verified! Now verify your phone with the same code.');
                }
            }

            // Try to verify as phone if not already verified
            if (!$user->hasVerifiedPhone()) {
                if (VerificationService::verifyCode($user, $code, 'phone')) {
                    // Mark phone as verified
                    $user->phone_verified_at = now();
                    $user->save();

                    Log::info('Phone verified successfully', [
                        'user_id' => $user->id,
                        'phone' => $user->phone
                    ]);

                    // Check if email is also verified
                    if ($user->hasVerifiedEmail()) {
                        return redirect()->intended(route('marketplace'))->with('status', 'Account verified successfully!');
                    }

                    return back()->with('status', 'Phone verified! Now verify your email with the same code.');
                }
            }

            // If we get here, code was invalid or both already verified
            if ($user->hasVerifiedEmail() && $user->hasVerifiedPhone()) {
                return redirect()->intended(route('marketplace'))->with('status', 'Account already verified!');
            }

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
     * Verify email specifically
     */
    public function verifyEmail(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = $request->user();

        if (!VerificationService::verifyCode($user, $request->code, 'email')) {
            throw ValidationException::withMessages([
                'email_code' => 'The verification code is invalid or expired.',
            ]);
        }

        // Mark email as verified
        $user->email_verified_at = now();
        $user->save();

        Log::info('Email verified', [
            'user_id' => $user->id,
            'email' => $user->email
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Email verified successfully',
                'redirect' => route('verification.notice'),
            ]);
        }

        return back()->with('status', 'Email verified successfully!');
    }

    /**
     * Verify phone specifically
     */
    public function verifyPhone(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = $request->user();

        if (!VerificationService::verifyCode($user, $request->code, 'phone')) {
            throw ValidationException::withMessages([
                'phone_code' => 'The verification code is invalid or expired.',
            ]);
        }

        // Mark phone as verified
        $user->phone_verified_at = now();
        $user->save();

        Log::info('Phone verified', [
            'user_id' => $user->id,
            'phone' => $user->phone
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Phone verified successfully',
                'redirect' => route('marketplace'),
            ]);
        }

        return back()->with('status', 'Phone verified successfully!');
    }

    /**
     * Resend verification code (email or phone).
     */
    public function resend(Request $request): RedirectResponse
    {
        $request->validate([
            'type' => 'required|in:email,phone',
        ]);

        $user = $request->user();
        $type = $request->input('type');

        try {
            if ($type === 'email') {
                VerificationService::sendVerificationCode($user, 'email', 'email_verification');
                $message = 'Verification code sent to your email';
            } else {
                // Send phone verification code
                $this->sendPhoneVerificationCode($user);
                $message = 'Verification code sent to your phone';
            }

            Log::info('Verification code resent', [
                'user_id' => $user->id,
                'type' => $type
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $message,
                ]);
            }

            return back()->with('status', $message);
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
    private function sendPhoneVerificationCode($user): void
    {
        // Generate 6-digit code
        $phoneCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Invalidate previous codes
        \App\Models\VerificationCode::where('user_id', $user->id)
            ->where('type', 'phone')
            ->where('verified_at', null)
            ->delete();

        // Store code
        \App\Models\VerificationCode::create([
            'user_id' => $user->id,
            'code' => $phoneCode,
            'type' => 'phone',
            'expires_at' => now()->addMinutes(15),
        ]);

        // Send SMS
        $message = "Your Lixnet verification code is: {$phoneCode}. Valid for 15 minutes.";
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