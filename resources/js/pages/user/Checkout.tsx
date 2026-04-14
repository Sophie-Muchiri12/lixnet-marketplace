import { useState, useEffect, JSX } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    ShoppingBag,
    User,
    CreditCard,
    Lock,
    Briefcase,
    PiggyBank,
    GraduationCap,
    Calculator,
    Truck,
    ArrowLeft,
    UserCheck,
    Tag,
    X,
    CheckCircle2,
    Loader2,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCart } from '@/context/cart-context';
import { MarketplaceLayout } from '@/layouts/marketplace-layout';
import { router } from '@inertiajs/react';
import { useAuth } from '@/context/auth-context';
import toast from 'react-hot-toast';
import axios from 'axios';
import Breadcrumbs from '@/components/ui/user-breadcrumbs';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckoutFormData {
    fullName: string;
    email: string;
    phone: string;
    company: string;
    notes: string;
}

interface SubscriptionTier {
    price: number;
    features: string;
}

interface CartItemWithTier {
    id: number | string;
    product: {
        id: number;
        title: string;
        price: number;
        category: { name: string };
        is_subscription?: boolean;
        subscription_tiers?: Record<string, SubscriptionTier> | null;
    };
    quantity: number;
    subscription_tier?: string;
}

interface AgentInfo {
    agent_name: string;
    agent_code: string;
    discount_percentage: number;   // 0 if no discount
    discount_id: number | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Checkout() {
    const { state } = useCart();
    const { user, isLoading, checkAuth, logout } = useAuth();

    // Customer form
    const [formData, setFormData] = useState<CheckoutFormData>({
        fullName: '',
        email: '',
        phone: '',
        company: '',
        notes: '',
    });
    const [formErrors, setFormErrors] = useState<Partial<CheckoutFormData>>({});
    const [isProcessing, setIsProcessing] = useState(false);

    // Agent-code state
    const [agentCodeInput, setAgentCodeInput] = useState('');
    const [agentLookupLoading, setAgentLookupLoading] = useState(false);
    const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
    const [agentError, setAgentError] = useState<string | null>(null);

    // ── Auth / prefill ────────────────────────────────────────────────────────
    useEffect(() => { checkAuth(); }, []);

    useEffect(() => {
        if (!isLoading && !user) {
            toast.error('Please log in to access checkout');
            router.visit(`/login?redirect=${encodeURIComponent('/checkout')}`);
            return;
        }
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: user.name  || '',
                email:    user.email || '',
                phone:    user.phone || '',
                company:  user.company || '',
            }));
        }
    }, [user, isLoading]);

    useEffect(() => {
        if (state.items.length === 0) {
            toast.error('Your cart is empty');
            router.visit('/cart');
        }
    }, [state.items]);

    // ── Pricing helpers ───────────────────────────────────────────────────────

    function getItemPrice(item: CartItemWithTier): number {
        if (item.subscription_tier && item.product.is_subscription && item.product.subscription_tiers) {
            const tierData = item.product.subscription_tiers[item.subscription_tier];
            return tierData ? tierData.price : item.product.price;
        }
        return item.product.price;
    }

    /** Subtotal before any discount */
    const subtotal = state.items.reduce(
        (sum, item: CartItemWithTier) => sum + getItemPrice(item) * item.quantity,
        0,
    );

    /** Amount saved when an agent discount applies */
    const discountAmount =
        agentInfo && agentInfo.discount_percentage > 0
            ? parseFloat(((subtotal * agentInfo.discount_percentage) / 100).toFixed(2))
            : 0;

    /** What the customer actually pays */
    const finalTotal = subtotal - discountAmount;

    const formatPrice = (price: number) => `KSh ${price.toLocaleString()}`;

    // ── Agent-code lookup ─────────────────────────────────────────────────────

    const handleAgentCodeLookup = async () => {
        const code = agentCodeInput.trim().toUpperCase();
        if (!code) {
            setAgentError('Please enter an agent code.');
            return;
        }

        setAgentLookupLoading(true);
        setAgentError(null);
        setAgentInfo(null);

        try {
            const res = await axios.get('/api/agent-code/lookup', { params: { code } });
            if (res.data.success) {
                setAgentInfo({
                    agent_name:          res.data.agent_name,
                    agent_code:          res.data.agent_code,
                    discount_percentage: res.data.discount_percentage ?? 0,
                    discount_id:         res.data.discount_id ?? null,
                });
                toast.success(`Agent confirmed: ${res.data.agent_name}`);
            } else {
                setAgentError(res.data.message || 'Agent not found.');
            }
        } catch (err: any) {
            const msg =
                err.response?.data?.message ||
                'Invalid or inactive agent code. Please check and try again.';
            setAgentError(msg);
        } finally {
            setAgentLookupLoading(false);
        }
    };

    const handleClearAgent = () => {
        setAgentInfo(null);
        setAgentCodeInput('');
        setAgentError(null);
    };

    // ── Form validation ───────────────────────────────────────────────────────

    const validateForm = () => {
        const errors: Partial<CheckoutFormData> = {};
        if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
        if (!formData.email.trim())    errors.email    = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Please enter a valid email';
        if (!formData.phone.trim())    errors.phone    = 'Phone number is required';
        else if (!/^(\+254|0)[17]\d{8}$/.test(formData.phone.replace(/\s/g, '')))
            errors.phone = 'Please enter a valid Kenyan phone number';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: undefined }));
    };

    // ── Place order ───────────────────────────────────────────────────────────

    const handlePlaceOrder = async () => {
        if (!validateForm()) return;
        setIsProcessing(true);

        try {
            const orderData = {
                full_name:       formData.fullName,
                email:           formData.email,
                phone:           formData.phone,
                company:         formData.company,
                notes:           formData.notes,
                // Agent attribution — only sent when a code was confirmed
                agent_code:      agentInfo?.agent_code      ?? null,
                discount_amount: discountAmount > 0 ? discountAmount : null,
                discount_id:     agentInfo?.discount_id     ?? null,
                items: state.items.map((item: CartItemWithTier) => {
                    let unitPrice = item.product.price;
                    if (
                        item.subscription_tier &&
                        item.product.is_subscription &&
                        item.product.subscription_tiers
                    ) {
                        const tierData = item.product.subscription_tiers[item.subscription_tier];
                        unitPrice = tierData ? tierData.price : item.product.price;
                    }
                    return {
                        product_id:        item.product.id,
                        quantity:          item.quantity,
                        unit_price:        unitPrice,
                        subscription_tier: item.subscription_tier || null,
                    };
                }),
                total_amount: finalTotal,   // discounted total
                currency:     'KES',
            };

            const orderResponse = await axios.post('/api/orders', orderData);

            if (!orderResponse.data.success) {
                throw new Error(orderResponse.data.message || 'Failed to create order');
            }

            const order = orderResponse.data.data.order;
            toast.success('Order created successfully! Initiating payment…');

            const paymentResponse = await axios.post(`/api/orders/${order.id}/pay`);
            if (!paymentResponse.data.success) {
                throw new Error(paymentResponse.data.message || 'Failed to initiate payment');
            }

            toast.success('Redirecting to payment…');
            window.location.href = paymentResponse.data.data.payment_url;

        } catch (error: any) {
            console.error('Checkout error:', error);
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                if (validationErrors) {
                    Object.keys(validationErrors).forEach(f =>
                        toast.error(`${f}: ${validationErrors[f][0]}`),
                    );
                }
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to process order. Please try again.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    // ── Icons ─────────────────────────────────────────────────────────────────

    function getProductIcon(categoryName: string): JSX.Element {
        const iconMap: Record<string, JSX.Element> = {
            'Payroll & HR':      <Briefcase    className="size-6 text-brand-blue" />,
            'SACCO Management':  <PiggyBank    className="size-6 text-brand-blue" />,
            'School Management': <GraduationCap className="size-6 text-brand-blue" />,
            'POS Systems':       <ShoppingBag  className="size-6 text-brand-blue" />,
            'Accounting':        <Calculator   className="size-6 text-brand-blue" />,
            'Inventory':         <Truck        className="size-6 text-brand-blue" />,
        };
        return (
            Object.entries(iconMap).find(([key]) =>
                categoryName.toLowerCase().includes(key.toLowerCase()),
            )?.[1] ?? <Briefcase className="size-6 text-brand-blue" />
        );
    }

    // ── Loading skeleton ──────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <MarketplaceLayout>
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto mb-4" />
                            <p className="text-gray-600">Loading checkout…</p>
                        </div>
                    </div>
                </div>
            </MarketplaceLayout>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <MarketplaceLayout
            onLoginClick={() => (user ? logout() : router.visit('/login'))}
            onCartClick={() => router.visit('/cart')}
        >
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-4">
                    <Breadcrumbs items={[{ label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />
                </div>

                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.visit('/cart')}
                        className="mb-4 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Cart
                    </Button>
                    <h1 className="text-3xl font-bold text-dark-blue">Checkout</h1>
                    <p className="text-gray-600 mt-2">
                        Complete your order for {state.totalItems} item{state.totalItems !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* ── LEFT COLUMN ─────────────────────────────────────── */}
                    <div className="space-y-6">

                        {/* Customer Information */}
                        <Card className="bg-card-color text-text-dark border border-border-color">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <User className="w-5 h-5 mr-2 text-brand-blue" />
                                    Customer Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Full name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name *</Label>
                                        <Input
                                            id="fullName"
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                                            className={`bg-background-color border-border-color ${formErrors.fullName ? 'border-red-500' : ''}`}
                                            placeholder="Enter your full name"
                                        />
                                        {formErrors.fullName && <p className="text-sm text-red-600">{formErrors.fullName}</p>}
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className={`bg-background-color border-border-color ${formErrors.email ? 'border-red-500' : ''}`}
                                            placeholder="Enter your email"
                                        />
                                        {formErrors.email && <p className="text-sm text-red-600">{formErrors.email}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Phone */}
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number *</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            className={`bg-background-color border-border-color ${formErrors.phone ? 'border-red-500' : ''}`}
                                            placeholder="e.g., +254712345678"
                                        />
                                        {formErrors.phone && <p className="text-sm text-red-600">{formErrors.phone}</p>}
                                    </div>

                                    {/* Company */}
                                    <div className="space-y-2">
                                        <Label htmlFor="company">Company/Organization</Label>
                                        <Input
                                            id="company"
                                            type="text"
                                            value={formData.company}
                                            onChange={(e) => handleInputChange('company', e.target.value)}
                                            className="bg-background-color border-border-color"
                                            placeholder="Enter company name (optional)"
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Special Requirements</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                        className="bg-background-color border-border-color min-h-[100px]"
                                        placeholder="Any special requirements or notes for your order…"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── Agent Code ──────────────────────────────────── */}
                        <Card className="bg-card-color text-text-dark border border-border-color">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Tag className="w-5 h-5 mr-2 text-brand-blue" />
                                    Agent / Referral Code
                                    <span className="ml-2 text-sm font-normal text-gray-500">(optional)</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-gray-600">
                                    If an agent referred you or is assisting with your purchase, enter their code below
                                    to link this sale to them. This may also unlock a discount.
                                </p>

                                {/* ── Code confirmed ────────────────────── */}
                                {agentInfo ? (
                                    <div className="rounded-lg border border-green-300 bg-green-50 p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-green-800">
                                                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                                                <span className="font-semibold">Agent Confirmed</span>
                                            </div>
                                            <button
                                                onClick={handleClearAgent}
                                                className="text-gray-400 hover:text-gray-600"
                                                aria-label="Remove agent code"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-green-900">
                                            <UserCheck className="w-4 h-4 text-green-600" />
                                            <span>
                                                <span className="font-medium">{agentInfo.agent_name}</span>
                                                &nbsp;({agentInfo.agent_code})
                                            </span>
                                        </div>

                                        {agentInfo.discount_percentage > 0 ? (
                                            <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                                                <Tag className="w-4 h-4" />
                                                {agentInfo.discount_percentage}% discount applied — you save{' '}
                                                <span className="font-bold">{formatPrice(discountAmount)}</span>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-green-700">
                                                No discount is currently active for this agent, but the sale will still
                                                be credited to them.
                                            </p>
                                        )}
                                    </div>

                                ) : (
                                    /* ── Code entry ─────────────────────── */
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <Input
                                                type="text"
                                                value={agentCodeInput}
                                                onChange={(e) => {
                                                    setAgentCodeInput(e.target.value.toUpperCase());
                                                    setAgentError(null);
                                                }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAgentCodeLookup()}
                                                className={`bg-background-color border-border-color uppercase tracking-widest ${agentError ? 'border-red-400' : ''}`}
                                                placeholder="e.g. AGT-1A2B3C"
                                                maxLength={20}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleAgentCodeLookup}
                                                disabled={agentLookupLoading || !agentCodeInput.trim()}
                                                className="shrink-0"
                                            >
                                                {agentLookupLoading
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : 'Apply'}
                                            </Button>
                                        </div>

                                        {agentError && (
                                            <p className="text-sm text-red-600">{agentError}</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment Information */}
                        <Card className="bg-card-color text-text-dark border border-border-color">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <CreditCard className="w-5 h-5 mr-2 text-brand-blue" />
                                    Payment
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Alert className="bg-blue-50 border-blue-200">
                                    <Lock className="h-4 w-4 text-blue-600" />
                                    <AlertDescription className="text-blue-800 text-sm">
                                        You will be redirected to Pesapal's secure payment gateway where you can choose
                                        from multiple payment methods including M-Pesa, Card, Bank Transfer, and more.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── RIGHT COLUMN – Order Summary ─────────────────────── */}
                    <div className="space-y-6">
                        <Card className="bg-card-color text-text-dark border border-border-color">
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Items */}
                                {state.items.map((item: CartItemWithTier, index) => (
                                    <div key={item.id}>
                                        {index > 0 && <Separator className="my-4 bg-border-color" />}
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-white rounded-lg flex items-center justify-center border border-border-color">
                                                {getProductIcon(item.product.category.name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-dark-blue truncate">
                                                    {item.product.title}
                                                </h4>
                                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs bg-background-color text-text-dark border border-border-color mt-1"
                                                >
                                                    {item.product.category.name}
                                                </Badge>
                                                {item.subscription_tier && (
                                                    <div className="mt-2 space-y-1">
                                                        <Badge className="text-xs bg-green-100 text-green-800 border-green-300 font-semibold">
                                                            Plan:{' '}
                                                            {item.subscription_tier.charAt(0).toUpperCase() +
                                                                item.subscription_tier.slice(1)}
                                                        </Badge>
                                                        <p className="text-xs text-gray-500">Monthly subscription</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-dark-blue">
                                                    {formatPrice(getItemPrice(item))}
                                                    {item.subscription_tier && (
                                                        <div className="text-xs text-gray-500 font-normal">/month</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <Separator className="bg-border-color" />

                                {/* Pricing breakdown */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal ({state.totalItems} item{state.totalItems !== 1 ? 's' : ''}):</span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>

                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Setup Fee:</span>
                                        <span>FREE</span>
                                    </div>

                                    {/* Discount row — only shown when agent code applied with >0% */}
                                    {agentInfo && discountAmount > 0 && (
                                        <div className="flex justify-between text-sm font-medium text-green-700">
                                            <span className="flex items-center gap-1">
                                                <Tag className="w-3.5 h-3.5" />
                                                Agent Discount ({agentInfo.discount_percentage}%):
                                            </span>
                                            <span>− {formatPrice(discountAmount)}</span>
                                        </div>
                                    )}

                                    <Separator className="bg-border-color" />

                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total:</span>
                                        <span className="text-dark-blue">{formatPrice(finalTotal)}</span>
                                    </div>

                                    {/* Agent attribution tag */}
                                    {agentInfo && (
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-1">
                                            <UserCheck className="w-3.5 h-3.5 text-green-600" />
                                            Sale attributed to{' '}
                                            <span className="font-medium text-gray-700">{agentInfo.agent_name}</span>
                                        </div>
                                    )}
                                </div>

                                <Alert className="bg-blue-50 border-blue-200">
                                    <AlertDescription className="text-sm text-blue-800">
                                        <strong>One Time Payment:</strong> Proceed to pay securely through Pesapal.
                                    </AlertDescription>
                                </Alert>

                                <Button
                                    onClick={handlePlaceOrder}
                                    disabled={isProcessing}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
                                >
                                    {isProcessing ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                                            Processing…
                                        </div>
                                    ) : (
                                        <>
                                            <Lock className="w-5 h-5 mr-2" />
                                            Complete Secure Payment
                                        </>
                                    )}
                                </Button>

                                <p className="text-xs text-gray-500 text-center">
                                    By placing your order, you agree to our Terms of Service and Privacy Policy.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </MarketplaceLayout>
    );
}