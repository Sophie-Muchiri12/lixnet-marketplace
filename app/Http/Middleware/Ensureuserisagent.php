<?php

namespace App\Http\Middleware;

use App\Models\Agent;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAgent
{
    /**
     * Handle an incoming request.
     * Allows access only if the authenticated user has an active agent record.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $this->deny($request, 'Unauthenticated.', 401);
        }

        $agent = Agent::where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$agent) {
            return $this->deny($request, 'Access denied. Your agent account is not active or does not exist.', 403);
        }

        return $next($request);
    }

    private function deny(Request $request, string $message, int $status): Response
    {
        if ($request->expectsJson()) {
            return response()->json(['message' => $message], $status);
        }

        // Web redirect: send to login or a "pending approval" page
        return redirect()->route('login')->with('error', $message);
    }
}