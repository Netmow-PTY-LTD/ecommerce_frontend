"use client";

import { useProducts } from '@/hooks/use-products';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';

export function FeaturedProducts() {
    const { products, isLoading, isError } = useProducts(1, 8); // Fetch 8 products

    return (
        <section className="py-20 bg-background">
            <div className="container px-4 mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                    <div className="space-y-2">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Featured Collection</h2>
                        <p className="text-muted-foreground text-lg">Handpicked items just for you.</p>
                    </div>
                    <Link href="/shop">
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
                        Failed to load products. Please check the backend connection.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
