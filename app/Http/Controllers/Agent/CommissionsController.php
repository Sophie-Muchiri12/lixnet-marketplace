<?php

namespace App\Http\Controllers\Agent;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\Commission;
use App\Models\Order;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;

class CommissionsController extends Controller
{
    /**
     * Get agent commissions data with summary and quarterly chart.
     */
    public function index()
    {
        $user  = Auth::user();
        $agent = Agent::where('user_id', $user->id)->with('tier')->firstOrFail();

        // ── Commission history ────────────────────────────────────────────────
        $commissions = Commission::where('agent_id', $agent->id)
            ->with('tier')
            ->orderBy('period_start', 'desc')
            ->get()
            ->map(function ($c) {
                return [
                    'id'               => $c->id,
                    'period'           => $c->period_start->format('M Y') . ' – ' . $c->period_end->format('M Y'),
                    'period_start'     => $c->period_start->toDateString(),
                    'period_end'       => $c->period_end->toDateString(),
                    'total_sales'      => (float) $c->total_sales,
                    'total_commission' => (float) $c->total_commission,
                    'rate'             => $c->tier?->commission_rate ?? $this->rateForTier($c->tier?->name),
                    'tier'             => $c->tier?->name ?? 'bronze',
                    'status'           => $c->status ?? 'paid',
                ];
            });

        // ── Summary ───────────────────────────────────────────────────────────
        $totalEarned  = $commissions->where('status', 'paid')->sum('total_commission');
        $totalPending = $commissions->where('status', 'pending')->sum('total_commission');

        // ── Current tier info (reuse DashboardController logic) ───────────────
        $totalSales = Order::where('agent_id', $agent->id)
            ->where('status', '!=', 'cancelled')
            ->sum('total_amount');

        $tierInfo = $this->buildTierInfo($agent, (float) $totalSales);

        // ── Quarterly data ────────────────────────────────────────────────────
        $quarterlyData = $this->getQuarterlyData($agent);

        return response()->json([
            'commissions'    => $commissions,
            'summary'        => [
                'total_earned'  => $totalEarned,
                'total_pending' => $totalPending,
            ],
            'tier_info'      => $tierInfo,
            'quarterly_data' => $quarterlyData,
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function buildTierInfo(Agent $agent, float $totalSales): array
    {
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

        $salesToNext = 0;
        if ($current['name'] === 'bronze') $salesToNext = max(0, 25000  - $totalSales);
        if ($current['name'] === 'silver') $salesToNext = max(0, 50000  - $totalSales);

        return [
            'name'             => $current['name'],
            'commission_rate'  => $current['rate'],
            'current_sales'    => $totalSales,
            'sales_to_next_tier' => $salesToNext,
        ];
    }

    private function getQuarterlyData(Agent $agent): array
    {
        $year     = Carbon::now()->year;
        $quarters = [];

        for ($q = 1; $q <= 4; $q++) {
            $start = Carbon::createFromDate($year, ($q - 1) * 3 + 1, 1)->startOfMonth();
            $end   = Carbon::createFromDate($year, $q * 3, 1)->endOfMonth();

            $sales  = Order::where('agent_id', $agent->id)
                ->whereBetween('created_at', [$start, $end])
                ->where('status', '!=', 'cancelled')
                ->sum('total_amount');

            $orders = Order::where('agent_id', $agent->id)
                ->whereBetween('created_at', [$start, $end])
                ->where('status', '!=', 'cancelled')
                ->count();

            $quarters[] = ['quarter' => "Q{$q}", 'sales' => (float) $sales, 'orders' => $orders];
        }

        return $quarters;
    }

    private function rateForTier(?string $name): int
    {
        return match ($name) {
            'silver' => 20,
            'gold'   => 30,
            default  => 10,
        };
    }
}