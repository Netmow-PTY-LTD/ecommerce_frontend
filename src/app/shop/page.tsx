"use client";

import { useProducts, useCategories } from '@/hooks/use-products';
import { ProductCard } from '@/components/product-card';
import { ChevronLeft, ChevronRight, LayoutGrid, List, ChevronDown, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import Link from 'next/link';
import api from '@/lib/api';

// ─── Wrapper (needed for useSearchParams) ───────────────────────────────────
export default function ShopPageWrapper() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand" />
            </div>
        }>
            <ShopPage />
        </Suspense>
    );
}

// ─── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
    { value: 'newest',     label: 'Newest First'       },
    { value: 'price_asc',  label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'name_asc',   label: 'Name: A to Z'       },
    { value: 'name_desc',  label: 'Name: Z to A'       },
];

// ─── Main page ────────────────────────────────────────────────────────────────
function ShopPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { formatCurrency, currencySymbol } = useCurrency();

    // ── UI States ─────────────────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [bogoIds, setBogoIds] = useState<Set<number>>(new Set());
    const [maxProductPrice, setMaxProductPrice] = useState(1000);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [dragging, setDragging] = useState<'min' | 'max' | null>(null);

    // ── URL-driven state ──────────────────────────────────────────────────────
    const page = parseInt(searchParams.get('page') || '1');
    const categoryId = searchParams.get('category_id')
        ? parseInt(searchParams.get('category_id')!)
        : undefined;
    const sortBy = searchParams.get('sort') || 'newest';
    const inStock = searchParams.get('in_stock') === 'true';

    const PRICE_SLIDER_MIN = 0;
    const minPriceUrl = searchParams.get('min_price') ? parseInt(searchParams.get('min_price')!) : PRICE_SLIDER_MIN;
    const maxPriceUrl = searchParams.get('max_price') ? parseInt(searchParams.get('max_price')!) : maxProductPrice;

    const [priceMin, setPriceMin] = useState(minPriceUrl);
    const [priceMax, setPriceMax] = useState(maxPriceUrl);

    // ── Fetch data ─────────────────────────────────────────────────────────────
    const { products, pagination, isLoading } = useProducts(page, 12, {
        category_id: categoryId,
        sort: sortBy,
        in_stock: inStock,
        min_price: minPriceUrl,
        max_price: maxPriceUrl,
    });

    const { categories } = useCategories(1, 50);

    // Fetch Max Price and BOGO deals on mount
    useEffect(() => {
        api.get('/pricing/public/bogo-deals').then(res => {
            const deals = res.data?.data || [];
            const ids = new Set<number>();
            deals.forEach((d: any) =>
                (d.product_ids || []).forEach((id: number) => ids.add(id))
            );
            setBogoIds(ids);
        }).catch(() => { });

        api.get('/ecommerce/products?sort=price_desc&limit=1').then(res => {
            const topProduct = res.data?.data?.[0];
            if (topProduct?.price) {
                const roundedMax = Math.ceil(topProduct.price / 100) * 100;
                setMaxProductPrice(roundedMax);
                if (!searchParams.get('max_price')) {
                    setPriceMax(roundedMax);
                }
            }
        }).catch(() => { });
    }, []);

    // Sync local price state if URL changes
    useEffect(() => {
        setPriceMin(minPriceUrl);
        setPriceMax(maxPriceUrl);
    }, [minPriceUrl, maxPriceUrl]);

    const totalPages = pagination?.totalPage || 1;
    const totalProducts = pagination?.total || 0;

    // ── URL helpers ────────────────────────────────────────────────────────────
    const pushParam = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(key, value); else params.delete(key);
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
        if (window.innerWidth < 1024) setIsSidebarOpen(false); // Close sidebar on mobile after filter
    };

    const handlePage = (p: number) => {
        if (p < 1 || p > totalPages) return;
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', p.toString());
        router.push(`${pathname}?${params.toString()}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePriceFilter = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('min_price', priceMin.toString());
        params.set('max_price', priceMax.toString());
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
    };

    const pctMin = ((priceMin - PRICE_SLIDER_MIN) / (maxProductPrice - PRICE_SLIDER_MIN)) * 100;
    const pctMax = ((priceMax - PRICE_SLIDER_MIN) / (maxProductPrice - PRICE_SLIDER_MIN)) * 100;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="relative">
            {/* ── Red Banner ────────────────────────────────────────────────── */}
            <section className='py-3 bg-brand'>
                <div className="container px-4 mx-auto">
                    <div className="w-full flex items-center justify-between">
                        <h1 className="text-white font-bold text-sm md:text-base tracking-wide">All Products</h1>
                        <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
                            <Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
                            <span className="text-white/50">-</span>
                            <span className="text-white">Shop</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Page Body ─────────────────────────────────────────────────── */}
            <div className="bg-gray-50 min-h-screen py-6 md:py-10">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

                        {/* ════════════════ SIDEBAR (Mobile Overlay + Desktop Sidebar) ════════════════ */}
                        {/* Overlay for mobile */}
                        {isSidebarOpen && (
                            <div 
                                className="fixed inset-0 bg-black/50 z-[999] lg:hidden animate-in fade-in duration-300"
                                onClick={() => setIsSidebarOpen(false)}
                            />
                        )}

                        <aside className={cn(
                            "fixed lg:relative inset-y-0 left-0 w-[280px] md:w-[320px] lg:w-72 bg-white lg:bg-transparent z-[1000] lg:z-0 p-5 lg:p-0 transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto",
                            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                        )}>
                            <div className="flex items-center justify-between lg:hidden mb-6">
                                <h2 className="font-bold text-lg text-gray-900">Filters</h2>
                                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="h-6 w-6 text-gray-500" />
                                </button>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xl lg:shadow-sm">
                                {/* ── Category ─────────────────────────────── */}
                                <h3 className="font-bold text-sm text-gray-800 mb-5 flex items-center gap-2">
                                    <span className="w-1.5 h-4 bg-brand rounded-full" />
                                    Product Category
                                </h3>
                                <ul className="space-y-4 mb-8">
                                    <li>
                                        <label className="flex items-center justify-between cursor-pointer group">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={!categoryId}
                                                    onChange={() => pushParam('category_id', null)}
                                                    className="w-4.5 h-4.5 accent-brand rounded border-gray-300 transition-transform active:scale-90"
                                                />
                                                <span className={cn(
                                                    "text-sm transition-colors",
                                                    !categoryId ? 'text-brand font-bold' : 'text-gray-600 group-hover:text-brand'
                                                )}>
                                                    All Products
                                                </span>
                                            </div>
                                        </label>
                                    </li>
                                    {categories.slice(0, 15).map(cat => (
                                        <li key={cat.id}>
                                            <label className="flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={categoryId === cat.id}
                                                        onChange={() =>
                                                            pushParam('category_id',
                                                                categoryId === cat.id ? null : cat.id.toString()
                                                            )
                                                        }
                                                        className="w-4.5 h-4.5 accent-brand rounded border-gray-300 transition-transform active:scale-90"
                                                    />
                                                    <span className={cn(
                                                        "text-sm transition-colors",
                                                        categoryId === cat.id
                                                            ? 'text-brand font-bold'
                                                            : 'text-gray-600 group-hover:text-brand'
                                                    )}>
                                                        {cat.name}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-gray-500 font-bold bg-gray-50 rounded-full px-2.5 py-1 border border-gray-100">
                                                    {(cat as any).product_count || (cat as any).products_count || 0}
                                                </span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>

                                {/* ── Divider ──────────────────────────────── */}
                                <hr className="border-gray-100 mb-8" />

                                {/* ── Filter By Price ──────────────────────── */}
                                <h3 className="font-bold text-sm text-gray-800 mb-5 flex items-center gap-2">
                                    <span className="w-1.5 h-4 bg-brand rounded-full" />
                                    Filter By Price
                                </h3>

                                <div className="px-1">
                                    <div className="relative h-2 mb-6">
                                        <div className="absolute inset-0 bg-gray-100 rounded-full" />
                                        <div
                                            className="absolute h-full bg-brand rounded-full"
                                            style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }}
                                        />
                                        <input
                                            type="range"
                                            min={PRICE_SLIDER_MIN}
                                            max={maxProductPrice}
                                            value={priceMin}
                                            onMouseDown={() => setDragging('min')}
                                            onMouseUp={() => setDragging(null)}
                                            onChange={e =>
                                                setPriceMin(Math.min(Number(e.target.value), priceMax - 10))
                                            }
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[4]"
                                        />
                                        <input
                                            type="range"
                                            min={PRICE_SLIDER_MIN}
                                            max={maxProductPrice}
                                            value={priceMax}
                                            onMouseDown={() => setDragging('max')}
                                            onMouseUp={() => setDragging(null)}
                                            onChange={e =>
                                                setPriceMax(Math.max(Number(e.target.value), priceMin + 10))
                                            }
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[4]"
                                        />
                                        <div
                                            className="absolute w-5 h-5 bg-brand rounded-full border-2 border-white shadow-lg top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-[5]"
                                            style={{ left: `${pctMin}%` }}
                                        />
                                        <div
                                            className="absolute w-5 h-5 bg-brand rounded-full border-2 border-white shadow-lg top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-[5]"
                                            style={{ left: `${pctMax}%` }}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-4 mb-8">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Min Price</span>
                                                <span className="text-sm font-bold text-gray-900">{currencySymbol}{priceMin}</span>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Max Price</span>
                                                <span className="text-sm font-bold text-gray-900">{currencySymbol}{priceMax}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handlePriceFilter}
                                            className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl hover:bg-brand transition-all shadow-md active:scale-[0.98]"
                                        >
                                            Apply Filter
                                        </button>
                                    </div>
                                </div>

                                {/* ── Divider ──────────────────────────────── */}
                                <hr className="border-gray-100 mb-8" />

                                {/* ── Stock Filter ─────────────────────────── */}
                                <h3 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-4 bg-brand rounded-full" />
                                    Availability
                                </h3>
                                <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-gray-50 rounded-xl transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={inStock}
                                        onChange={() => pushParam('in_stock', !inStock ? 'true' : null)}
                                        className="w-4.5 h-4.5 accent-brand rounded border-gray-300 transition-transform active:scale-90"
                                    />
                                    <span className={cn(
                                        "text-sm transition-colors",
                                        inStock ? 'text-brand font-bold' : 'text-gray-600 group-hover:text-brand'
                                    )}>
                                        In Stock Only
                                    </span>
                                </label>
                            </div>
                        </aside>

                        {/* ════════════════ MAIN CONTENT ════════════════ */}
                        <div className="flex-1 min-w-0">

                            {/* ── Toolbar ───────────────────────────────────── */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 md:mb-8">
                                
                                {/* Mobile Filter Toggle + Results Count */}
                                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                                    <button 
                                        onClick={() => setIsSidebarOpen(true)}
                                        className="lg:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-all active:scale-95"
                                    >
                                        <Filter className="h-4 w-4" />
                                        Filters
                                    </button>

                                    <p className="text-xs text-gray-500 font-bold tracking-tight uppercase">
                                        {isLoading
                                            ? 'Fetching...'
                                            : `${totalProducts} item${totalProducts !== 1 ? 's' : ''}`}
                                    </p>

                                    {/* View toggle (desktop/tablet) */}
                                    <div className="hidden sm:flex items-center gap-2 ml-4">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={cn(
                                                "p-2 rounded-lg transition-all",
                                                viewMode === 'grid'
                                                    ? 'text-white bg-brand shadow-md scale-110'
                                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                            )}
                                        >
                                            <LayoutGrid className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={cn(
                                                "p-2 rounded-lg transition-all",
                                                viewMode === 'list'
                                                    ? 'text-white bg-brand shadow-md scale-110'
                                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                            )}
                                        >
                                            <List className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Sort */}
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em] whitespace-nowrap">Sort By:</span>
                                    <div className="relative flex-1 sm:flex-none min-w-[160px]">
                                        <select
                                            value={sortBy}
                                            onChange={e => pushParam('sort', e.target.value)}
                                            className="w-full appearance-none text-xs font-bold text-gray-700 border border-gray-200 rounded-xl px-4 py-2.5 pr-10 bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand cursor-pointer shadow-sm transition-all"
                                        >
                                            {SORT_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* ── Product Grid ──────────────────────────────── */}
                            {isLoading ? (
                                <div className={cn(
                                    "grid gap-6 md:gap-8",
                                    viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                                )}>
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="bg-white rounded-3xl border border-gray-100 overflow-hidden animate-pulse">
                                            <div className="aspect-square bg-gray-50" />
                                            <div className="p-6 space-y-4">
                                                <div className="h-3 bg-gray-100 rounded-full w-1/4" />
                                                <div className="h-5 bg-gray-100 rounded-full w-full" />
                                                <div className="h-4 bg-gray-100 rounded-full w-1/3" />
                                                <div className="h-12 bg-gray-100 rounded-2xl mt-4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : products.length === 0 ? (
                                <div className="text-center py-20 md:py-32 bg-white rounded-3xl border border-gray-200 shadow-sm px-6">
                                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                                        <Filter className="h-10 w-10 text-gray-300" />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-3 tracking-tight">No products found</h3>
                                    <p className="text-gray-500 text-sm md:text-base max-w-md mx-auto">We couldn't find any items matching your current filters. Try broadening your search or resetting everything.</p>
                                    <button 
                                        onClick={() => router.push(pathname)}
                                        className="mt-10 px-8 py-3 bg-brand text-white font-bold rounded-2xl hover:bg-brand/90 transition-all shadow-xl shadow-brand/20 active:scale-95"
                                    >
                                        Reset All Filters
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className={cn(
                                        "grid gap-6 md:gap-8",
                                        viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                                    )}>
                                        {products.map(product => (
                                            <ProductCard
                                                key={product.id}
                                                product={product}
                                                showNewBadge={true}
                                                discountPercentage={
                                                    product.sale_price && product.price > 0
                                                        ? Math.round((1 - product.sale_price / product.price) * 100)
                                                        : 0
                                                }
                                                bogoDeal={bogoIds.has(product.id)}
                                            />
                                        ))}
                                    </div>

                                    {/* ── Pagination ────────────────────────── */}
                                    {totalPages > 1 && (
                                        <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3 mt-16 md:mt-24">
                                            <button
                                                onClick={() => handlePage(page - 1)}
                                                disabled={page === 1}
                                                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl border border-gray-200 text-gray-500 hover:border-brand hover:text-brand disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white shadow-sm hover:shadow-md"
                                            >
                                                <ChevronLeft className="h-5 w-5" />
                                            </button>

                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                                    let p = i + 1;
                                                    if (totalPages > 5 && page > 3) p = page - 2 + i;
                                                    if (p > totalPages) return null;
                                                    return (
                                                        <button
                                                            key={p}
                                                            onClick={() => handlePage(p)}
                                                            className={cn(
                                                                "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl text-sm font-bold transition-all border shadow-sm",
                                                                page === p
                                                                    ? 'bg-brand text-white border-brand scale-110 shadow-lg shadow-brand/20'
                                                                    : 'border-gray-200 text-gray-600 hover:border-brand hover:text-brand bg-white'
                                                            )}
                                                        >
                                                            {p}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <button
                                                onClick={() => handlePage(page + 1)}
                                                disabled={page === totalPages}
                                                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl border border-gray-200 text-gray-500 hover:border-brand hover:text-brand disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white shadow-sm hover:shadow-md"
                                            >
                                                <ChevronRight className="h-5 w-5" />
                                            </button>
                                        </div>
                                    )}

                                    <p className="text-center text-[10px] text-gray-400 mt-10 font-black uppercase tracking-[0.2em]">
                                        Page {page} of {totalPages} — {totalProducts} items available
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
