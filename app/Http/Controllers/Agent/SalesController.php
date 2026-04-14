<?php

namespace App\Http\Controllers\Agent;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;

class SalesController extends Controller
{
    /**
     * Get agent sales list with pagination and filters.
     */
    public function index(Request $request)
    {
        $user  = Auth::user();
        $agent = Agent::where('user_id', $user->id)->firstOrFail();

        $query = Order::where('agent_id', $agent->id);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_reference', 'like', "%{$search}%")
                  ->orWhere('full_name',       'like', "%{$search}%")
                  ->orWhere('email',            'like', "%{$search}%")
                  ->orWhere('company',          'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        $orders  = $query->orderBy('created_at', 'desc')->paginate($perPage);

        $stats = $this->getSalesStats($agent);

        return response()->json([
            'orders' => [
                'data'         => $orders->items(),
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
                'per_page'     => $orders->perPage(),
                'total'        => $orders->total(),
                'from'         => $orders->firstItem(),
                'to'           => $orders->lastItem(),
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Get specific order details including agent attribution and discount.
     */
    public function show(Request $request, $orderId)
    {
        $user  = Auth::user();
        $agent = Agent::where('user_id', $user->id)->firstOrFail();

        $order = Order::with('items')
            ->where('id', $orderId)
            ->where('agent_id', $agent->id)
            ->firstOrFail();

        // Resolve agent name from the agent_code stored on the order.
        // The orders table now stores: agent_code, discount_amount, discount_percentage.
        // agent_name is looked up from the related agent record (same agent in this
        // context, but we resolve via code for robustness).
        $agentName = null;
        if ($order->agent_code) {
            $relatedAgent = Agent::where('agent_code', $order->agent_code)
                ->with('user:id,name')
                ->first();
            $agentName = $relatedAgent?->user?->name;
        }

        return response()->json([
            'order' => [
                'id'                  => $order->id,
                'order_reference'     => $order->order_reference,
                'full_name'           => $order->full_name,
                'email'               => $order->email,
                'phone'               => $order->phone,
                'company'             => $order->company,
                'notes'               => $order->notes,
                'total_amount'        => (float) $order->total_amount,
                'currency'            => $order->currency,
                'status'              => $order->status,
                'payment_reference'   => $order->payment_reference,
                'paid_at'             => $order->paid_at?->toDateTimeString(),
                'created_at'          => $order->created_at->toDateTimeString(),
                'updated_at'          => $order->updated_at->toDateTimeString(),
                // ── Agent attribution fields ───────────────────────────────────
                'agent_code'          => $order->agent_code,
                'agent_name'          => $agentName,
                'discount_percentage' => $order->discount_percentage !== null
                                            ? (float) $order->discount_percentage
                                            : null,
                'discount_amount'     => $order->discount_amount !== null
                                            ? (float) $order->discount_amount
                                            : null,
                // ── Items ─────────────────────────────────────────────────────
                'items' => $order->items->map(fn ($item) => [
                    'id'           => $item->id,
                    'product_name' => $item->product_name,
                    'quantity'     => $item->quantity,
                    'unit_price'   => (float) $item->unit_price,
                    'total_price'  => (float) $item->total_price,
                ]),
            ],
        ]);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function getSalesStats(Agent $agent): array
    {
        $totalSales = Order::where('agent_id', $agent->id)
            ->where('status', '!=', 'cancelled')
            ->sum('total_amount');

        $totalOrders = Order::where('agent_id', $agent->id)
            ->where('status', '!=', 'cancelled')
            ->count();

        $averageOrderValue = $totalOrders > 0 ? $totalSales / $totalOrders : 0;

        $thisMonthSales = Order::where('agent_id', $agent->id)
            ->where('status', '!=', 'cancelled')
            ->whereBetween('created_at', [
                Carbon::now()->startOfMonth(),
                Carbon::now()->endOfMonth(),
            ])
            ->sum('total_amount');

        return [
            'total_sales'        => (float) $totalSales,
            'total_orders'       => $totalOrders,
            'average_order_value'=> (float) $averageOrderValue,
            'this_month_sales'   => (float) $thisMonthSales,
        ];
    }
}