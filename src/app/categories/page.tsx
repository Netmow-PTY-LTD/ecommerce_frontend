"use client";

import { useCategories } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Category } from '@/types';

export default function CategoriesPage() {
    const [page, setPage] = useState(1);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const { categories, pagination, isLoading, isError } = useCategories(page, 9);

    useEffect(() => {
        if (categories && categories.length > 0) {
            setAllCategories(prev => {
                const existingIds = new Set(prev.map(c => c.id));
                const newOnes = categories.filter(c => !existingIds.has(c.id));
                return [...prev, ...newOnes];
            });
        }
    }, [categories]);

    const handleLoadMore = () => {
        if (pagination && page < pagination.totalPage) {
            setPage(prev => prev + 1);
        }
    };

    if (isLoading && allCategories.length === 0) {
        return (
            <div className="min-h-[40vh] flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
                <p className="text-slate-500 text-sm">Loading...</p>
            </div>
        );
    }

    if (isError && allCategories.length === 0) {
        return (
            <div className="container px-4 py-12 text-center text-red-500 text-sm">
                Failed to load categories.
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen pb-12">
            {/* Compact Red Banner */}
            <section className="py-3 bg-brand">
                <div className="container px-4 mx-auto">
                    <div className="w-full flex items-center justify-between">
                        <h1 className="text-white font-bold text-sm md:text-base tracking-wide">Category List</h1>
                        <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
                            <Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
                            <span className="text-white/50">-</span>
                            <span className="text-white">Categories</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Browse By Category Text Block */}
            <section className="py-8">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">
                        Browse By Category
                    </h2>
                    <p className="text-slate-500 text-sm">
                        Explore our wide range of products across various departments.
                    </p>
                </div>
            </section>



            {/* Grid */}

            <section className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {allCategories.map((category) => (
                            <motion.div
                                key={category.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Link
                                    href={`/shop?category_id=${category.id}`}
                                    className="group block bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-brand/30 hover:shadow-sm transition-all"
                                >
                                    <div className="relative aspect-[16/10] bg-slate-50">
                                        {category.image_url ? (
                                            <Image
                                                src={category.image_url}
                                                alt={category.name}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ShoppingBag className="h-10 w-10 text-slate-200" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4">
                                        <div className="flex justify-between items-start gap-2 mb-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-slate-400 text-[10px] font-medium mb-0.5 line-clamp-1">
                                                    {category.description || 'Category Department'}
                                                </p>
                                                <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-brand transition-colors">
                                                    {category.name}
                                                </h3>
                                            </div>
                                            <div className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 text-[10px] font-bold">
                                                {category.total_products || 0}
                                            </div>
                                        </div>

                                        <div className="flex items-center text-brand font-bold text-[11px] uppercase tracking-wider">
                                            Shop Now
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {pagination && pagination.page < pagination.totalPage && (
                    <div className="mt-12 flex justify-center">
                        <Button
                            onClick={handleLoadMore}
                            disabled={isLoading}
                            variant="outline"
                            className="rounded-lg border-slate-200 px-8 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            {isLoading ? 'Loading...' : 'Load More'}
                        </Button>
                    </div>
                )}
            </section>
        </div>
    );
}


