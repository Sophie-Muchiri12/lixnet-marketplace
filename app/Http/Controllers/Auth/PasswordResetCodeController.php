<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\VerificationCode;
use App\Services\VerificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetCodeController extends Controller
{
    /**
     * Show the code verification page for password reset.
     */
    public function verifyCode(): Response
    {
        return Inertia::render('auth/verify-password-reset-code');
    }

    /**
     * Verify the password reset code and show password reset form.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !VerificationService::verifyCode($user, $request->code, 'email')) {
            throw ValidationException::withMessages([
                'code' => 'The reset code is invalid or expired.',
            ]);
        }

        // Store email in session for password reset form
        $request->session()->put('password_reset_email', $request->email);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Code verified successfully',
                'redirect' => route('password.reset-form'),
            ]);
        }

        return redirect()->route('password.reset-form')->with('status', 'Code verified. Please enter your new password.');
    }

    /**
     * Show the password reset form.
     */
    public function resetForm(): Response
    {
        return Inertia::render('auth/reset-password-form');
    }

    /**
     * Update the password.
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $email = $request->session()->get('password_reset_email');

        if (!$email) {
            throw ValidationException::withMessages([
                'password' => 'Password reset session expired. Please start over.',
            ]);
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'password' => 'User not found.',
            ]);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        // Clear session data
        $request->session()->forget('password_reset_email');

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Password reset successfully',
                'redirect' => route('login'),
            ]);
        }

        return redirect()->route('login')->with('status', 'Password reset successfully. Please log in.');
    }
}