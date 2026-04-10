"use client";

import { use, useState, useEffect } from 'react';
import { useProducts, useCategory } from '@/hooks/use-products';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import api from '@/lib/api';

interface Section {
    id: number;
    title: string;
    content: string;
    status: string;
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [page, setPage] = useState(1);
    const [bannerSection, setBannerSection] = useState<Section | null>(null);

    // Fetch Category Details
    const { category, isLoading: isCategoryLoading, isError: isCategoryError } = useCategory(slug);

    // Fetch Products for this category (using slug)
    const { products, pagination, isLoading: isProductsLoading, isError: isProductsError } = useProducts(page, 12, { category_slug: slug });

    const totalPages = pagination?.totalPage || 1;

    // Fetch linked section for banner
    useEffect(() => {
        if (category?.section_id) {
            api.get(`/sections/${category.section_id}`)
                .then(res => setBannerSection(res.data.data))
                .catch(() => setBannerSection(null));
        } else {
            setBannerSection(null);
        }
    }, [category?.section_id]);

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
        <div className="container px-4 py-8 mx-auto">
            {/* Banner from linked section */}
            {bannerSection?.content && (
                <div
                    className="w-full mb-8 rounded-2xl overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: bannerSection.content }}
                />
            )}

            <div className="mb-10 text-center max-w-3xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 capitalize">{category.name}</h1>
                <p className="text-muted-foreground text-lg">
                    {category.description || `Explore our collection of ${category.name}.`}
                </p>
            </div>

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
                    <p className="text-muted-foreground">Check back later for new additions to {category.name}.</p>
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
                                    )
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
    );
}
