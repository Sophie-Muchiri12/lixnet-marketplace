<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\VerificationService;
use App\Services\SmsService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    protected $smsService;

    public function __construct(SmsService $smsService)
    {
        $this->smsService = $smsService;
    }

    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
                'phone' => 'required|string|min:9|max:15|unique:' . User::class,
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
            ]);

            // Format and validate phone number
            $phoneNumber = $this->formatPhoneNumber($request->phone);
            if (!$phoneNumber) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid phone number format. Use: 0712345678, +254712345678, or 254712345678'
                ], 422) instanceof Response ? back()->withErrors(['phone' => 'Invalid phone number format']) : response()->json([
                    'success' => false,
                    'message' => 'Invalid phone number format'
                ], 422);
            }

            // Create user with unverified status
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $phoneNumber,
                'password' => Hash::make($request->password),
                'role' => 'user',
                'email_verified_at' => null,
            ]);

            Log::info('New user registered', [
                'user_id' => $user->id,
                'email' => $user->email,
                'phone' => $user->phone
            ]);

            event(new Registered($user));

            // Generate ONE code to use for both email and SMS
            $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            // Send verification code to email WITH the same code
            VerificationService::sendVerificationCode($user, 'email', 'email_verification', $code);

            // Send the SAME verification code via SMS
            $this->sendPhoneVerificationCode($user, $code);

            Auth::login($user);

            if ($request->expectsJson()) {
                return response()->json([
                    'user' => $user,
                    'redirect' => route('verification.notice'),
                    'message' => 'Registration successful. Verification codes sent to your email and phone.',
                ]);
            }

            return redirect()->route('verification.notice')->with('status', 'Registration successful. Check your email and SMS for verification codes.');
        } catch (\Exception $e) {
            Log::error('Registration error: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Registration failed',
                    'error' => config('app.debug') ? $e->getMessage() : 'Server error'
                ], 500);
            }

            return back()->withErrors(['error' => 'Registration failed. Please try again.']);
        }
    }

    /**
     * Format and validate phone number
     * Accepts: 0712345678, +254712345678, 254712345678
     */
    private function formatPhoneNumber(string $phone): ?string
    {
        // Remove all non-numeric characters except +
        $phone = preg_replace('/[^\d+]/', '', $phone);

        // If starts with +, remove it
        if (strpos($phone, '+') === 0) {
            $phone = str_replace('+', '', $phone);
        } elseif (strpos($phone, '0') === 0) {
            // If starts with 0, replace with country code
            $phone = '254' . substr($phone, 1);
        }

        // Validate length
        if (strlen($phone) < 10 || strlen($phone) > 15) {
            return null;
        }

        return $phone;
    }

    /**
     * Send phone verification code via SMS
     * Uses the PROVIDED code (same as email)
     */
    private function sendPhoneVerificationCode(User $user, string $code): void
    {
        try {
            // Store the code for phone verification
            \App\Models\VerificationCode::create([
                'user_id' => $user->id,
                'code' => $code,
                'type' => 'phone',
                'expires_at' => now()->addMinutes(15),
            ]);

            // Send SMS with the same code
            $message = "Your Lixnet verification code is: {$code}. Valid for 15 minutes.";
            $smsResult = $this->smsService->send($user->phone, $message);

            if ($smsResult['success']) {
                Log::info('Phone verification code SMS sent', [
                    'user_id' => $user->id,
                    'phone' => $user->phone
                ]);
            } else {
                Log::warning('Failed to send phone verification SMS', [
                    'user_id' => $user->id,
                    'phone' => $user->phone,
                    'error' => $smsResult['error'] ?? 'Unknown error'
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error sending phone verification code: ' . $e->getMessage());
        }
    }
}