<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AgentMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'agent_id',
        'sender_type',   // 'agent' | 'admin'
        'body',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function agent()
    {
        return $this->belongsTo(Agent::class);
    }

    /**
     * Whether this message was sent by the agent (as opposed to an admin/support reply).
     */
    public function getFromAgentAttribute(): bool
    {
        return $this->sender_type === 'agent';
    }

    /**
     * Single initial character for the UI avatar.
     */
    public function getSenderInitialAttribute(): string
    {
        return $this->sender_type === 'agent' ? 'Y' : 'L';
    }
}