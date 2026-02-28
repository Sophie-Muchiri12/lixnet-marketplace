<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\VerificationService;
use App\Services\SmsService;
use App\Services\WhatsappService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    protected $smsService;
    protected $whatsappService;

    /**
     * Constructor - Inject SMS and WhatsApp services
     * 
     * @param SmsService $smsService
     * @param WhatsappService $whatsappService
     */
    public function __construct(SmsService $smsService, WhatsappService $whatsappService)
    {
        $this->smsService = $smsService;
        $this->whatsappService = $whatsappService;
    }

    /**
     * Show the registration page
     * 
     * @return Response
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request
     * 
     * Validates user input, creates a new user, and sends verification codes
     * via email, SMS, and WhatsApp simultaneously.
     * 
     * Uses database transactions to ensure data consistency.
     * 
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        try {
            // Validate incoming request data
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
                'phone' => 'required|string|min:9|max:15|unique:' . User::class,
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
            ]);

            // Format and validate phone number
            $phoneNumber = $this->formatPhoneNumber($request->phone);
            if (!$phoneNumber) {
                return $this->handleValidationError(
                    'Invalid phone number format. Use: 0712345678, +254712345678, or 254712345678',
                    'phone',
                    $request
                );
            }

            // Use transaction to ensure atomicity
            $user = DB::transaction(function () use ($request, $phoneNumber) {
                // Create user with unverified status
                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'phone' => $phoneNumber,
                    'password' => Hash::make($request->password),
                    'role' => 'user',
                    'email_verified_at' => null,
                    'phone_verified_at' => null,
                ]);

                Log::info('New user registered', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                ]);

                return $user;
            });

            // Fire the Registered event
            event(new Registered($user));

            // Generate ONE code to use for email, SMS, and WhatsApp
            $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            // Send verification code via all channels
            try {
                VerificationService::sendVerificationCode(
                    $user,
                    'email_sms',
                    'email_verification',
                    $code
                );

                Log::info('Verification codes sent for new user', [
                    'user_id' => $user->id,
                    'channels' => ['email', 'sms', 'whatsapp']
                ]);

            } catch (\Exception $e) {
                Log::error('Failed to send verification codes during registration', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage()
                ]);

                // Delete user if we can't send verification codes
                $user->delete();

                return $this->handleValidationError(
                    'Failed to send verification codes. Please try registering again.',
                    'registration',
                    $request
                );
            }

            // Automatically log in the user
            Auth::login($user);

            // Return different response based on request type
            if ($request->expectsJson()) {
                return response()->json([
                    'user' => $user,
                    'redirect' => route('verification.notice'),
                    'message' => 'Registration successful. Verification codes sent to your email, SMS, and WhatsApp.',
                ]);
            }

            return redirect()->route('verification.notice')
                ->with('status', 'Registration successful. Check your email, SMS, and WhatsApp for verification codes.');

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Registration validation failed', [
                'errors' => $e->errors()
            ]);

            return $this->handleValidationError(
                'Registration validation failed',
                'general',
                $request,
                $e->errors()
            );

        } catch (\Illuminate\Database\Eloquent\UniqueConstraintViolationException $e) {
            Log::warning('Duplicate user registration attempt', [
                'email' => $request->email,
                'phone' => $request->phone
            ]);

            return $this->handleValidationError(
                'Email or phone number already registered',
                'registration',
                $request
            );

        } catch (\Exception $e) {
            Log::error('Registration error: ' . $e->getMessage(), [
                'exception' => get_class($e)
            ]);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Registration failed. Please try again.',
                    'error' => config('app.debug') ? $e->getMessage() : null
                ], 500);
            }

            return back()
                ->withInput()
                ->withErrors(['error' => 'Registration failed. Please try again.']);
        }
    }

    /**
     * Format and validate phone number
     * 
     * Accepts multiple formats:
     * - 0712345678 (Kenya local format)
     * - +254712345678 (International with +)
     * - 254712345678 (International without +)
     * 
     * Returns format: 254712345678 (international without +)
     * 
     * @param string $phone
     * @return string|null
     */
    private function formatPhoneNumber(string $phone): ?string
    {
        // Remove all non-numeric characters except +
        $phone = preg_replace('/[^\d+]/', '', $phone);

        // If empty after sanitization, invalid
        if (empty($phone)) {
            return null;
        }

        // If starts with +, remove it
        if (strpos($phone, '+') === 0) {
            $phone = str_replace('+', '', $phone);
        } elseif (strpos($phone, '0') === 0) {
            // If starts with 0, replace with country code (Kenya)
            $phone = '254' . substr($phone, 1);
        }

        // Validate length (Kenya numbers are typically 12 digits with country code)
        if (strlen($phone) < 10 || strlen($phone) > 15) {
            return null;
        }

        // Validate it's all digits
        if (!preg_match('/^\d+$/', $phone)) {
            return null;
        }

        return $phone;
    }

    /**
     * Handle validation error response
     * 
     * @param string $message
     * @param string $field
     * @param Request $request
     * @param array $errors
     * @return \Illuminate\Http\Response
     */
    private function handleValidationError(
        string $message,
        string $field = 'general',
        Request $request,
        array $errors = []
    ) {
        if (empty($errors)) {
            $errors = [$field => $message];
        }

        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => $message,
                'errors' => $errors
            ], 422);
        }

        return back()
            ->withInput()
            ->withErrors($errors);
    }
}