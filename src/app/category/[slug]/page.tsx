"use client";

import { use, useState, useEffect } from 'react';
import { useProducts, useCategory } from '@/hooks/use-products';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/lib/api';



export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [page, setPage] = useState(1);


    const { category, isLoading: isCategoryLoading, isError: isCategoryError } = useCategory(slug);
    const { products, pagination, isLoading: isProductsLoading, isError: isProductsError } = useProducts(page, 12, { category_slug: slug });

    const totalPages = pagination?.totalPage || 1;



    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (isCategoryLoading) {
        return (
            <div className="container px-4 py-20 flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isCategoryError || !category) {
        return (
            <div className="container py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">Category not found</h2>
                <div className="text-muted-foreground mb-6">
                    The category you are looking for does not exist.
                </div>
                <Link href="/categories">
                    <Button>Browse Categories</Button>
                </Link>
            </div>
        );
    }

    return (
        <>
            {/* Category Banner */}
            <section className="relative w-full overflow-hidden bg-black py-10">
                {/* Mesh Gradient */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-30%] left-[-10%] w-[45%] h-[120%] bg-indigo-600/15 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-30%] right-[-5%] w-[40%] h-[120%] bg-violet-600/15 rounded-full blur-[100px]" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
                </div>

                {/* Bottom border glow */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

                <div className="container relative z-10 px-6 mx-auto flex flex-col items-center justify-center text-center gap-4">
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
                            Category
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight capitalize">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-500">
                                {category.name}
                            </span>
                        </h1>
                        <p className="text-zinc-400 text-base max-w-lg leading-relaxed">
                            {category.description || `Explore our curated collection of ${category.name} products.`}
                        </p>
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-xs text-zinc-500 pt-1">
                            <span
                                className="hover:text-white transition-colors cursor-pointer"
                                onClick={() => window.location.href = '/'}
                            >
                                Home
                            </span>
                            <span>/</span>
                            <Link href="/categories" className="hover:text-white transition-colors">
                                Categories
                            </Link>
                            <span>/</span>
                            <span className="text-white capitalize">{category.name}</span>
                        </div>
                        {/* Product count */}
                        {pagination?.total != null && (
                            <div className="flex items-center gap-2 pt-1 text-xs text-zinc-500">
                                <span className="w-1 h-1 rounded-full bg-indigo-500 inline-block" />
                                {pagination.total} product{pagination.total !== 1 ? 's' : ''} available
                            </div>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* Products Section */}
            <section className="py-10 md:py-16">
                <div className="container px-4 mx-auto">


                    {isProductsLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 min-h-[50vh]">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="space-y-4">
                                    <div className="aspect-square rounded-xl bg-secondary animate-pulse" />
                                    <div className="h-4 w-3/4 rounded bg-secondary animate-pulse" />
                                    <div className="h-4 w-1/2 rounded bg-secondary animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : isProductsError ? (
                        <div className="text-center py-20 text-red-500">
                            <p className="text-lg">Failed to load products.</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20 bg-secondary/20 rounded-xl">
                            <h3 className="text-xl font-semibold mb-2">No products found here yet.</h3>
                            <p className="text-muted-foreground">
                                Check back later for new additions to {category.name}.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                                {products.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>

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
                                                    className={cn("w-9 h-9", page === p ? "pointer-events-none" : "")}
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
                        </>
                    )}
                </div>
            </section>
        </>
    );
}
