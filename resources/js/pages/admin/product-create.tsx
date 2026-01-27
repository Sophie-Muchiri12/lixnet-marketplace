import { Head, useForm } from '@inertiajs/react';
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
        title: 'Create Product',
        href: '/admin/products/create',
    },
];

export default function AdminProductCreate() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [isSubscription, setIsSubscription] = useState(false);
    const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([]);

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        price: '',
        category_id: '',
        rating: '',
        rating_count: '',
        note: '',
        image: null as File | null,
        is_subscription: false,
        subscription_tiers: '',
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

        post('/api/admin/products', {
            onSuccess: () => {
                toast.success('Product created successfully');
            },
            onError: (errors) => {
                toast.error('Failed to create product');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Product" />

            <div className="space-y-6 p-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <a href="/admin/products">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Products
                        </a>
                    </Button>
                    <h1 className="text-2xl font-bold">Create New Product</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Product Details</CardTitle>
                        <CardDescription>
                            Fill in the details below to create a new product.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="Product title"
                                        required
                                    />
                                    {errors.title && (
                                        <p className="text-sm text-destructive">{errors.title}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category_id">Category *</Label>
                                    <Select value={data.category_id} onValueChange={(value) => setData('category_id', value)}>
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

                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Product description"
                                    rows={4}
                                    required
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">{errors.description}</p>
                                )}
                            </div>

                            {/* Image Upload Section */}
                            <div className="space-y-4">
                                <Label>Product Image</Label>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <Input
                                            id="image"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                        <Label
                                            htmlFor="image"
                                            className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                                        >
                                            {imagePreview ? (
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="max-h-28 max-w-full object-contain"
                                                />
                                            ) : (
                                                <div className="text-center">
                                                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                                    <p className="text-sm text-gray-500">Click to upload image</p>
                                                    <p className="text-xs text-gray-400">PNG, JPG, WebP up to 5MB</p>
                                                </div>
                                            )}
                                        </Label>
                                    </div>
                                </div>
                                {errors.image && (
                                    <p className="text-sm text-destructive">{errors.image}</p>
                                )}
                            </div>

                            {/* Subscription Toggle */}
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_subscription"
                                    checked={isSubscription}
                                    onCheckedChange={handleSubscriptionToggle}
                                />
                                <Label htmlFor="is_subscription">This is a subscription-based product</Label>
                            </div>

                            {/* Subscription Tiers Section */}
                            {isSubscription && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-medium">Subscription Tiers</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addSubscriptionTier}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Tier
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {subscriptionTiers.map((tier, index) => (
                                            <Card key={index} className="p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Tier Name *</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="e.g., Basic, Premium"
                                                            value={tier.name}
                                                            onChange={(e) => updateSubscriptionTier(index, 'name', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Price (KSh) *</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            value={tier.price || ''}
                                                            onChange={(e) => updateSubscriptionTier(index, 'price', parseFloat(e.target.value) || 0)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2 flex items-end">
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => removeSubscriptionTier(index)}
                                                            className="w-full"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 mt-4">
                                                    <Label>Features</Label>
                                                    <Textarea
                                                        placeholder="Describe what this tier includes..."
                                                        value={tier.features}
                                                        onChange={(e) => updateSubscriptionTier(index, 'features', e.target.value)}
                                                        rows={2}
                                                    />
                                                </div>
                                            </Card>
                                        ))}
                                    </div>

                                    {subscriptionTiers.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>No subscription tiers added yet.</p>
                                            <p className="text-sm">Click "Add Tier" to create your first subscription plan.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Regular Price Field - Only show if not subscription */}
                            {!isSubscription && (
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price (KSh) *</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.price}
                                        onChange={(e) => setData('price', e.target.value)}
                                        placeholder="0.00"
                                        required
                                    />
                                    {errors.price && (
                                        <p className="text-sm text-destructive">{errors.price}</p>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="rating">Rating</Label>
                                    <Input
                                        id="rating"
                                        type="number"
                                        min="0"
                                        max="5"
                                        step="0.1"
                                        value={data.rating}
                                        onChange={(e) => setData('rating', e.target.value)}
                                        placeholder="5.0"
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
                                    {processing ? 'Creating...' : 'Create Product'}
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
