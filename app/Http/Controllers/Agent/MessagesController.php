<?php

namespace App\Http\Controllers\Agent;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\AgentMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessagesController extends Controller
{
    /**
     * List all messages for the authenticated agent.
     */
    public function index()
    {
        $agent = Agent::where('user_id', Auth::id())->firstOrFail();

        $messages = AgentMessage::where('agent_id', $agent->id)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn ($m) => $this->formatMessage($m));

        // Mark admin messages as read
        AgentMessage::where('agent_id', $agent->id)
            ->where('sender_type', 'admin')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['messages' => $messages]);
    }

    /**
     * Store a new message from the agent.
     */
    public function store(Request $request)
    {
        $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $agent = Agent::where('user_id', Auth::id())->firstOrFail();

        $message = AgentMessage::create([
            'agent_id'    => $agent->id,
            'sender_type' => 'agent',
            'body'        => $request->body,
        ]);

        // Auto-reply for outside business hours or initial contact
        $autoReply = null;
        $recentAdminReply = AgentMessage::where('agent_id', $agent->id)
            ->where('sender_type', 'admin')
            ->where('created_at', '>=', now()->subHours(24))
            ->exists();

        if (!$recentAdminReply) {
            $autoReplyMsg = AgentMessage::create([
                'agent_id'    => $agent->id,
                'sender_type' => 'admin',
                'body'        => 'Thanks for your message! Our support team will respond within 24 hours (Mon–Fri, 8am–5pm EAT).',
            ]);
            $autoReply = $this->formatMessage($autoReplyMsg);
        }

        return response()->json([
            'message'    => $this->formatMessage($message),
            'auto_reply' => $autoReply,
        ], 201);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function formatMessage(AgentMessage $m): array
    {
        return [
            'id'             => $m->id,
            'body'           => $m->body,
            'from_agent'     => $m->from_agent,
            'sender_initial' => $m->sender_initial,
            'created_at'     => $m->created_at->toISOString(),
            'read_at'        => $m->read_at?->toISOString(),
        ];
    }
}