import { ReactNode, useEffect, useState } from 'react';
import { MarketplaceHeader } from './marketplace-header';
import { MarketplaceFooter } from './marketplace-footer';
import ShowFlashToast from './ShowFlashToast';

interface Category {
    id: number;
    name: string;
    slug: string;
    products_count?: number;
}

interface MarketplaceLayoutProps {
    children: ReactNode;
    onSearch?: (query: string) => void;
    onCategoryFilter?: (categoryId: string) => void;
    onCartClick?: () => void;
    onLoginClick?: () => void;
}

export function MarketplaceLayout({
    children,
    onSearch = () => { },
    onCategoryFilter = () => { },
    onCartClick = () => { },
    onLoginClick = () => { }
}: MarketplaceLayoutProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch categories on mount
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/categories', {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setCategories(data.data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-color flex flex-col">
            <div className="shadow-lg">
                <MarketplaceHeader
                    categories={categories}
                    onSearch={onSearch}
                    onCategoryFilter={onCategoryFilter}
                    onCartClick={onCartClick}
                    onLoginClick={onLoginClick}
                />
            </div>

            <ShowFlashToast />

            <main className="flex-1 p-4">
                {children}
            </main>

            <MarketplaceFooter />
        </div>
    );
}
