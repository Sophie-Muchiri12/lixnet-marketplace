<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Auth\CodeVerificationController;
use App\Http\Controllers\Auth\PasswordResetCodeController;
use App\Http\Controllers\Auth\ResendVerificationCodeController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store'])
        ->name('register.store');

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store'])
        ->name('login.store');

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    // Password reset with code verification
    Route::get('password-reset/verify-code', [PasswordResetCodeController::class, 'verifyCode'])
        ->name('password.code-verify');

    Route::post('password-reset/verify-code', [PasswordResetCodeController::class, 'store'])
        ->name('password.code-verify.store');

    Route::get('password-reset/new-password', [PasswordResetCodeController::class, 'resetForm'])
        ->name('password.reset-form');

    Route::post('password-reset/new-password', [PasswordResetCodeController::class, 'updatePassword'])
        ->name('password.code-reset.update');

    // Legacy password reset routes (optional, can be removed)
    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

Route::middleware('auth')->group(function () {
    // Email and phone verification with code
    Route::get('verify-email', [CodeVerificationController::class, 'create'])
        ->name('verification.notice');

    // Main verification endpoint - handles single code for both email and phone
    Route::post('verify-email', [CodeVerificationController::class, 'store'])
        ->name('verification.verify');

    // Verify email specifically
    Route::post('verify-email/email', [CodeVerificationController::class, 'verifyEmail'])
        ->name('verification.verify-email');

    // Verify phone specifically
    Route::post('verify-email/phone', [CodeVerificationController::class, 'verifyPhone'])
        ->name('verification.verify-phone');

    // Resend code (email or phone) - API endpoint
    Route::post('verification/resend', [ResendVerificationCodeController::class, 'resend'])
        ->name('verification.resend.api')
        ->middleware('throttle:3,1');

    // Resend code (email or phone) - Web form endpoint
    Route::post('verify-email/resend', [CodeVerificationController::class, 'resend'])
        ->name('verification.resend')
        ->middleware('throttle:3,1');

    // Legacy email verification routes (optional, can be removed)
    Route::get('verify-email/{id}/{hash}', [VerifyEmailController::class])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify.legacy');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('password.confirm.store');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});