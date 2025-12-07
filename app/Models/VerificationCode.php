<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerificationCode extends Model
{
    protected $fillable = ['user_id', 'code', 'type', 'expires_at', 'verified_at'];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if code is still valid
     */
    public function isValid(): bool
    {
        return !$this->verified_at && $this->expires_at->isFuture();
    }

    /**
     * Mark code as verified
     */
    public function markAsVerified(): void
    {
        $this->update(['verified_at' => now()]);
    }
}