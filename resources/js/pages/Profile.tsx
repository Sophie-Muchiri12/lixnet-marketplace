import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState, useEffect, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award } from 'lucide-react';
import axios from 'axios';

interface AgentProfile {
    agent_code: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    bank_name: string | null;
    account_holder_name: string | null;
    account_number: string | null;
    branch_code: string | null;
    swift_code: string | null;
    bank_address: string | null;
    user: {
        name: string;
        email: string;
        phone: string | null;
        company: string | null;
    };
    tier: {
        name: string;
        commission_rate: number;
        min_sales: number;
        max_sales: number | null;
    } | null;
}

interface FormState {
    name: string;
    email: string;
    phone: string;
    company: string;
    bank_name: string;
    account_holder_name: string;
    account_number: string;
    branch_code: string;
    swift_code: string;
    bank_address: string;
}

const TIER_COLORS: Record<string, string> = {
    bronze: 'bg-orange-100 text-orange-700',
    silver: 'bg-slate-100 text-slate-700',
    gold: 'bg-yellow-100 text-yellow-700',
};

const TIER_ICONS: Record<string, string> = {
    bronze: '🥉', silver: '🥈', gold: '🥇',
};

export default function AgentProfile() {
    const [profile, setProfile] = useState<AgentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>({
        name: '', email: '', phone: '', company: '',
        bank_name: '', account_holder_name: '', account_number: '',
        branch_code: '', swift_code: '', bank_address: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/agent/dashboard' },
        { title: 'My Profile', href: '/agent/profile' },
    ];

    useEffect(() => {
        axios.get('/api/agent/profile', {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(res => {
                const d: AgentProfile = res.data?.data ?? res.data;
                setProfile(d);
                setForm({
                    name: d.user?.name || '',
                    email: d.user?.email || '',
                    phone: d.user?.phone || '',
                    company: d.user?.company || '',
                    bank_name: d.bank_name || '',
                    account_holder_name: d.account_holder_name || '',
                    account_number: d.account_number || '',
                    branch_code: d.branch_code || '',
                    swift_code: d.swift_code || '',
                    bank_address: d.bank_address || '',
                });
            })
            .catch(err => {
                const msg = err.response?.data?.message || err.message || 'Failed to load profile';
                setError(msg);
                toast.error(msg);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await axios.put('/api/agent/profile', form, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const d: AgentProfile = res.data?.data ?? res.data;
            setProfile(d);
            toast.success('Profile updated successfully');
        } catch (err: any) {
            const errors = err.response?.data?.errors;
            const msg = errors
                ? Object.values(errors).flat()[0] as string
                : err.response?.data?.message || 'Update failed';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="My Profile" />
                <div className="space-y-6 p-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-80 w-full" />
                </div>
            </AppLayout>
        );
    }

    if (error && !profile) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="My Profile" />
                <div className="flex min-h-[400px] items-center justify-center p-4">
                    <div className="text-center">
                        <p className="text-muted-foreground">{error}</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const tier = profile?.tier;
    const tierName = tier?.name?.toLowerCase() || 'bronze';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Profile" />

            <div className="space-y-6 p-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
                    <p className="text-muted-foreground">Manage your personal information and banking details for commission payouts.</p>
                </div>

                {/* Profile Hero Card */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-white">
                                    {(profile?.user?.name || 'A').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-xl font-bold">{profile?.user?.name}</p>
                                    <p className="text-muted-foreground text-sm">{profile?.user?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Agent Code</p>
                                    <p className="text-lg font-bold text-primary font-mono">{profile?.agent_code}</p>
                                </div>
                                {tier && (
                                    <Badge className={TIER_COLORS[tierName]} variant="outline">
                                        <Award className="h-4 w-4 mr-1" />
                                        {TIER_ICONS[tierName]} {tier.name.charAt(0).toUpperCase() + tier.name.slice(1)}
                                    </Badge>
                                )}
                                <Badge variant={profile?.is_active ? 'default' : 'destructive'}>
                                    {profile?.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="personal">
                    <TabsList>
                        <TabsTrigger value="personal">Personal Info</TabsTrigger>
                        <TabsTrigger value="banking">Banking Details</TabsTrigger>
                        <TabsTrigger value="account">Account Info</TabsTrigger>
                    </TabsList>

                    {/* Personal Info */}
                    <TabsContent value="personal">
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>Update your name, email, and contact details.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                                        <Input id="name" name="name" value={form.name} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                                        <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input id="phone" name="phone" value={form.phone} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="company">Company / Business</Label>
                                        <Input id="company" name="company" value={form.company} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button onClick={handleSave} disabled={saving}>
                                        {saving ? 'Saving…' : 'Save Changes'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Banking Details */}
                    <TabsContent value="banking">
                        <Card>
                            <CardHeader>
                                <CardTitle>Banking Details</CardTitle>
                                <CardDescription>Used for commission payouts. Keep this accurate.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="bank_name">Bank Name</Label>
                                        <Input id="bank_name" name="bank_name" value={form.bank_name} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="account_holder_name">Account Holder Name</Label>
                                        <Input id="account_holder_name" name="account_holder_name" value={form.account_holder_name} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="account_number">Account Number</Label>
                                        <Input id="account_number" name="account_number" value={form.account_number} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="branch_code">Branch Code</Label>
                                        <Input id="branch_code" name="branch_code" value={form.branch_code} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="swift_code">SWIFT Code</Label>
                                        <Input id="swift_code" name="swift_code" value={form.swift_code} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="bank_address">Bank Address</Label>
                                        <textarea
                                            id="bank_address"
                                            name="bank_address"
                                            value={form.bank_address}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button onClick={handleSave} disabled={saving}>
                                        {saving ? 'Saving…' : 'Save Banking Details'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Account Info */}
                    <TabsContent value="account">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Account Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {[
                                        { label: 'Agent Code', value: profile?.agent_code, mono: true },
                                        { label: 'Member Since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }) : null },
                                        { label: 'Last Updated', value: profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }) : null },
                                        { label: 'Status', value: profile?.is_active ? 'Active' : 'Inactive' },
                                    ].map(f => (
                                        <div key={f.label}>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{f.label}</p>
                                            <p className={`text-sm ${f.mono ? 'font-mono font-bold text-primary' : 'text-foreground'}`}>
                                                {f.value || <span className="text-muted-foreground italic">Not provided</span>}
                                            </p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {tier && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Current Tier</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-content-center text-xl flex items-center justify-center">
                                                {TIER_ICONS[tierName]}
                                            </div>
                                            <div>
                                                <p className="font-bold capitalize">{tier.name} Tier</p>
                                                <p className="text-sm text-muted-foreground">{tier.commission_rate}% commission rate</p>
                                            </div>
                                        </div>
                                        <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Min Sales</span>
                                                <span className="font-mono font-bold">KSh {Number(tier.min_sales || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Max Sales</span>
                                                <span className="font-mono font-bold">
                                                    {tier.max_sales ? `KSh ${Number(tier.max_sales).toLocaleString()}` : 'Unlimited'}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}