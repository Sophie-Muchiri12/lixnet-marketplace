import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Star } from 'lucide-react';
import axios from 'axios';

interface Product {
    id: number;
    name: string;
    description: string | null;
    price: number;
    base_price?: number;
    is_subscription: boolean;
    rating?: number;
    review_count?: number;
    category?: { name: string } | null;
}

const fmt = (v: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 2 }).format(v);

function ProductSkeleton() {
    return (
        <Card>
            <CardContent className="pt-5 space-y-3">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <div className="pt-2 border-t flex justify-between items-center">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-24" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function AgentProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/agent/dashboard' },
        { title: 'Products', href: '/agent/products' },
    ];

    useEffect(() => {
        axios.get('/api/products?per_page=100', {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(res => {
                const data = res.data;
                const items: Product[] = Array.isArray(data) ? data : (data.data || []);
                setProducts(items);
            })
            .catch(err => toast.error(err.response?.data?.message || 'Failed to load products'))
            .finally(() => setLoading(false));
    }, []);

    // Extract unique categories
    const categories = ['All', ...Array.from(new Set(
        products.map(p => p.category?.name || 'Other').filter(Boolean)
    ))];

    const filtered = products.filter(p => {
        const catName = p.category?.name || 'Other';
        const matchesCat = activeFilter === 'All' || catName === activeFilter;
        const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase());
        return matchesCat && matchesSearch;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />

            <div className="space-y-6 p-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Products & Pricing</h2>
                    <p className="text-muted-foreground">Browse the full catalogue available to sell to your customers.</p>
                </div>

                {/* Search + Category Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search products…"
                            className="pl-9"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {!loading && categories.map(c => (
                            <Button
                                key={c}
                                variant={activeFilter === c ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveFilter(c)}
                            >
                                {c}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => <ProductSkeleton key={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <p className="text-4xl mb-3">🔍</p>
                        <p className="font-semibold">No products found</p>
                        <p className="text-sm mt-1">Try adjusting your search or category filter.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(p => {
                            const price = p.price ?? p.base_price ?? 0;
                            const catName = p.category?.name || 'Other';
                            const rating = p.rating || 4.5;
                            const rc = p.review_count || 0;

                            return (
                                <Card key={p.id} className="hover:shadow-md transition-shadow duration-200">
                                    <CardContent className="pt-5">
                                        {/* Category + Sub badge */}
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wide text-primary">
                                                {catName}
                                            </span>
                                            {p.is_subscription && (
                                                <Badge variant="secondary" className="text-xs">Sub</Badge>
                                            )}
                                        </div>

                                        {/* Name */}
                                        <p className="font-bold text-base leading-snug mb-2">{p.name}</p>

                                        {/* Description */}
                                        {p.description && (
                                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                                                {p.description}
                                            </p>
                                        )}

                                        {/* Star Rating */}
                                        <div className="flex items-center gap-1 mb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className="h-3 w-3"
                                                    fill={i < Math.round(rating) ? '#f59e0b' : 'none'}
                                                    stroke="#f59e0b"
                                                />
                                            ))}
                                            <span className="text-xs text-muted-foreground ml-1">
                                                {rating} ({rc})
                                            </span>
                                        </div>

                                        {/* Price */}
                                        <div className="border-t pt-3 flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">
                                                {p.is_subscription ? 'Subscription' : 'One-time'}
                                            </span>
                                            <span className="text-xl font-black text-primary font-mono">
                                                {price === 0 ? 'Free' : fmt(price)}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Results count */}
                {!loading && filtered.length > 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                        Showing {filtered.length} of {products.length} products
                    </p>
                )}
            </div>
        </AppLayout>
    );
}