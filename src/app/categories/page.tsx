"use client";

import { useCategories, useProducts } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, ArrowRight, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';

export default function CategoriesPage() {
    const { categories, isLoading, isError } = useCategories();

    // Fetch all products to count per category
    const { products } = useProducts(1, 1000);

    // Count products per category
    const categoryProductCounts = useMemo(() => {
        const counts: Record<number, number> = {};
        products.forEach((product: any) => {
            if (product.category_id) {
                counts[product.category_id] = (counts[product.category_id] || 0) + 1;
            }
        });
        return counts;
    }, [products]);

    if (isLoading) {
        return (
            <div className="container px-4 py-20 flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="container py-20 text-center text-red-500">
                Failed to load categories.
            </div>
        );
    }

    // Filter out subcategories if you only want top level, or show structure
    // For now, flat list is fine as per schema default
    // Ideally, we group them.
    const topLevelCategories = categories.filter(c => !c.parent_id);

    // If no hierarchy is apparent or all are roots, just show all.
    const displayCategories = topLevelCategories.length > 0 ? topLevelCategories : categories;

    return (
        <div className="container px-4 py-12 mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Browse by Category</h1>
                <p className="text-muted-foreground text-lg">
                    Explore our wide range of products across various departments.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayCategories.map((category, index) => (
                    <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Link href={`/category/${category.slug || category.id}`} className="group block h-full">
                            <div className="relative h-full bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all p-8 flex flex-col justify-between min-h-[200px]">
                                {/* Decorative Background */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:bg-primary/10 transition-colors" />

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">
                                            {category.name}
                                        </h3>
                                        <div className="flex items-center gap-1 text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
                                            <Package className="w-4 h-4" />
                                            {categoryProductCounts[category.id] || 0}
                                        </div>
                                    </div>
                                    <p className="text-muted-foreground line-clamp-2">
                                        {category.description || 'Discover products in this category.'}
                                    </p>
                                </div>

                                <div className="relative z-10 pt-8 flex items-center text-sm font-semibold text-primary">
                                    Shop Now <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
