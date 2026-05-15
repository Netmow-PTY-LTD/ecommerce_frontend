"use client";

import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Loader2, LayoutGrid } from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';

interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
}

const containerVariants: Variants = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.08 }
    }
};

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: 'easeOut' as const }
    }
};

export function PopularCategories() {
    const { data: categoriesData, isLoading } = useSWR(
        '/ecommerce/categories?limit=10',
        fetcher
    );

    const categories: Category[] = categoriesData?.data || [];

    return (
        <section className="py-8 md:py-16 bg-white">
            <div className="container">

                {/* Header */}
                <div className="relative flex flex-col items-center text-center mb-10">

                    {/* Subtitle */}
                    <p className="text-[#ff4d4d] text-[11px] font-black uppercase tracking-[0.25em] mb-3">
                        Customer Favorites
                    </p>

                    {/* Main Heading */}
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                        Popular Categories
                    </h2>
                </div>

                {/* Loading */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-52">
                        <Loader2 className="h-9 w-9 animate-spin text-[#ff4d4d]" />
                    </div>
                ) : categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-52 gap-4 text-center">
                        <LayoutGrid className="h-14 w-14 text-slate-200" />
                        <p className="text-slate-400 font-medium text-sm">No categories found.</p>
                    </div>
                ) : (
                    <>
                        {/* "All Categories" link — top right */}
                        <div className='flex md:justify-end mb-4'>
                            <Link
                                href="/categories"
                                className="flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#ff4d4d] transition-colors group"
                            >
                                All Categories
                                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: '-40px' }}
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5"
                        >
                            {categories.slice(0, 10).map((category) => (
                                <motion.div key={category.id} variants={cardVariants}>
                                    <Link
                                        href={`/shop?category_id=${category.id}`}
                                        className="group flex flex-col items-center bg-white border border-slate-100 rounded-2xl p-10 shadow-xl hover:shadow-md hover:border-slate-200 transition-all duration-300"
                                    >
                                        {/* Circular Image Container */}
                                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-[#f5f0e8] flex items-center justify-center overflow-hidden mb-4 group-hover:scale-105 transition-transform duration-300 flex-shrink-0 p-2">
                                            {category.image_url ? (
                                                <Image
                                                    src={category.image_url}
                                                    alt={category.name}
                                                    width={112}
                                                    height={112}
                                                    className="object-contain w-[80%] h-[80%]"
                                                    unoptimized
                                                />
                                            ) : (
                                                <span className="text-4xl select-none">
                                                    {getCategoryEmoji(category.name)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Category Name */}
                                        <h3 className="text-base md:text-lg font-bold text-slate-800 group-hover:text-[#ff4d4d] transition-colors duration-200 text-center leading-snug">
                                            {category.name}
                                        </h3>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    </>
                )}

            </div>
        </section>
    );
}

function getCategoryEmoji(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('book')) return '📚';
    if (n.includes('cloth') || n.includes('fashion') || n.includes('wear')) return '👗';
    if (n.includes('electron') || n.includes('tech')) return '🖥️';
    if (n.includes('living') || n.includes('home') || n.includes('furniture')) return '🛋️';
    if (n.includes('accessor')) return '👜';
    if (n.includes('phone') || n.includes('mobile')) return '📱';
    if (n.includes('audio') || n.includes('headphone') || n.includes('speaker')) return '🎧';
    if (n.includes('camera') || n.includes('photo')) return '📷';
    if (n.includes('laptop') || n.includes('computer')) return '💻';
    if (n.includes('watch') || n.includes('clock')) return '⌚';
    if (n.includes('kitchen') || n.includes('cook')) return '🍳';
    if (n.includes('sport') || n.includes('fitness') || n.includes('gym')) return '🏋️';
    if (n.includes('game') || n.includes('toy')) return '🎮';
    if (n.includes('beauty') || n.includes('cosmetic') || n.includes('skin')) return '💄';
    if (n.includes('food') || n.includes('drink') || n.includes('grocery')) return '🛒';
    if (n.includes('jewel')) return '💎';
    if (n.includes('shoe') || n.includes('footwear')) return '👟';
    if (n.includes('bag') || n.includes('backpack')) return '🎒';
    if (n.includes('travel') || n.includes('luggage')) return '✈️';
    return '🛍️';
}
