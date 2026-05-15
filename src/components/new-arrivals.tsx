"use client";

import { useArrivals } from '@/hooks/use-arrivals';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';

export function NewArrivals() {
    const { arrivals, isLoading, isError } = useArrivals(1, 8);

    return (
        <section className="py-20 bg-gradient-to-b from-brand/5 to-background">
            <div className="container px-4 mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-brand" />
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">New Arrivals</h2>
                        </div>
                        <p className="text-muted-foreground text-lg">Fresh from our collection.</p>
                    </div>
                    <Link href="/shop?sort=newest">
                        <Button variant="ghost" className="gap-2 group">
                            View All <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </Link>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : isError ? (
                    <div className="text-center py-12 text-red-500">
                        Failed to load new arrivals. Please check the backend connection.
                    </div>
                ) : arrivals.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No new arrivals at the moment. Check back soon!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {arrivals.map((arrival) => (
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
                )}
            </div>
        </section>
    );
}
