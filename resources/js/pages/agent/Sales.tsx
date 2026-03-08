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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
    ChevronLeft,
    ChevronRight,
    Search,
    Eye,
    DollarSign,
    ShoppingBag,
    TrendingUp,
    Calendar,
} from 'lucide-react';
import axios from 'axios';

interface Order {
    id: number;
    order_reference: string;
    full_name: string;
    email: string;
    phone: string | null;
    company: string | null;
    total_amount: number;
    status: string;
    created_at: string;
    payment_reference: string | null;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface SalesStats {
    total_sales: number;
    total_orders: number;
    average_order_value: number;
    this_month_sales: number;
}

export default function AgentSales() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<SalesStats | null>(null);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/agent/dashboard',
        },
        {
            title: 'Sales',
            href: '/agent/sales',
        },
    ];

    const fetchSales = async (page = 1) => {
        try {
            setOrdersLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: page.toString(),
                per_page: '15',
            });

            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (searchQuery) params.append('search', searchQuery);

            const response = await axios.get(`/api/agent/sales?${params}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const data = response.data;

            setOrders(data.orders.data);
            setStats(data.stats);
            setPagination({
                current_page: data.orders.current_page,
                last_page: data.orders.last_page,
                per_page: data.orders.per_page,
                total: data.orders.total,
                from: data.orders.from,
                to: data.orders.to,
            });
            setCurrentPage(data.orders.current_page);

            if (loading) setLoading(false);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch sales';
            setError(errorMessage);
            toast.error(errorMessage);
            if (loading) setLoading(false);
        } finally {
            setOrdersLoading(false);
        }
    };

    useEffect(() => {
        fetchSales(1);
    }, [statusFilter]);

    const handleSearch = () => {
        fetchSales(1);
    };

    const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

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
            hour: '2-digit',
            minute: '2-digit',
        });
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

    const viewOrderDetails = (orderId: number) => {
        router.visit(`/agent/sales/${orderId}`);
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Sales" />
                <div className="space-y-6 p-4">
                    <Skeleton className="h-10 w-64" />
                    <div className="grid gap-6 md:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                    <Skeleton className="h-96" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales" />

            <div className="space-y-6 p-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Sales</h2>
                    <p className="text-muted-foreground">View and manage all your sales</p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid gap-6 md:grid-cols-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-primary/10 p-3">
                                        <DollarSign className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Sales</p>
                                        <p className="text-2xl font-bold">{formatCurrency(stats.total_sales)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-blue-100 p-3">
                                        <ShoppingBag className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Orders</p>
                                        <p className="text-2xl font-bold">{stats.total_orders}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-green-100 p-3">
                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Avg Order Value</p>
                                        <p className="text-2xl font-bold">{formatCurrency(stats.average_order_value)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-purple-100 p-3">
                                        <Calendar className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">This Month</p>
                                        <p className="text-2xl font-bold">{formatCurrency(stats.this_month_sales)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Orders Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <CardTitle>Sales History</CardTitle>
                                <CardDescription>Complete list of all your sales</CardDescription>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Search orders..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={handleSearchKeyPress}
                                        className="w-full sm:w-[250px]"
                                    />
                                    <Button onClick={handleSearch} size="icon">
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {ordersLoading ? (
                            <div className="space-y-4 p-6">
                                {[...Array(10)].map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : error ? (
                            <div className="p-12 text-center">
                                <p className="text-muted-foreground">{error}</p>
                                <Button onClick={() => fetchSales(1)} className="mt-4">
                                    Try Again
                                </Button>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-muted-foreground">No sales found</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="border-b">
                                            <tr className="text-sm">
                                                <th className="px-6 py-3 text-left font-medium">Order Reference</th>
                                                <th className="px-6 py-3 text-left font-medium">Customer</th>
                                                <th className="px-6 py-3 text-left font-medium">Email</th>
                                                <th className="px-6 py-3 text-left font-medium">Company</th>
                                                <th className="px-6 py-3 text-right font-medium">Amount</th>
                                                <th className="px-6 py-3 text-left font-medium">Status</th>
                                                <th className="px-6 py-3 text-left font-medium">Date</th>
                                                <th className="px-6 py-3 text-left font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {orders.map((order) => (
                                                <tr key={order.id} className="hover:bg-muted/50">
                                                    <td className="px-6 py-4 font-medium text-sm">
                                                        {order.order_reference}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">{order.full_name}</td>
                                                    <td className="px-6 py-4 text-sm">{order.email}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        {order.company || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-medium">
                                                        {formatCurrency(order.total_amount)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={getStatusBadgeVariant(order.status)}>
                                                            {order.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        {formatDate(order.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => viewOrderDetails(order.id)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {pagination && pagination.last_page > 1 && (
                                    <div className="flex items-center justify-between border-t px-6 py-4">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {pagination.from} to {pagination.to} of {pagination.total} orders
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fetchSales(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft className="h-4 w-4 mr-1" />
                                                Previous
                                            </Button>
                                            <div className="text-sm">
                                                Page {pagination.current_page} of {pagination.last_page}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fetchSales(currentPage + 1)}
                                                disabled={currentPage === pagination.last_page}
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
