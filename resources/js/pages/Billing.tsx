import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, CheckCircle, Clock, Download } from 'lucide-react';
import axios from 'axios';

interface BillingRecord {
    id: number;
    ref: string;
    period: string;
    amount: number;
    method: string;
    date: string | null;
    status: 'paid' | 'pending' | 'cancelled';
}

interface BillingData {
    records: BillingRecord[];
    summary: {
        total: number;
        paid: number;
        outstanding: number;
    };
}

const fmt = (v: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 2 }).format(v);

const STATUS_VARIANTS: Record<string, any> = {
    paid: 'default',
    pending: 'secondary',
    cancelled: 'destructive',
};

export default function AgentBilling() {
    const [data, setData] = useState<BillingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState<number | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/agent/dashboard' },
        { title: 'Billing', href: '/agent/billing' },
    ];

    useEffect(() => {
        axios.get('/api/agent/billing', {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(res => setData(res.data))
            .catch(err => toast.error(err.response?.data?.message || 'Failed to load billing data'))
            .finally(() => setLoading(false));
    }, []);

    const handleDownload = (id: number) => {
        setDownloading(id);
        setTimeout(() => setDownloading(null), 1800);
    };

    const records = data?.records ?? [];
    const summary = data?.summary ?? { total: 0, paid: 0, outstanding: 0 };
    const pct = summary.total > 0 ? Math.round((summary.paid / summary.total) * 100) : 0;

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Billing" />
                <div className="space-y-6 p-4">
                    <div className="grid gap-6 md:grid-cols-3">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
                    </div>
                    <Skeleton className="h-24" />
                    <Skeleton className="h-96" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Billing" />

            <div className="space-y-6 p-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Billing Statements</h2>
                    <p className="text-muted-foreground">Track commission payment status and download your statements.</p>
                </div>

                {/* Summary Stats */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-primary/10 p-3">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Payable</p>
                                    <p className="text-2xl font-bold">{fmt(summary.total)}</p>
                                    <p className="text-xs text-muted-foreground">Gross commissions</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-blue-100 p-3">
                                    <CheckCircle className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Paid Out</p>
                                    <p className="text-2xl font-bold">{fmt(summary.paid)}</p>
                                    <p className="text-xs text-muted-foreground">Already received</p>
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
                                    <p className="text-sm text-muted-foreground">Outstanding</p>
                                    <p className="text-2xl font-bold">{fmt(summary.outstanding)}</p>
                                    <p className="text-xs text-muted-foreground">Pending payment</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment Progress */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Payment Progress</CardTitle>
                            <span className="text-sm text-muted-foreground">{fmt(summary.paid)} of {fmt(summary.total)}</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-1000"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs font-semibold">
                            <span className="text-primary">{pct}% paid</span>
                            <span className="text-amber-600">{100 - pct}% pending</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment History Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Payment History</CardTitle>
                                <CardDescription>All billing records and commission payments</CardDescription>
                            </div>
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {records.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-muted-foreground">No billing records yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b">
                                        <tr className="text-sm">
                                            <th className="px-6 py-3 text-left font-medium">Reference</th>
                                            <th className="px-6 py-3 text-left font-medium">Period</th>
                                            <th className="px-6 py-3 text-right font-medium">Amount</th>
                                            <th className="px-6 py-3 text-left font-medium">Method</th>
                                            <th className="px-6 py-3 text-left font-medium">Date Paid</th>
                                            <th className="px-6 py-3 text-left font-medium">Status</th>
                                            <th className="px-6 py-3 text-left font-medium"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {records.map(b => (
                                            <tr key={b.id} className="hover:bg-muted/50">
                                                <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{b.ref}</td>
                                                <td className="px-6 py-4 text-sm">{b.period}</td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-primary">{fmt(b.amount)}</td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">{b.method}</td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">{b.date || '—'}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={STATUS_VARIANTS[b.status] || 'secondary'}>
                                                        {b.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {b.status === 'paid' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDownload(b.id)}
                                                        >
                                                            {downloading === b.id ? '✓ Done' : 'Statement'}
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Notice */}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3">
                    <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-700 mb-1">Payment Schedule</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Payments process within 7 business days after quarter close. Keep banking details current in <strong>My Profile</strong>.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}