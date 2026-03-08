import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import {
    TrendingUp,
    DollarSign,
    Users,
    Award,
    Target,
} from 'lucide-react';
import axios from 'axios';

interface AgentStats {
    total_sales: number;
    total_earnings: number;
    customers_count: number;
    current_tier: string;
    current_tier_color: string;
}

interface TierInfo {
    name: string;
    min_sales: number;
    max_sales: number;
    commission_rate: number;
    current_sales: number;
    sales_to_next_tier: number;
}

interface QuarterlyData {
    quarter: string;
    sales: number;
    orders: number;
}

interface RecentSale {
    id: number;
    order_reference: string;
    full_name: string;
    total_amount: number;
    status: string;
    created_at: string;
}

interface DashboardData {
    stats: AgentStats;
    tier_info: TierInfo;
    quarterly_data: QuarterlyData[];
    recent_sales: RecentSale[];
    agent_name: string;
}

export default function AgentDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/agent/dashboard',
        },
    ];

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get('/api/agent/dashboard', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            setData(response.data);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch dashboard data';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'KES',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getTierColor = (tier: string) => {
        const colors: Record<string, string> = {
            'bronze': 'bg-orange-100 text-orange-700',
            'silver': 'bg-slate-100 text-slate-700',
            'gold': 'bg-yellow-100 text-yellow-700',
        };
        return colors[tier.toLowerCase()] || 'bg-gray-100 text-gray-700';
    };

    const getStatusBadgeVariant = (status: string) => {
        const variants: Record<string, any> = {
            completed: 'default',
            paid: 'default',
            pending: 'secondary',
            cancelled: 'destructive',
        };
        return variants[status] || 'secondary';
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Agent Dashboard" />
                <div className="space-y-6 p-4">
                    <Skeleton className="h-20 w-full" />
                    <div className="grid gap-6 md:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Skeleton className="h-80" />
                        <Skeleton className="h-80" />
                    </div>
                    <Skeleton className="h-96" />
                </div>
            </AppLayout>
        );
    }

    if (error || !data) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Agent Dashboard" />
                <div className="flex min-h-[400px] items-center justify-center p-4">
                    <div className="text-center">
                        <p className="text-muted-foreground">{error || 'Failed to load dashboard'}</p>
                        <Button onClick={fetchDashboardData} className="mt-4">
                            Try Again
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Agent Dashboard" />

            <div className="space-y-6 p-4">
                {/* Welcome Section */}
                <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight">
                                    Welcome back, {data.agent_name}! 👋
                                </h2>
                                <p className="text-muted-foreground mt-2">
                                    {data.tier_info.sales_to_next_tier > 0 ? (
                                        <>
                                            You need <span className="font-semibold text-primary">
                                                {formatCurrency(data.tier_info.sales_to_next_tier)}
                                            </span> in sales to reach <span className="font-semibold capitalize">
                                                {data.tier_info.name === 'bronze' ? 'Silver' :
                                                    data.tier_info.name === 'silver' ? 'Gold' : 'Maximum'}
                                            </span> tier
                                        </>
                                    ) : (
                                        <>You've reached the maximum tier! Keep up the great work!</>
                                    )}
                                </p>
                            </div>
                            <Badge className={getTierColor(data.stats.current_tier)} variant="outline">
                                <Award className="h-4 w-4 mr-2" />
                                {data.stats.current_tier.charAt(0).toUpperCase() + data.stats.current_tier.slice(1)}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid gap-6 md:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-primary/10 p-3">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Sales</p>
                                    <p className="text-2xl font-bold">{formatCurrency(data.stats.total_sales)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-green-100 p-3">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                                    <p className="text-2xl font-bold">{formatCurrency(data.stats.total_earnings)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-blue-100 p-3">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Customers</p>
                                    <p className="text-2xl font-bold">{data.stats.customers_count}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-purple-100 p-3">
                                    <Target className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Commission Rate</p>
                                    <p className="text-2xl font-bold">{data.tier_info.commission_rate}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sales by Quarter</CardTitle>
                            <CardDescription>Year-to-date quarterly sales</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={data.quarterly_data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="quarter" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value) => formatCurrency(Number(value))}
                                        labelFormatter={(label) => `${label}`}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="sales"
                                        stroke="#8884d8"
                                        strokeWidth={2}
                                        dot={{ fill: '#8884d8', r: 4 }}
                                        name="Sales"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Orders by Quarter</CardTitle>
                            <CardDescription>Year-to-date quarterly orders</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={data.quarterly_data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="quarter" />
                                    <YAxis />
                                    <Tooltip
                                        labelFormatter={(label) => `${label}`}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="orders"
                                        fill="#82ca9d"
                                        name="Orders"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Sales */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                        <CardDescription>Your latest sales this month</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {data.recent_sales.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-muted-foreground">No sales yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b">
                                        <tr className="text-sm">
                                            <th className="px-6 py-3 text-left font-medium">Order Reference</th>
                                            <th className="px-6 py-3 text-left font-medium">Customer</th>
                                            <th className="px-6 py-3 text-right font-medium">Amount</th>
                                            <th className="px-6 py-3 text-left font-medium">Status</th>
                                            <th className="px-6 py-3 text-left font-medium">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data.recent_sales.map((sale) => (
                                            <tr key={sale.id} className="hover:bg-muted/50">
                                                <td className="px-6 py-4 font-medium text-sm">{sale.order_reference}</td>
                                                <td className="px-6 py-4 text-sm">{sale.full_name}</td>
                                                <td className="px-6 py-4 text-right font-medium">
                                                    {formatCurrency(sale.total_amount)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={getStatusBadgeVariant(sale.status)}>
                                                        {sale.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-sm">{formatDate(sale.created_at)}</td>
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
