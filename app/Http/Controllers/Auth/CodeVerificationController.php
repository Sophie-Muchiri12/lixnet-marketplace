<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\VerificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CodeVerificationController extends Controller
{
    /**
     * Show the code verification page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/verify-code', [
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
            ],
        ]);
    }

    /**
     * Verify the provided code.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = $request->user();

        if (!VerificationService::verifyCode($user, $request->code, 'email')) {
            throw ValidationException::withMessages([
                'code' => 'The verification code is invalid or expired.',
            ]);
        }

        // Mark email as verified
        $user->email_verified_at = now();
        $user->save();

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Email verified successfully',
                'redirect' => route('marketplace'),
            ]);
        }

        return redirect()->route('marketplace')->with('status', 'Email verified successfully!');
    }

    /**
     * Resend verification code.
     */
    public function resend(Request $request): RedirectResponse
    {
        $user = $request->user();

        VerificationService::sendVerificationCode($user, 'email', 'email_verification');

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Verification code sent to your email',
            ]);
        }

        return back()->with('status', 'Verification code sent to your email.');
    }
}