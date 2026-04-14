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
    UserCheck,
    Tag,
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
    // Agent / discount fields (present when order was agent-assisted)
    agent_code: string | null;
    agent_name: string | null;
    discount_percentage: number | null;
    discount_amount: number | null;
}

export default function AgentSalesDetail({ orderId }: Props) {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/agent/dashboard' },
        { title: 'Sales',     href: '/agent/sales' },
        {
            title: order?.order_reference || 'Order Details',
            href:  `/agent/sales/${orderId}`,
        },
    ];

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`/api/agent/sales/${orderId}`, {
                headers: {
                    'Accept':           'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            setOrder(response.data.order);
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.message || err.message || 'Failed to fetch order details';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrderDetails(); }, [orderId]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('en-US', {
            year:   'numeric',
            month:  'short',
            day:    'numeric',
            hour:   '2-digit',
            minute: '2-digit',
        });

    const getStatusBadgeVariant = (status: string): any =>
        ({ completed: 'default', paid: 'default', pending: 'secondary', cancelled: 'destructive' }[status] ?? 'secondary');

    // ── Loading ───────────────────────────────────────────────────────────────

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

    const hasDiscount = order.discount_amount != null && order.discount_amount > 0;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${order.order_reference} - Order Details`} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" onClick={() => router.visit('/agent/sales')}>
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
                        <CardHeader><CardTitle>Customer Information</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <InfoRow icon={<FileText />}  label="Full Name" value={order.full_name} />
                                <InfoRow icon={<Mail />}      label="Email"     value={order.email} />
                                {order.phone   && <InfoRow icon={<Phone />}    label="Phone"   value={order.phone} />}
                                {order.company && <InfoRow icon={<Building2 />} label="Company" value={order.company} />}
                                {order.notes   && <InfoRow icon={<FileText />}  label="Notes"   value={order.notes} />}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Details */}
                    <Card>
                        <CardHeader><CardTitle>Order Details</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <InfoRow icon={<Calendar />}  label="Order Date"   value={formatDate(order.created_at)} />
                                <InfoRow icon={<Calendar />}  label="Last Updated" value={formatDate(order.updated_at)} />
                                {order.payment_reference && (
                                    <InfoRow icon={<CreditCard />} label="Payment Reference" value={order.payment_reference} />
                                )}
                                {order.paid_at && (
                                    <InfoRow icon={<Calendar />} label="Paid At" value={formatDate(order.paid_at)} />
                                )}
                                <InfoRow icon={<DollarSign />} label="Currency" value={order.currency} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Agent / Referral Info — only shown when an agent code was used */}
                {order.agent_code && (
                    <Card className="border-green-200 bg-green-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-800">
                                <UserCheck className="h-5 w-5" />
                                Agent Attribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                    <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Agent Code</p>
                                    <p className="mt-1 font-mono font-semibold text-green-900">{order.agent_code}</p>
                                </div>
                                {order.agent_name && (
                                    <div>
                                        <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Agent Name</p>
                                        <p className="mt-1 font-semibold text-green-900">{order.agent_name}</p>
                                    </div>
                                )}
                                {hasDiscount && (
                                    <div>
                                        <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Discount Applied</p>
                                        <p className="mt-1 flex items-center gap-1 font-semibold text-green-900">
                                            <Tag className="h-4 w-4" />
                                            {order.discount_percentage != null
                                                ? `${order.discount_percentage}% — `
                                                : ''}
                                            {formatCurrency(order.discount_amount!)} off
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

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
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b">
                                        <tr className="text-sm">
                                            <th className="px-6 py-3 text-left font-medium">Product</th>
                                            <th className="px-6 py-3 text-center font-medium">Qty</th>
                                            <th className="px-6 py-3 text-right font-medium">Unit Price</th>
                                            <th className="px-6 py-3 text-right font-medium">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {order.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-muted/50">
                                                <td className="px-6 py-4 font-medium">{item.product_name}</td>
                                                <td className="px-6 py-4 text-center">{item.quantity}</td>
                                                <td className="px-6 py-4 text-right">{formatCurrency(item.unit_price)}</td>
                                                <td className="px-6 py-4 text-right font-medium">{formatCurrency(item.total_price)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t bg-muted/20">
                                        {/* Subtotal before discount */}
                                        {hasDiscount && (
                                            <>
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-2 text-right text-sm text-muted-foreground">
                                                        Subtotal
                                                    </td>
                                                    <td className="px-6 py-2 text-right text-sm text-muted-foreground">
                                                        {formatCurrency(order.total_amount + order.discount_amount!)}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-2 text-right text-sm text-green-700 font-medium">
                                                        <span className="flex items-center justify-end gap-1">
                                                            <Tag className="h-3.5 w-3.5" />
                                                            Agent Discount
                                                            {order.discount_percentage != null
                                                                ? ` (${order.discount_percentage}%)`
                                                                : ''}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-2 text-right text-sm text-green-700 font-medium">
                                                        − {formatCurrency(order.discount_amount!)}
                                                    </td>
                                                </tr>
                                            </>
                                        )}
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
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

// ─── Shared helper component ───────────────────────────────────────────────────

function InfoRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <span className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0">{icon}</span>
            <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{value}</p>
            </div>
        </div>
    );
}