"use client";

import { useProducts } from '@/hooks/use-products';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight, Grid3x3, List, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Suspense, useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';

// Wrapper component to handle Suspense for useSearchParams
export default function ShopPageWrapper() {
    return (
        <Suspense fallback={<div className="container py-20 text-center">Loading...</div>}>
            <ShopPage />
        </Suspense>
    );
}

function ShopPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const page = parseInt(searchParams.get('page') || '1');
    const categoryId = searchParams.get('category_id') ? parseInt(searchParams.get('category_id')!) : undefined;
    const categorySlug = searchParams.get('category');
    const sortBy = searchParams.get('sort') || 'recent';
    const searchQuery = searchParams.get('search') || '';
    const inStock = searchParams.get('in_stock') === 'true';

    const { products, pagination, isLoading, isError } = useProducts(page, 12, {
        category_id: categoryId,
        category_slug: categorySlug || undefined,
        sort: sortBy,
        search: searchQuery || undefined
    });

    // Fetch BOGO deals
    const [bogoProductIds, setBogoProductIds] = useState<Set<number>>(new Set());
    useEffect(() => {
        api.get('/pricing/public/bogo-deals').then(res => {
            const deals = res.data?.data || [];
            const ids = new Set<number>();
            deals.forEach((deal: any) => {
                (deal.product_ids || []).forEach((id: number) => ids.add(id));
            });
            setBogoProductIds(ids);
        }).catch(() => {});
    }, []);

    const totalPages = pagination?.totalPage || 1;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', newPage.toString());
            router.push(`${pathname}?${params.toString()}`);
        }
    };

    const handleSortChange = (newSort: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('sort', newSort);
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const clearFilters = () => {
        router.push(pathname);
    };

    const hasActiveFilters = inStock || searchQuery;

    return (
        <div className="container px-4 py-8 mx-auto mt-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Shop All Products</h1>
                    <p className="text-muted-foreground mt-1">
                        {pagination?.total
                            ? `Showing ${products.length} of ${pagination.total} products`
                            : 'Browse our collection'}
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Mobile Filter Toggle */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="md:hidden"
                    >
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Filters
                    </Button>

                    {/* Stock Filter */}
                    <Button
                        variant={inStock ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterChange('in_stock', inStock ? '' : 'true')}
                    >
                        In Stock Only
                    </Button>

                    {/* Sort Dropdown */}
                    <select
                        value={sortBy}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="bg-background border border-input text-sm rounded-md h-9 px-3 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        <option value="recent">Most Recent</option>
                        <option value="price_low">Price: Low to High</option>
                        <option value="price_high">Price: High to Low</option>
                        <option value="name_asc">Name: A to Z</option>
                        <option value="name_desc">Name: Z to A</option>
                    </select>

                    {/* View Mode Toggle */}
                    <div className="flex border rounded-md overflow-hidden">
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="icon"
                            className="h-9 w-9 rounded-none"
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid3x3 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="icon"
                            className="h-9 w-9 rounded-none"
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                    <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
                    {inStock && (
                        <Button variant="secondary" size="sm" className="h-7 rounded-full">
                            In Stock
                            <X
                                className="h-3 w-3 ml-1"
                                onClick={() => handleFilterChange('in_stock', '')}
                            />
                        </Button>
                    )}
                    {searchQuery && (
                        <Button variant="secondary" size="sm" className="h-7 rounded-full">
                            Search: {searchQuery}
                            <X
                                className="h-3 w-3 ml-1"
                                onClick={() => handleFilterChange('search', '')}
                            />
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7" onClick={clearFilters}>
                        Clear all
                    </Button>
                </div>
            )}

            {/* Products Grid/List */}
            {isLoading ? (
                <div className={cn(
                    "grid gap-6 md:gap-8 min-h-[50vh]",
                    viewMode === 'grid'
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                        : "grid-cols-1"
                )}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="space-y-4">
                            <div className="aspect-square rounded-xl bg-secondary animate-pulse" />
                            <div className="h-4 w-3/4 rounded bg-secondary animate-pulse" />
                            <div className="h-4 w-1/2 rounded bg-secondary animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : isError ? (
                <div className="text-center py-20 text-red-500">
                    <p className="text-lg">Failed to load products. Please check the backend connection.</p>
                    <Button onClick={() => window.location.reload()} className="mt-4">
                        Try Again
                    </Button>
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-20">
                    <div className="max-w-md mx-auto">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold mb-2">No products found</h3>
                        <p className="text-muted-foreground mb-6">
                            {hasActiveFilters
                                ? 'Try adjusting your filters or search terms'
                                : 'Check back later for new arrivals'}
                        </p>
                        {hasActiveFilters && (
                            <Button onClick={clearFilters}>Clear Filters</Button>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <div className={cn(
                        "grid gap-6 md:gap-8",
                        viewMode === 'grid'
                            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                            : "grid-cols-1"
                    )}>
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                showNewBadge={true}
                                freeShipping={product.price > 100}
                                bogoDeal={bogoProductIds.has(product.id)}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-12">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                    let p = i + 1;
                                    if (totalPages > 5 && page > 3) {
                                        p = page - 2 + i;
                                    }
                                    if (p > totalPages) return null;

                                    return (
                                        <Button
                                            key={p}
                                            variant={page === p ? "default" : "ghost"}
                                            size="sm"
                                            className={cn(
                                                "w-9 h-9",
                                                page === p ? "pointer-events-none" : ""
                                            )}
                                            onClick={() => handlePageChange(p)}
                                        >
                                            {p}
                                        </Button>
                                    );
                                })}
                            </div>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Results Summary */}
                    <div className="text-center text-sm text-muted-foreground my-6">
                        Showing page {page} of {totalPages} ({pagination?.total || 0} products total)
                    </div>
                </>
            )}
        </div>
    );
}
