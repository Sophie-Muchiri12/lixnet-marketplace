<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\VerificationCode;
use App\Services\VerificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetCodeController extends Controller
{
    /**
     * Session key for storing password reset email
     */
    private const SESSION_KEY_EMAIL = 'password_reset_email';
    
    /**
     * Session key for storing reset timestamp
     */
    private const SESSION_KEY_TIMESTAMP = 'password_reset_timestamp';
    
    /**
     * Password reset session timeout in minutes
     */
    private const SESSION_TIMEOUT_MINUTES = 15;

    /**
     * Show the code verification page for password reset
     * 
     * @return Response
     */
    public function verifyCode(): Response
    {
        return Inertia::render('auth/verify-password-reset-code');
    }

    /**
     * Verify the password reset code and show password reset form
     * 
     * @param Request $request
     * @return RedirectResponse
     */
    public function store(Request $request): RedirectResponse
    {
        try {
            // Validate input
            $request->validate([
                'email' => 'required|email|exists:users,email',
                'code' => 'required|string|size:6|regex:/^\d+$/',
            ]);

            $user = User::where('email', $request->email)->first();

            if (!$user) {
                throw ValidationException::withMessages([
                    'email' => 'User not found.',
                ]);
            }

            // Verify the code
            if (!VerificationService::verifyCode($user, $request->code, 'email')) {
                Log::warning('Invalid password reset code', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'ip' => $request->ip()
                ]);

                throw ValidationException::withMessages([
                    'code' => 'The reset code is invalid or expired.',
                ]);
            }

            // Store email and timestamp in session for password reset form
            $request->session()->put(self::SESSION_KEY_EMAIL, $request->email);
            $request->session()->put(self::SESSION_KEY_TIMESTAMP, now());

            Log::info('Password reset code verified', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Code verified successfully',
                    'redirect' => route('password.reset-form'),
                ]);
            }

            return redirect()->route('password.reset-form')
                ->with('status', 'Code verified. Please enter your new password.');

        } catch (ValidationException $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Verification failed',
                    'errors' => $e->errors()
                ], 422);
            }

            return back()->withErrors($e->errors());

        } catch (\Exception $e) {
            Log::error('Password reset code verification error: ' . $e->getMessage());

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'An error occurred. Please try again.'
                ], 500);
            }

            return back()->withErrors(['error' => 'An error occurred. Please try again.']);
        }
    }

    /**
     * Show the password reset form
     * 
     * @param Request $request
     * @return Response|RedirectResponse
     */
    public function resetForm(Request $request): Response|RedirectResponse
    {
        // Check if user has verified code in session
        if (!$request->session()->has(self::SESSION_KEY_EMAIL)) {
            return redirect()->route('password.code-verify')
                ->with('error', 'Please verify your reset code first.');
        }

        // Validate session hasn't expired
        if (!$this->isSessionValid($request)) {
            $request->session()->forget([self::SESSION_KEY_EMAIL, self::SESSION_KEY_TIMESTAMP]);

            return redirect()->route('password.code-verify')
                ->with('error', 'Password reset session expired. Please try again.');
        }

        return Inertia::render('auth/reset-password-form', [
            'email' => $request->session()->get(self::SESSION_KEY_EMAIL),
        ]);
    }

    /**
     * Update the password
     * 
     * @param Request $request
     * @return RedirectResponse
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        try {
            // Validate password input
            $request->validate([
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
            ]);

            // Check if email is in session
            $email = $request->session()->get(self::SESSION_KEY_EMAIL);
            if (!$email) {
                throw ValidationException::withMessages([
                    'password' => 'Password reset session expired. Please start over.',
                ]);
            }

            // Validate session hasn't expired
            if (!$this->isSessionValid($request)) {
                $request->session()->forget([self::SESSION_KEY_EMAIL, self::SESSION_KEY_TIMESTAMP]);

                throw ValidationException::withMessages([
                    'password' => 'Password reset session expired. Please start over.',
                ]);
            }

            // Find user
            $user = User::where('email', $email)->first();
            if (!$user) {
                throw ValidationException::withMessages([
                    'password' => 'User not found.',
                ]);
            }

            // Prevent reuse of same password
            if (Hash::check($request->password, $user->password)) {
                throw ValidationException::withMessages([
                    'password' => 'New password must be different from current password.',
                ]);
            }

            // Update password
            $user->password = Hash::make($request->password);
            $user->save();

            // Clear all verification codes for this user
            VerificationCode::where('user_id', $user->id)
                ->where('verified_at', null)
                ->delete();

            // Clear session data
            $request->session()->forget([self::SESSION_KEY_EMAIL, self::SESSION_KEY_TIMESTAMP]);

            Log::info('Password reset successfully', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Password reset successfully',
                    'redirect' => route('login'),
                ]);
            }

            return redirect()->route('login')
                ->with('status', 'Password reset successfully. Please log in with your new password.');

        } catch (ValidationException $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password reset failed',
                    'errors' => $e->errors()
                ], 422);
            }

            return back()->withErrors($e->errors());

        } catch (\Exception $e) {
            Log::error('Password reset error: ' . $e->getMessage());

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'An error occurred. Please try again.'
                ], 500);
            }

            return back()->withErrors(['error' => 'An error occurred. Please try again.']);
        }
    }

    /**
     * Check if password reset session is still valid
     * 
     * @param Request $request
     * @return bool
     */
    private function isSessionValid(Request $request): bool
    {
        $timestamp = $request->session()->get(self::SESSION_KEY_TIMESTAMP);

        if (!$timestamp) {
            return false;
        }

        // Check if session hasn't expired
        return $timestamp->diffInMinutes(now()) < self::SESSION_TIMEOUT_MINUTES;
    }

    /**
     * Get remaining session time in seconds
     * 
     * @param Request $request
     * @return int
     */
    public function getRemainingSessionTime(Request $request): int
    {
        $timestamp = $request->session()->get(self::SESSION_KEY_TIMESTAMP);

        if (!$timestamp) {
            return 0;
        }

        $elapsedSeconds = $timestamp->diffInSeconds(now());
        $totalSeconds = self::SESSION_TIMEOUT_MINUTES * 60;

        return max(0, $totalSeconds - $elapsedSeconds);
    }

    /**
     * Cancel password reset (clear session)
     * 
     * @param Request $request
     * @return RedirectResponse
     */
    public function cancel(Request $request): RedirectResponse
    {
        $request->session()->forget([self::SESSION_KEY_EMAIL, self::SESSION_KEY_TIMESTAMP]);

        return redirect()->route('login')
            ->with('status', 'Password reset cancelled.');
    }
}