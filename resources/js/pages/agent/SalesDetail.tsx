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
    ArrowLeft,
    Mail,
    Phone,
    Building2,
    Calendar,
    CreditCard,
    FileText,
    Package,
    DollarSign,
} from 'lucide-react';
import axios from 'axios';

interface Props {
    orderId: string;
}

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface Order {
    id: number;
    order_reference: string;
    full_name: string;
    email: string;
    phone: string | null;
    company: string | null;
    notes: string | null;
    total_amount: number;
    currency: string;
    status: string;
    payment_reference: string | null;
    paid_at: string | null;
    created_at: string;
    updated_at: string;
    items: OrderItem[];
}

export default function AgentSalesDetail({ orderId }: Props) {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/agent/dashboard',
        },
        {
            title: 'Sales',
            href: '/agent/sales',
        },
        {
            title: order?.order_reference || 'Order Details',
            href: `/agent/sales/${orderId}`,
        },
    ];

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`/api/agent/sales/${orderId}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            setOrder(response.data.order);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch order details';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
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

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Order Details" />
                <div className="space-y-6 p-4">
                    <Skeleton className="h-10 w-64" />
                    <div className="grid gap-6 md:grid-cols-2">
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                    </div>
                    <Skeleton className="h-96" />
                </div>
            </AppLayout>
        );
    }

    if (error || !order) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Order Details" />
                <div className="flex min-h-[400px] items-center justify-center p-4">
                    <div className="text-center">
                        <p className="text-muted-foreground">{error || 'Order not found'}</p>
                        <Button onClick={() => router.visit('/agent/sales')} className="mt-4">
                            Back to Sales
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${order.order_reference} - Order Details`} />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.visit('/agent/sales')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Sales
                        </Button>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">{order.order_reference}</h2>
                            <p className="text-muted-foreground">Order details and items</p>
                        </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(order.status)} className="text-base px-4 py-2">
                        {order.status}
                    </Badge>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Customer Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Full Name</p>
                                        <p className="text-sm text-muted-foreground">{order.full_name}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Email</p>
                                        <p className="text-sm text-muted-foreground">{order.email}</p>
                                    </div>
                                </div>

                                {order.phone && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Phone</p>
                                            <p className="text-sm text-muted-foreground">{order.phone}</p>
                                        </div>
                                    </div>
                                )}

                                {order.company && (
                                    <div className="flex items-start gap-3">
                                        <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Company</p>
                                            <p className="text-sm text-muted-foreground">{order.company}</p>
                                        </div>
                                    </div>
                                )}

                                {order.notes && (
                                    <div className="flex items-start gap-3">
                                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Notes</p>
                                            <p className="text-sm text-muted-foreground">{order.notes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Order Date</p>
                                        <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Last Updated</p>
                                        <p className="text-sm text-muted-foreground">{formatDate(order.updated_at)}</p>
                                    </div>
                                </div>

                                {order.payment_reference && (
                                    <div className="flex items-start gap-3">
                                        <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Payment Reference</p>
                                            <p className="text-sm text-muted-foreground">{order.payment_reference}</p>
                                        </div>
                                    </div>
                                )}

                                {order.paid_at && (
                                    <div className="flex items-start gap-3">
                                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Paid At</p>
                                            <p className="text-sm text-muted-foreground">{formatDate(order.paid_at)}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Currency</p>
                                        <p className="text-sm text-muted-foreground">{order.currency}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Order Items */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Order Items
                        </CardTitle>
                        <CardDescription>Products included in this order</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {order.items.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-muted-foreground">No items in this order</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="border-b">
                                            <tr className="text-sm">
                                                <th className="px-6 py-3 text-left font-medium">Product</th>
                                                <th className="px-6 py-3 text-center font-medium">Quantity</th>
                                                <th className="px-6 py-3 text-right font-medium">Unit Price</th>
                                                <th className="px-6 py-3 text-right font-medium">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {order.items.map((item) => (
                                                <tr key={item.id} className="hover:bg-muted/50">
                                                    <td className="px-6 py-4 font-medium">{item.product_name}</td>
                                                    <td className="px-6 py-4 text-center">{item.quantity}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        {formatCurrency(item.unit_price)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-medium">
                                                        {formatCurrency(item.total_price)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="border-t bg-muted/20">
                                            <tr>
                                                <td colSpan={3} className="px-6 py-4 text-right font-bold">
                                                    Total Amount
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-lg">
                                                    {formatCurrency(order.total_amount)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
