<?php

namespace App\Http\Controllers\Agent;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\AgentTier;
use App\Models\Commission;
use App\Models\Order;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    /**
     * Get agent dashboard data.
     */
    public function index()
    {
        $user = Auth::user();

        $agent = Agent::where('user_id', $user->id)
            ->with(['tier'])
            ->firstOrFail();

        $currentTier    = $this->getCurrentTierInfo($agent);
        $stats          = $this->getAgentStats($agent, $currentTier);
        $quarterlyData  = $this->getQuarterlyData($agent);

        $recentSales = Order::where('agent_id', $agent->id)
            ->where('created_at', '>=', Carbon::now()->startOfMonth())
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn ($o) => [
                'id'              => $o->id,
                'order_reference' => $o->order_reference,
                'full_name'       => $o->full_name,
                'total_amount'    => (float) $o->total_amount,
                'status'          => $o->status,
                'created_at'      => $o->created_at->toDateString(),
            ]);

        return response()->json([
            'agent_name'     => $user->name,
            'agent_code'     => $agent->agent_code,   // ← added; was missing in original
            'stats'          => $stats,
            'tier_info'      => $currentTier,
            'quarterly_data' => $quarterlyData,
            'recent_sales'   => $recentSales,
        ]);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function getAgentStats(Agent $agent, array $tierInfo): array
    {
        $totalSales = Order::where('agent_id', $agent->id)
            ->where('status', '!=', 'cancelled')
            ->sum('total_amount');

        // Current-year earnings from paid commissions
        $totalEarnings = Commission::where('agent_id', $agent->id)
            ->where('status', 'paid')
            ->whereYear('period_start', Carbon::now()->year)
            ->sum('total_commission');

        $customersCount = Order::where('agent_id', $agent->id)
            ->where('status', '!=', 'cancelled')
            ->distinct('email')
            ->count('email');

        return [
            'total_sales'     => (float) $totalSales,
            'total_earnings'  => (float) $totalEarnings,
            'customers_count' => $customersCount,
            'commission_rate' => $tierInfo['commission_rate'],
            'current_tier'    => $tierInfo['name'],
        ];
    }

    private function getCurrentTierInfo(Agent $agent): array
    {
        $totalSales = (float) Order::where('agent_id', $agent->id)
            ->where('status', '!=', 'cancelled')
            ->sum('total_amount');

        $tiers = [
            ['name' => 'bronze', 'min' => 0,     'max' => 25000,       'rate' => 10],
            ['name' => 'silver', 'min' => 25000,  'max' => 50000,       'rate' => 20],
            ['name' => 'gold',   'min' => 50000,  'max' => PHP_INT_MAX, 'rate' => 30],
        ];

        $current = $tiers[0];
        foreach ($tiers as $tier) {
            if ($totalSales >= $tier['min'] && $totalSales < $tier['max']) {
                $current = $tier;
                break;
            }
        }

        // Override with DB rate if tier record exists
        $tierModel = AgentTier::where('name', $current['name'])->first();
        if ($tierModel) {
            $current['rate'] = (float) $tierModel->commission_rate;
        }

        $salesToNext = 0;
        if ($current['name'] === 'bronze') $salesToNext = max(0, 25000 - $totalSales);
        if ($current['name'] === 'silver') $salesToNext = max(0, 50000 - $totalSales);

        return [
            'name'              => $current['name'],
            'commission_rate'   => $current['rate'],
            'current_sales'     => $totalSales,
            'sales_to_next_tier'=> $salesToNext,
        ];
    }

    private function getQuarterlyData(Agent $agent): array
    {
        $year     = Carbon::now()->year;
        $quarters = [];

        for ($q = 1; $q <= 4; $q++) {
            $start = Carbon::createFromDate($year, ($q - 1) * 3 + 1, 1)->startOfMonth();
            $end   = Carbon::createFromDate($year, $q * 3, 1)->endOfMonth();

            $quarters[] = [
                'quarter' => "Q{$q}",
                'sales'   => (float) Order::where('agent_id', $agent->id)
                    ->whereBetween('created_at', [$start, $end])
                    ->where('status', '!=', 'cancelled')
                    ->sum('total_amount'),
                'orders'  => Order::where('agent_id', $agent->id)
                    ->whereBetween('created_at', [$start, $end])
                    ->where('status', '!=', 'cancelled')
                    ->count(),
            ];
        }

        return $quarters;
    }
}