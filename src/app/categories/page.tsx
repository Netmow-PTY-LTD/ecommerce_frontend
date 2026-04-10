"use client";

import { useCategories, useProducts } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, ArrowRight, Package } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';

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
        <>
            {/* Categories Banner */}
            <section className="relative w-full overflow-hidden bg-black py-10">
                {/* Mesh Gradient */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-30%] left-[-10%] w-[45%] h-[120%] bg-indigo-600/15 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-30%] right-[-5%] w-[40%] h-[120%] bg-violet-600/15 rounded-full blur-[100px]" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
                </div>

                {/* Bottom border glow */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

                <div className="container relative z-10 px-6 mx-auto flex flex-col items-center justify-center text-center gap-4 py-20">
                    <motion.div
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="space-y-4 flex flex-col items-center"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-[10px] font-semibold text-white/70 tracking-widest uppercase">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500" />
                            </span>
                            All Departments
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                            Browse by{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-500">
                                Category
                            </span>
                        </h1>
                        <p className="text-zinc-400 text-base max-w-lg leading-relaxed">
                            Explore our wide range of products across various departments. Find exactly what you're looking for.
                        </p>
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-xs text-zinc-500 pt-1">
                            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => window.location.href = '/'}>Home</span>
                            <span>/</span>
                            <span className="text-white">Categories</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Categories Grid */}
            <section className="py-12">
                <div className="container px-4 mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {displayCategories.map((category, index) => (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link href={`/category/${category.slug || category.id}`} className="group block h-full">
                                    <div className="relative h-full bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col min-h-[200px]">
                                        {/* Category Image */}
                                        {category.image_url ? (
                                            <div className="relative w-full h-48 overflow-hidden">
                                                <Image
                                                    src={category.image_url}
                                                    alt={category.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                    unoptimized
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                <div className="absolute bottom-3 left-4 right-4">
                                                    <h3 className="text-xl font-bold text-white drop-shadow-md">
                                                        {category.name}
                                                    </h3>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative w-full h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                                <Package className="h-16 w-16 text-primary/20" />
                                                <div className="absolute bottom-3 left-4">
                                                    <h3 className="text-xl font-bold">
                                                        {category.name}
                                                    </h3>
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-6 flex flex-1 flex-col justify-between">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-muted-foreground text-sm line-clamp-2">
                                                    {category.description || 'Discover products in this category.'}
                                                </p>
                                                <div className="flex items-center gap-1 text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full ml-3 shrink-0">
                                                    <Package className="w-4 h-4" />
                                                    {categoryProductCounts[category.id] || 0}
                                                </div>
                                            </div>

                                            <div className="pt-4 flex items-center text-sm font-semibold text-primary">
                                                Shop Now <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
