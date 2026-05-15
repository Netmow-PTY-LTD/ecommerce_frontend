"use client";

import { useArrivals, useFeaturedArrivals } from '@/hooks/use-arrivals';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, Sparkles, Star, Package } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function ArrivalsPage() {
    const [activeTab, setActiveTab] = useState<'all' | 'featured'>('all');
    const [page, setPage] = useState(1);

    const { arrivals, pagination, isLoading, isError } = useArrivals(page, 12);
    const { arrivals: featuredArrivals, isLoading: isLoadingFeatured } = useFeaturedArrivals(12);

    const displayArrivals = activeTab === 'all' ? arrivals : featuredArrivals;
    const currentPagination = activeTab === 'all' ? pagination : { total: featuredArrivals.length, page: 1, limit: 12 };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-brand/10 via-brand/5 to-background border-b">
                <div className="container px-4 mx-auto py-12">
                    <div className="flex items-center gap-3 mb-4">
                        <Sparkles className="h-8 w-8 text-brand" />
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">New Arrivals</h1>
                    </div>
                    <p className="text-muted-foreground text-lg">
                        Discover the latest additions to our collection, fresh from our team.
                    </p>

                    {/* Tab Navigation */}
                    <div className="flex gap-4 mt-8">
                        <Button
                            variant={activeTab === 'all' ? 'default' : 'outline'}
                            onClick={() => { setActiveTab('all'); setPage(1); }}
                            className="gap-2"
                        >
                            <Sparkles className="h-4 w-4" />
                            All Arrivals
                        </Button>
                        <Button
                            variant={activeTab === 'featured' ? 'default' : 'outline'}
                            onClick={() => { setActiveTab('featured'); setPage(1); }}
                            className="gap-2"
                        >
                            <Star className="h-4 w-4" />
                            Featured
                        </Button>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="container px-4 mx-auto py-12">
                {isLoading || isLoadingFeatured ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : isError ? (
                    <div className="text-center py-12 text-red-500">
                        Failed to load arrivals. Please try again later.
                    </div>
                ) : displayArrivals.length === 0 ? (
                    <div className="text-center py-20">
                        <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No arrivals yet</h3>
                        <p className="text-muted-foreground mb-6">Check back soon for new products!</p>
                        <Link href="/shop">
                            <Button>Browse All Products</Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {displayArrivals.map((arrival) => (
                                arrival.product && (
                                    <ProductCard
                                        key={arrival.id}
                                        product={arrival.product}
                                        showNewBadge={true}
                                        badgeText={arrival.badge_text}
                                    />
                                )
                            ))}
                        </div>

                        {/* Pagination */}
                        {currentPagination.totalPage > 1 && activeTab === 'all' && (
                            <div className="flex justify-center items-center gap-2 mt-12">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(currentPagination.totalPage, 5) }, (_, i) => {
                                        let pageNum;
                                        if (currentPagination.totalPage <= 5) {
                                            pageNum = i + 1;
                                        } else if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= currentPagination.totalPage - 2) {
                                            pageNum = currentPagination.totalPage - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={page === pageNum ? 'default' : 'outline'}
                                                size="icon"
                                                onClick={() => handlePageChange(pageNum)}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === currentPagination.totalPage}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
