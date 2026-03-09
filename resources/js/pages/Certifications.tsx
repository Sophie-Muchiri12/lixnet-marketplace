import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, CheckCircle, Clock, Lock } from 'lucide-react';
import axios from 'axios';

interface Certification {
    id: number;
    name: string;
    description: string;
    status: 'completed' | 'in_progress' | 'locked';
    completed_at: string | null;
    expires_at: string | null;
}

export default function AgentCertifications() {
    const [certs, setCerts] = useState<Certification[]>([]);
    const [loading, setLoading] = useState(true);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/agent/dashboard' },
        { title: 'Certifications', href: '/agent/certifications' },
    ];

    useEffect(() => {
        axios.get('/api/agent/certifications', {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(res => setCerts(res.data.certifications || res.data || []))
            .catch(() => {
                // Silently fail — certifications may not be implemented yet
                setCerts([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const completed = certs.filter(c => c.status === 'completed').length;

    const STATUS_CONFIG = {
        completed:   { icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10', badge: 'default' as const,     label: 'Completed' },
        in_progress: { icon: Clock,        color: 'text-amber-600', bg: 'bg-amber-100', badge: 'secondary' as const,  label: 'In Progress' },
        locked:      { icon: Lock,         color: 'text-muted-foreground', bg: 'bg-muted', badge: 'outline' as const, label: 'Locked' },
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Certifications" />
                <div className="space-y-6 p-4">
                    <Skeleton className="h-24 w-full" />
                    <div className="grid gap-4 md:grid-cols-2">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40" />)}
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Certifications" />

            <div className="space-y-6 p-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Certifications</h2>
                    <p className="text-muted-foreground">Complete certifications to unlock higher commission tiers and bonuses.</p>
                </div>

                {/* Progress summary */}
                {certs.length > 0 && (
                    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                                    <Award className="h-7 w-7 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{completed} / {certs.length} Completed</p>
                                    <p className="text-muted-foreground text-sm">Keep completing certifications to unlock more benefits.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Certifications grid */}
                {certs.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="font-semibold text-lg mb-1">No certifications available yet</p>
                            <p className="text-muted-foreground text-sm">Check back soon — certifications will appear here once they're launched.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {certs.map(cert => {
                            const cfg = STATUS_CONFIG[cert.status] || STATUS_CONFIG.locked;
                            const Icon = cfg.icon;
                            return (
                                <Card key={cert.id} className={cert.status === 'locked' ? 'opacity-60' : ''}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                                                    <Icon className={`h-5 w-5 ${cfg.color}`} />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base">{cert.name}</CardTitle>
                                                </div>
                                            </div>
                                            <Badge variant={cfg.badge}>{cfg.label}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="mb-3">{cert.description}</CardDescription>
                                        {cert.completed_at && (
                                            <p className="text-xs text-muted-foreground">
                                                Completed: {new Date(cert.completed_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </p>
                                        )}
                                        {cert.expires_at && (
                                            <p className="text-xs text-amber-600 mt-1">
                                                Expires: {new Date(cert.expires_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}