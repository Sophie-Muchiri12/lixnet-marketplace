<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\VerificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Show the password reset link request page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // Check if user exists
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Don't reveal if user exists (security best practice)
            return back()->with('status', 'If an account exists with that email, a reset code will be sent.');
        }

        // Send verification code for password reset
        VerificationService::sendVerificationCode($user, 'email', 'password_reset');

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'If an account exists with that email, a reset code will be sent.',
                'redirect' => route('password.code-verify'),
            ]);
        }

        return back()->with('status', 'If an account exists with that email, a reset code will be sent.');
    }
}