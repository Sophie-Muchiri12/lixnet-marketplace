import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Trash2, Upload } from 'lucide-react';
import { dashboard } from '@/routes';
import toast from 'react-hot-toast';
import axios from 'axios';

interface Category {
    id: number;
    name: string;
}

interface SubscriptionTier {
    name: string;
    price: number;
    features: string;
}

interface Product {
    id: number;
    title: string;
    description: string;
    price: number;
    category_id: number;
    rating: number;
    rating_count: number;
    note: string;
    image_path?: string;
    is_subscription: boolean;
    subscription_tiers?: Record<string, { price: number; features: string }>;
    category: {
        id: number;
        name: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Products',
        href: '/admin/products',
    },
    {
        title: 'Edit Product',
        href: '/admin/products/{product}/edit',
    },
];

export default function AdminProductEdit() {
    const { product } = usePage<{ product: Product }>().props;
    const [categories, setCategories] = useState<Category[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>(product.image_path || '');
    const [isSubscription, setIsSubscription] = useState(product.is_subscription);
    const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([]);

    const { data, setData, put, processing, errors } = useForm({
        title: product.title,
        description: product.description,
        price: product.price.toString(),
        category_id: product.category_id.toString(),
        rating: product.rating.toString(),
        rating_count: product.rating_count.toString(),
        note: product.note || '',
        image: null as File | null,
        is_subscription: product.is_subscription,
        subscription_tiers: product.subscription_tiers ? JSON.stringify(product.subscription_tiers) : '',
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('/api/categories', {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });
                setCategories(response.data.data);
            } catch (error) {
                toast.error('Failed to load categories');
            }
        };

        fetchCategories();
    }, []);

    // Initialize subscription tiers from product data
    useEffect(() => {
        if (product.subscription_tiers && typeof product.subscription_tiers === 'object') {
            const tiers = Object.entries(product.subscription_tiers).map(([name, data]) => ({
                name,
                price: data.price,
                features: data.features
            }));
            setSubscriptionTiers(tiers);
        }
    }, [product.subscription_tiers]);

    // Handle image file selection
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setData('image', file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle subscription toggle
    const handleSubscriptionToggle = (checked: boolean) => {
        setIsSubscription(checked);
        setData('is_subscription', checked);
        if (!checked) {
            setSubscriptionTiers([]);
            setData('subscription_tiers', '');
        }
    };

    // Handle subscription tier management
    const addSubscriptionTier = () => {
        setSubscriptionTiers([...subscriptionTiers, { name: '', price: 0, features: '' }]);
    };

    const updateSubscriptionTier = (index: number, field: keyof SubscriptionTier, value: string | number) => {
        const updatedTiers = [...subscriptionTiers];
        updatedTiers[index] = { ...updatedTiers[index], [field]: value };
        setSubscriptionTiers(updatedTiers);
    };

    const removeSubscriptionTier = (index: number) => {
        setSubscriptionTiers(subscriptionTiers.filter((_, i) => i !== index));
    };

    // Update form data when subscription tiers change
    useEffect(() => {
        if (subscriptionTiers.length > 0) {
            const tiersObject = subscriptionTiers.reduce((acc, tier) => {
                acc[tier.name.toLowerCase()] = {
                    price: tier.price,
                    features: tier.features
                };
                return acc;
            }, {} as Record<string, { price: number; features: string }>);
            setData('subscription_tiers', JSON.stringify(tiersObject));
        } else {
            setData('subscription_tiers', '');
        }
    }, [subscriptionTiers, setData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate subscription tiers if it's a subscription product
        if (isSubscription && subscriptionTiers.length === 0) {
            toast.error('Please add at least one subscription tier');
            return;
        }

        // Validate that all tiers have required fields
        if (isSubscription) {
            const invalidTiers = subscriptionTiers.filter(tier => !tier.name.trim() || tier.price <= 0);
            if (invalidTiers.length > 0) {
                toast.error('All subscription tiers must have a name and price greater than 0');
                return;
            }
        }

        put(`/api/admin/products/${product.id}`, {
            onSuccess: () => {
                toast.success('Product updated successfully');
            },
            onError: (errors) => {
                toast.error('Failed to update product');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Product" />

            <div className="space-y-6 p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <a href="/admin/products">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Products
                        </a>
                    </Button>
                </div>

                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Edit Product</h2>
                    <p className="text-muted-foreground">
                        Update product details
                    </p>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Product Details</CardTitle>
                        <CardDescription>
                            Modify the product information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Product Title</Label>
                                <Input
                                    id="title"
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Enter product title"
                                    required
                                />
                                {errors.title && (
                                    <p className="text-sm text-destructive">{errors.title}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Enter product description"
                                    rows={4}
                                    required
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">{errors.description}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price (KSh)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.price}
                                        onChange={(e) => setData('price', e.target.value)}
                                        placeholder="0.00"
                                        required
                                    />
                                    {errors.price && (
                                        <p className="text-sm text-destructive">{errors.price}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category_id">Category</Label>
                                    <Select
                                        value={data.category_id}
                                        onValueChange={(value) => setData('category_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category_id && (
                                        <p className="text-sm text-destructive">{errors.category_id}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="rating">Rating (0-5)</Label>
                                    <Input
                                        id="rating"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="5"
                                        value={data.rating}
                                        onChange={(e) => setData('rating', e.target.value)}
                                        placeholder="4.5"
                                    />
                                    {errors.rating && (
                                        <p className="text-sm text-destructive">{errors.rating}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="rating_count">Rating Count</Label>
                                    <Input
                                        id="rating_count"
                                        type="number"
                                        min="0"
                                        value={data.rating_count}
                                        onChange={(e) => setData('rating_count', e.target.value)}
                                        placeholder="0"
                                    />
                                    {errors.rating_count && (
                                        <p className="text-sm text-destructive">{errors.rating_count}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="note">Note (Optional)</Label>
                                <Textarea
                                    id="note"
                                    value={data.note}
                                    onChange={(e) => setData('note', e.target.value)}
                                    placeholder="Additional notes about the product"
                                    rows={2}
                                />
                                {errors.note && (
                                    <p className="text-sm text-destructive">{errors.note}</p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Updating...' : 'Update Product'}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <a href="/admin/products">Cancel</a>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
