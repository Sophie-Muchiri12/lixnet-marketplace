<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\AgentDiscount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * AgentCodeController
 *
 * Handles agent-code lookup during checkout so the customer can:
 *   1. Confirm the agent's name before proceeding.
 *   2. See any approved discount that agent has been granted.
 *
 * Routes (add to api.php – no auth required so guests can look up codes):
 *   GET  /api/agent-code/lookup?code=AGT-XXXX
 */
class AgentCodeController extends Controller
{
    /**
     * Look up an agent by their agent_code and return:
     *   - agent name  (for the customer to confirm)
     *   - discount %  (0 if no active discount exists)
     *
     * We deliberately keep the response minimal so we don't
     * leak sensitive agent data to an unauthenticated caller.
     */
    public function lookup(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|max:50',
        ]);

        $code = strtoupper(trim($request->code));

        // Find the active agent with this code
        $agent = Agent::where('agent_code', $code)
            ->where('is_active', true)
            ->with('user:id,name')
            ->first();

        if (!$agent) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or inactive agent code. Please check the code and try again.',
            ], 404);
        }

        // Look for an active, approved discount for this agent.
        // AgentDiscount model should have: agent_id, discount_percentage,
        // is_active, valid_from (nullable), valid_until (nullable).
        //
        // If you don't have an AgentDiscount model yet, this block will
        // simply return 0 — the checkout still works, just no discount.
        $discountPercentage = 0;
        $discountId         = null;

        if (class_exists(\App\Models\AgentDiscount::class)) {
            $discount = \App\Models\AgentDiscount::where('agent_id', $agent->id)
                ->where('is_active', true)
                ->where(function ($q) {
                    $q->whereNull('valid_from')
                      ->orWhere('valid_from', '<=', now());
                })
                ->where(function ($q) {
                    $q->whereNull('valid_until')
                      ->orWhere('valid_until', '>=', now());
                })
                ->orderBy('discount_percentage', 'desc') // use the best active discount
                ->first();

            if ($discount) {
                $discountPercentage = (float) $discount->discount_percentage;
                $discountId         = $discount->id;
            }
        }

        return response()->json([
            'success'             => true,
            'agent_name'          => $agent->user->name,
            'agent_code'          => $agent->agent_code,
            'discount_percentage' => $discountPercentage,
            'discount_id'         => $discountId,
            'message'             => 'Agent found successfully.',
        ]);
    }
}