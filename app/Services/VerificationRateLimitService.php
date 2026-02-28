<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;

class VerificationRateLimitService
{
    private const CACHE_PREFIX = 'verification_attempt:';
    private const MAX_ATTEMPTS = 5;
    private const LOCKOUT_MINUTES = 15;
    private const RESEND_COOLDOWN_SECONDS = 60;

    /**
     * Check if user is rate limited for verification attempts
     * 
     * @param User $user
     * @param string $type Verification type (email, sms, whatsapp, all)
     * @return bool True if user is rate limited
     */
    public static function isAttemptRateLimited(User $user, string $type = 'all'): bool
    {
        $key = self::getCacheKey($user->id, $type, 'attempts');
        $attempts = Cache::get($key, 0);
        return $attempts >= self::MAX_ATTEMPTS;
    }

    /**
     * Record a failed verification attempt
     * 
     * @param User $user
     * @param string $type Verification type
     * @return int Current attempt count
     */
    public static function recordAttempt(User $user, string $type = 'all'): int
    {
        $key = self::getCacheKey($user->id, $type, 'attempts');
        $currentAttempts = Cache::get($key, 0);
        $newAttempts = $currentAttempts + 1;
        
        Cache::put(
            $key,
            $newAttempts,
            now()->addMinutes(self::LOCKOUT_MINUTES)
        );
        
        return $newAttempts;
    }

    /**
     * Get remaining verification attempts
     * 
     * @param User $user
     * @param string $type Verification type
     * @return int Number of remaining attempts
     */
    public static function getRemainingAttempts(User $user, string $type = 'all'): int
    {
        $key = self::getCacheKey($user->id, $type, 'attempts');
        $attempts = Cache::get($key, 0);
        return max(0, self::MAX_ATTEMPTS - $attempts);
    }

    /**
     * Check if user is currently locked out
     * 
     * @param User $user
     * @param string $type Verification type
     * @return bool True if user is locked out
     */
    public static function isLockedOut(User $user, string $type = 'all'): bool
    {
        return self::isAttemptRateLimited($user, $type);
    }

    /**
     * Get lockout time remaining in seconds
     * 
     * @param User $user
     * @param string $type Verification type
     * @return int Seconds remaining, 0 if not locked out
     */
    public static function getLockoutSecondsRemaining(User $user, string $type = 'all'): int
    {
        $key = self::getCacheKey($user->id, $type, 'attempts');
        
        // For Redis and other stores with TTL support
        if (method_exists(Cache::getStore(), 'connection')) {
            try {
                $ttl = Cache::getStore()->connection()->ttl($key);
                return max(0, $ttl);
            } catch (\Exception $e) {
                // Fall through to alternative method
            }
        }

        // For file and database stores, estimate based on LOCKOUT_MINUTES
        // This is a fallback - won't be perfectly accurate but sufficient
        $totalSeconds = self::LOCKOUT_MINUTES * 60;
        
        // Check if key exists - if it does, return default remaining time
        if (Cache::has($key)) {
            return self::LOCKOUT_MINUTES * 60;
        }
        
        return 0;
    }

    /**
     * Check if user can resend code (cooldown period)
     * 
     * @param User $user
     * @param string $type Verification type
     * @return bool True if user can resend
     */
    public static function canResendCode(User $user, string $type = 'all'): bool
    {
        $key = self::getCacheKey($user->id, $type, 'last_resend');
        return !Cache::has($key);
    }

    /**
     * Record resend time
     * 
     * @param User $user
     * @param string $type Verification type
     * @return void
     */
    public static function recordResend(User $user, string $type = 'all'): void
    {
        $key = self::getCacheKey($user->id, $type, 'last_resend');
        Cache::put(
            $key,
            true,
            now()->addSeconds(self::RESEND_COOLDOWN_SECONDS)
        );
    }

    /**
     * Get seconds until next resend is allowed
     * 
     * @param User $user
     * @param string $type Verification type
     * @return int Seconds to wait, 0 if can resend now
     */
    public static function getResendCooldownSeconds(User $user, string $type = 'all'): int
    {
        $key = self::getCacheKey($user->id, $type, 'last_resend');
        
        if (!Cache::has($key)) {
            return 0;
        }

        // For Redis and other stores with TTL support
        if (method_exists(Cache::getStore(), 'connection')) {
            try {
                $ttl = Cache::getStore()->connection()->ttl($key);
                return max(0, $ttl);
            } catch (\Exception $e) {
                // Fall through to alternative method
            }
        }

        // For file and database stores, return default cooldown
        // This is a fallback - won't be perfectly accurate but sufficient
        if (Cache::has($key)) {
            return self::RESEND_COOLDOWN_SECONDS;
        }
        
        return 0;
    }

    /**
     * Clear rate limit for user (for admins)
     * Use with caution - only for legitimate resets
     * 
     * @param User $user
     * @param string $type Verification type ('all' for all types)
     * @return void
     */
    public static function clearLimit(User $user, string $type = 'all'): void
    {
        if ($type === 'all') {
            // Clear all types
            Cache::forget(self::getCacheKey($user->id, 'email', 'attempts'));
            Cache::forget(self::getCacheKey($user->id, 'sms', 'attempts'));
            Cache::forget(self::getCacheKey($user->id, 'whatsapp', 'attempts'));
        } else {
            Cache::forget(self::getCacheKey($user->id, $type, 'attempts'));
        }
    }

    /**
     * Clear resend cooldown for user
     * 
     * @param User $user
     * @param string $type Verification type
     * @return void
     */
    public static function clearResendCooldown(User $user, string $type = 'all'): void
    {
        if ($type === 'all') {
            Cache::forget(self::getCacheKey($user->id, 'email', 'last_resend'));
            Cache::forget(self::getCacheKey($user->id, 'sms', 'last_resend'));
            Cache::forget(self::getCacheKey($user->id, 'whatsapp', 'last_resend'));
        } else {
            Cache::forget(self::getCacheKey($user->id, $type, 'last_resend'));
        }
    }

    /**
     * Get all rate limit info for a user
     * 
     * @param User $user
     * @return array Rate limit information
     */
    public static function getInfo(User $user): array
    {
        return [
            'email' => [
                'is_limited' => self::isAttemptRateLimited($user, 'email'),
                'remaining_attempts' => self::getRemainingAttempts($user, 'email'),
                'lockout_seconds' => self::getLockoutSecondsRemaining($user, 'email'),
                'can_resend' => self::canResendCode($user, 'email'),
                'resend_cooldown_seconds' => self::getResendCooldownSeconds($user, 'email'),
            ],
            'sms' => [
                'is_limited' => self::isAttemptRateLimited($user, 'sms'),
                'remaining_attempts' => self::getRemainingAttempts($user, 'sms'),
                'lockout_seconds' => self::getLockoutSecondsRemaining($user, 'sms'),
                'can_resend' => self::canResendCode($user, 'sms'),
                'resend_cooldown_seconds' => self::getResendCooldownSeconds($user, 'sms'),
            ],
            'whatsapp' => [
                'is_limited' => self::isAttemptRateLimited($user, 'whatsapp'),
                'remaining_attempts' => self::getRemainingAttempts($user, 'whatsapp'),
                'lockout_seconds' => self::getLockoutSecondsRemaining($user, 'whatsapp'),
                'can_resend' => self::canResendCode($user, 'whatsapp'),
                'resend_cooldown_seconds' => self::getResendCooldownSeconds($user, 'whatsapp'),
            ],
        ];
    }

    /**
     * Generate cache key for rate limiting
     * 
     * @param int $userId
     * @param string $type
     * @param string $action
     * @return string
     */
    private static function getCacheKey(int $userId, string $type, string $action): string
    {
        return self::CACHE_PREFIX . "{$userId}:{$type}:{$action}";
    }

    /**
     * Constants for configuration
     */
    public static function getConfig(): array
    {
        return [
            'max_attempts' => self::MAX_ATTEMPTS,
            'lockout_minutes' => self::LOCKOUT_MINUTES,
            'resend_cooldown_seconds' => self::RESEND_COOLDOWN_SECONDS,
        ];
    }
}