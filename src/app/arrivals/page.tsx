"use client";

import { useArrivals, useFeaturedArrivals } from '@/hooks/use-arrivals';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, Sparkles, Star, Package } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type TabType = 'all' | 'featured';

export default function ArrivalsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [page, setPage] = useState(1);

    const { arrivals, pagination, isLoading, isError } = useArrivals(page, 12);
    const { arrivals: featuredArrivals, isLoading: isLoadingFeatured } = useFeaturedArrivals(12);

    const displayArrivals = activeTab === 'all' ? arrivals : featuredArrivals;

    // Safely resolve total pages regardless of which pagination shape is active
    const totalPages = activeTab === 'all' ? (pagination?.totalPage ?? 1) : 1;

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const tabs = [
        { id: 'all' as TabType, label: 'All Arrivals', icon: Sparkles },
        { id: 'featured' as TabType, label: 'Featured', icon: Star },
    ];

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Red Header Banner */}
            <section className="py-3 bg-brand">
                <div className="container">
                    <div className="w-full flex items-center justify-between">
                        <h1 className="text-white font-bold text-sm md:text-base tracking-wide">New Arrivals</h1>
                        <div className="flex items-center gap-2 text-xs font-medium">
                            <Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
                            <span className="text-white/50">/</span>
                            <span className="text-white">New Arrivals</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Hero Section */}
            <section className="bg-white border-b border-slate-200 py-10 md:py-16">
                <div className="container text-center">
                    <p className="text-xs font-bold text-brand uppercase tracking-widest mb-3">Just Landed</p>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
                        Fresh Picks, Just for You
                    </h2>
                    <p className="text-slate-500 text-sm max-w-xl mx-auto mb-8">
                        Explore the latest additions to our collection. Hand-picked, quality-checked, and ready to ship.
                    </p>

                    {/* Tab Switcher */}
                    <div className="inline-flex items-center bg-slate-100 rounded-2xl p-1 gap-1">
                        {tabs.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => { setActiveTab(id); setPage(1); }}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200",
                                    activeTab === id
                                        ? "bg-white text-brand shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Products Grid */}
            <section className="py-8 md:py-16">

                <div className="container">
                    {/* Loading */}
                    {(isLoading || isLoadingFeatured) ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-brand" />
                            <p className="text-sm text-slate-400 font-medium">Loading new arrivals...</p>
                        </div>
                    ) : isError ? (
                        <div className="text-center py-16 bg-white rounded-3xl border border-red-100">
                            <p className="text-red-500 font-bold text-sm">Failed to load arrivals. Please try again later.</p>
                            <Button variant="ghost" className="mt-4 text-brand font-bold" onClick={() => window.location.reload()}>
                                Retry
                            </Button>
                        </div>
                    ) : displayArrivals.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                            <Package className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-base font-bold text-slate-500 mb-2">No arrivals yet</h3>
                            <p className="text-sm text-slate-400 mb-6">Check back soon for new products!</p>
                            <Link href="/shop">
                                <Button className="bg-brand text-white hover:bg-brand/90 rounded-xl px-6 font-bold">
                                    Browse All Products
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Result Count */}
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                                {displayArrivals.length} {activeTab === 'featured' ? 'featured' : ''} items found
                            </p>

                            {/* Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-10">
                                {displayArrivals.map((arrival) => (
                                    arrival.product && (
                                        <ProductCard
                                            key={arrival.id}
                                            product={arrival.product}
                                            showNewBadge={true}
                                            badgeText={arrival.badge_text ?? undefined}
                                        />
                                    )
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && activeTab === 'all' && (
                                <div className="flex items-center justify-center gap-2 mt-10">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-xl h-9 w-9 border-slate-200"
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    <div className="flex gap-1">
                                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                            let pageNum: number;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (page <= 3) {
                                                pageNum = i + 1;
                                            } else if (page >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = page - 2 + i;
                                            }
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    size="icon"
                                                    className={cn(
                                                        "rounded-xl h-9 w-9 text-xs font-bold transition-all",
                                                        page === pageNum
                                                            ? "bg-brand text-white shadow-md shadow-brand/20 border-brand"
                                                            : "bg-white text-slate-600 border border-slate-200 hover:border-brand hover:text-brand"
                                                    )}
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
                                        className="rounded-xl h-9 w-9 border-slate-200"
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page === totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            {totalPages > 1 && activeTab === 'all' && (
                                <p className="text-center text-xs text-slate-400 font-medium mt-4">
                                    Page {page} of {totalPages}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
