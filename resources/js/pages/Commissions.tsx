import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { DollarSign, Clock, Percent, TrendingUp } from 'lucide-react';
import axios from 'axios';

interface Commission {
    id: number;
    period: string;
    total_sales: number;
    rate: number;
    total_commission: number;
    status: string;
    tier: string;
}

interface TierInfo {
    name: string;
    commission_rate: number;
    current_sales: number;
    sales_to_next_tier: number;
}

interface Summary {
    total_earned: number;
    total_pending: number;
}

interface CommissionsData {
    commissions: Commission[];
    summary: Summary;
    tier_info: TierInfo | null;
    quarterly_data: { quarter: string; sales: number }[];
}

const TIER_COLORS: Record<string, string> = {
    bronze: 'bg-orange-100 text-orange-700',
    silver: 'bg-slate-100 text-slate-700',
    gold: 'bg-yellow-100 text-yellow-700',
};

const TIER_ICONS: Record<string, string> = {
    bronze: '🥉', silver: '🥈', gold: '🥇',
};

const STATUS_VARIANTS: Record<string, any> = {
    paid: 'default',
    pending: 'secondary',
    cancelled: 'destructive',
};

const fmt = (v: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 2 }).format(v);

export default function AgentCommissions() {
    const [data, setData] = useState<CommissionsData | null>(null);
    const [loading, setLoading] = useState(true);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/agent/dashboard' },
        { title: 'Commissions', href: '/agent/commissions' },
    ];

    useEffect(() => {
        axios.get('/api/agent/commissions', {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(res => setData(res.data))
            .catch(err => {
                const msg = err.response?.data?.message || err.message || 'Failed to load commissions';
                toast.error(msg);
            })
            .finally(() => setLoading(false));
    }, []);

    const tierInfo = data?.tier_info ?? null;
    const summary = data?.summary ?? { total_earned: 0, total_pending: 0 };
    const commissions = data?.commissions ?? [];
    const quarterlyData = data?.quarterly_data ?? [];

    // Tier progress
    const tierName = tierInfo?.name?.toLowerCase() || 'bronze';
    const minMap: Record<string, number> = { bronze: 0, silver: 25000, gold: 50000 };
    const maxMap: Record<string, number> = { bronze: 25000, silver: 50000, gold: 50000 };
    const min = minMap[tierName] ?? 0;
    const max = maxMap[tierName] ?? 25000;
    const pct = tierName === 'gold'
        ? 100
        : Math.min(100, (((tierInfo?.current_sales ?? 0) - min) / (max - min)) * 100);

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Commissions" />
                <div className="space-y-6 p-4">
                    <div className="grid gap-6 md:grid-cols-4">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
                    </div>
                    <Skeleton className="h-40" />
                    <Skeleton className="h-96" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Commissions" />

            <div className="space-y-6 p-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Commissions & Earnings</h2>
                    <p className="text-muted-foreground">Track your earnings, tier progression, and quarterly performance.</p>
                </div>

                {/* Summary Stats */}
                <div className="grid gap-6 md:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-primary/10 p-3">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Earned</p>
                                    <p className="text-2xl font-bold">{fmt(summary.total_earned)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-amber-100 p-3">
                                    <Clock className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Pending</p>
                                    <p className="text-2xl font-bold">{fmt(summary.total_pending)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-purple-100 p-3">
                                    <Percent className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Current Rate</p>
                                    <p className="text-2xl font-bold">{tierInfo?.commission_rate ?? '—'}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-blue-100 p-3">
                                    <TrendingUp className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Sales</p>
                                    <p className="text-2xl font-bold">{fmt(tierInfo?.current_sales ?? 0)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tier Ladder + Progress */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Commission Tier Ladder</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { n: 'bronze', rate: '10%', range: 'KSh 0 – 25,000' },
                                    { n: 'silver', rate: '20%', range: 'KSh 25,000 – 50,000' },
                                    { n: 'gold',   rate: '30%', range: 'KSh 50,000+' },
                                ].map(t => {
                                    const isCurrent = tierName === t.n;
                                    return (
                                        <div key={t.n} className={`rounded-xl border-2 p-4 ${isCurrent ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
                                                {TIER_ICONS[t.n]} {t.n.charAt(0).toUpperCase() + t.n.slice(1)}
                                            </p>
                                            <p className="text-3xl font-black mb-1">{t.rate}</p>
                                            <p className="text-xs text-muted-foreground mb-3">{t.range}</p>
                                            {isCurrent && <Badge variant="default">Your Tier</Badge>}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tier Progress</CardTitle>
                            <CardDescription>
                                {tierName !== 'gold'
                                    ? `${fmt(tierInfo?.sales_to_next_tier ?? 0)} to next tier`
                                    : '🏆 Maximum tier reached!'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between mb-2">
                                <Badge className={TIER_COLORS[tierName]} variant="outline">
                                    {TIER_ICONS[tierName]} {tierName.charAt(0).toUpperCase() + tierName.slice(1)}
                                </Badge>
                                <span className="text-sm text-muted-foreground font-mono">{tierInfo?.commission_rate}% rate</span>
                            </div>
                            <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-1000"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Current: {fmt(tierInfo?.current_sales ?? 0)}</span>
                                <span>{Math.round(pct)}%</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quarterly Chart */}
                {quarterlyData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Sales by Quarter — {new Date().getFullYear()}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={quarterlyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="quarter" />
                                    <YAxis />
                                    <Tooltip formatter={(v) => fmt(Number(v))} />
                                    <Bar dataKey="sales" fill="#059669" name="Sales" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Commission History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Commission History</CardTitle>
                        <CardDescription>All your commission records</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {commissions.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-muted-foreground">No commission records yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b">
                                        <tr className="text-sm">
                                            <th className="px-6 py-3 text-left font-medium">Period</th>
                                            <th className="px-6 py-3 text-right font-medium">Total Sales</th>
                                            <th className="px-6 py-3 text-left font-medium">Rate</th>
                                            <th className="px-6 py-3 text-right font-medium">Commission</th>
                                            <th className="px-6 py-3 text-left font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {commissions.map(c => (
                                            <tr key={c.id} className="hover:bg-muted/50">
                                                <td className="px-6 py-4 text-sm font-medium">{c.period}</td>
                                                <td className="px-6 py-4 text-right font-mono text-sm">{fmt(c.total_sales)}</td>
                                                <td className="px-6 py-4">
                                                    <Badge className={TIER_COLORS[c.tier?.toLowerCase()] || ''} variant="outline">
                                                        {TIER_ICONS[c.tier?.toLowerCase()] || ''} {c.rate}%
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-primary">{fmt(c.total_commission)}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={STATUS_VARIANTS[c.status] || 'secondary'}>
                                                        {c.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}