"use client";

import { use, useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { useProduct } from '@/hooks/use-products';
import { useProductFlashSalePrice } from '@/hooks/use-pricing';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/lib/store';
import {
    ShoppingCart, Heart, Minus, Plus, Loader2,
    Truck, ShieldCheck, Star, MessageSquare, Package,
    Gift, Zap, ChevronRight, ChevronLeft,
    CircleMinus, CirclePlus, LogIn
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';
import { useProductReviews, useReviewSummary, createReview } from '@/hooks/use-reviews';
import { StarRating } from '@/components/reviews/star-rating';
import { ReviewSummary } from '@/components/reviews/review-summary';
import { ReviewForm } from '@/components/reviews/review-form';
import api, { fetcher } from '@/lib/api';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { ProductCard } from '@/components/product-card';

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const { product: initialProduct, isLoading, isError } = useProduct(slug);
    const addItem = useCartStore((state) => state.addItem);
    const { isAuthenticated: isCustomerAuthenticated } = useCustomerAuth();
    const { formatCurrency } = useCurrency();

    // ── UI States ─────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<'description' | 'info' | 'reviews'>('description');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [viewedProduct, setViewedProduct] = useState<any>(null);

    // Sync viewedProduct with initialProduct
    useEffect(() => {
        if (initialProduct) setViewedProduct(initialProduct);
    }, [initialProduct]);

    const product = viewedProduct || initialProduct;

    // ── Fetch Data ───────────────────────────────────────────────────────────
    const productId = product?.id;
    const { summary } = useReviewSummary(productId || 0);
    const { reviews, isLoading: reviewsLoading, mutate: mutateReviews } = useProductReviews(productId || 0, 1, 'newest');
    const { flashSalePrice } = useProductFlashSalePrice(productId);

    // Popular Products Logic
    const { data: popularData, isLoading: popularLoading } = useSWR(
        initialProduct?.id ? `/ecommerce/products?limit=12&sort=newest` : null,
        fetcher
    );
    const popularProducts = popularData?.data?.slice(0, 8) || [];

    // Price Logic
    const bestPrice = flashSalePrice && flashSalePrice < (product?.sale_price || product?.price || 0)
        ? flashSalePrice
        : (product?.sale_price && product.sale_price < product.price ? product.sale_price : product?.price || 0);
    const originalPrice = product?.price || 0;
    const hasDiscount = bestPrice < originalPrice;

    // Attribute Setup
    useEffect(() => {
        if (product?.attributes && Array.isArray(product.attributes)) {
            const selections: Record<string, string> = {};
            product.attributes.forEach((attr: any) => {
                if (attr.values?.length > 0) selections[attr.name] = attr.values[0];
            });
            setSelectedAttributes(selections);
        }
    }, [product?.id]);

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
        );
    }

    if (isError || !initialProduct) {
        return (
            <div className="container py-20 text-center">
                <h2 className="text-2xl font-bold mb-4 text-slate-900">Product not found</h2>
                <Link href="/shop">
                    <Button className="bg-brand">Back to Shop</Button>
                </Link>
            </div>
        );
    }

    const handleAddToCart = () => {
        addItem({ ...product, price: bestPrice }, quantity, selectedAttributes);
        toast.success('Added to cart!');
    };

    const currentImage = selectedImage || product?.image_url || '/placeholder.png';

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="bg-white min-h-screen font-sans">
            {/* ── Compact Red Banner ── */}
            <section className='py-3 bg-brand shadow-sm'>
                <div className="container px-4 mx-auto">
                    <div className="flex items-center justify-between">
                        <h1 className="text-white font-bold text-sm tracking-tight">Product Details</h1>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/80">
                            <Link href="/" className="hover:text-white transition-colors">Home</Link>
                            <ChevronRight className="h-3 w-3 opacity-50" />
                            <span className="text-white">Shop</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-6 md:py-8">
                <div className="container mx-auto px-4">
                    {/* Grid Layout adjusted for smaller image section (roughly 35/65 split) */}
                    <div className="grid grid-cols-1 lg:grid-cols-[0.4fr_0.6fr] items-start">
                        {/* ── LEFT: Product Slider (Compact) ── */}
                        <div className="space-y-4 w-full">
                            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-sm max-w-[500px] mx-auto lg:mx-0">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentImage}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="w-full h-full"
                                    >
                                        <Image
                                            src={currentImage}
                                            alt={product?.name || ""}
                                            fill
                                            className="object-contain p-6"
                                            priority
                                        />
                                    </motion.div>
                                </AnimatePresence>

                                {hasDiscount && (
                                    <div className="absolute top-4 left-4 bg-brand text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
                                        -{Math.round(((originalPrice - bestPrice) / originalPrice) * 100)}% OFF
                                    </div>
                                )}
                            </div>

                            {/* Slider Nav: Another List of Products */}
                            <div className="space-y-3 max-w-[400px] mx-auto lg:mx-0">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discover more:</p>
                                <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-hide">
                                    {popularProducts.map((p: any) => (
                                        <button
                                            key={p.id}
                                            onClick={() => { setViewedProduct(p); setSelectedImage(null); }}
                                            className={cn(
                                                "relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border transition-all p-1.5 bg-gray-50 group",
                                                product?.id === p.id
                                                    ? "border-brand ring-2 ring-brand/10 shadow-sm"
                                                    : "border-gray-100 hover:border-gray-300"
                                            )}
                                        >
                                            <Image src={p.image_url || '/placeholder.png'} alt="" fill className="object-contain p-1 group-hover:scale-110 transition-transform" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT: Product Info ── */}
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                                    {product?.name}
                                </h2>

                                <div className="flex items-center gap-3">
                                    <div className="flex text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={cn("w-3 h-3 fill-current", i < (summary?.average_rating || 4) ? "" : "text-gray-200")} />
                                        ))}
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        ({summary?.total || 0} Reviews)
                                    </span>
                                </div>
                            </div>

                            {/* ── Price Section ── */}
                            <div className="flex items-baseline gap-3">
                                <span className="text-2xl font-black text-brand tracking-tighter">
                                    {formatCurrency(bestPrice)}
                                </span>
                                {hasDiscount && (
                                    <span className="text-base text-slate-300 line-through font-bold">
                                        {formatCurrency(originalPrice)}
                                    </span>
                                )}
                            </div>

                            <p className="text-slate-500 text-[11px] leading-relaxed max-w-lg">
                                {product?.description ? product.description?.slice(0, 200) + "..." : "No description available."}
                            </p>

                            {/* ── Info Table (Compact) ── */}
                            <div className="grid grid-cols-1 gap-1.5 text-[11px] border-t border-b border-gray-100 py-4">
                                {[
                                    { label: 'Brand', value: (product as any).brand || 'ESTA BETTERU CO' },
                                    { label: 'Diet Type', value: product?.category?.name || 'Vegetarian' },
                                    { label: 'Weight', value: (product as any).weight || '200 Grams' },
                                    { label: 'SKU', value: product?.sku || 'N/A' },
                                    { label: 'Availability', value: (product?.stock_quantity || 0) > 0 ? 'In Stock' : 'Out of Stock' }
                                ].map((row, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <span className="w-20 font-bold text-slate-900">{row.label}</span>
                                        <span className={cn(
                                            "font-medium",
                                            row.label === 'Availability'
                                                ? ((product?.stock_quantity || 0) > 0 ? 'text-green-600' : 'text-red-600')
                                                : 'text-slate-500'
                                        )}>: {row.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* ── Attributes ── */}
                            {product?.attributes && Array.isArray(product.attributes) && product.attributes.length > 0 && (
                                <div className="space-y-3">
                                    {product.attributes.map((attr: any, idx: number) => (
                                        <div key={idx} className="space-y-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                {attr.name} :
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {attr.values?.map((value: string, vIdx: number) => (
                                                    <button
                                                        key={vIdx}
                                                        onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.name]: value }))}
                                                        className={cn(
                                                            "px-3 py-1 text-[10px] font-bold rounded border transition-all active:scale-95",
                                                            selectedAttributes[attr.name] === value
                                                                ? "bg-brand border-brand text-white shadow shadow-brand/10"
                                                                : "bg-white border-gray-100 text-slate-500 hover:border-gray-200"
                                                        )}
                                                    >
                                                        {value}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── Action Bar (Compact) ── */}
                            <div className="flex items-center gap-2 pt-2">
                                <div className="flex items-center bg-gray-50 rounded border border-gray-100 h-9 overflow-hidden">
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="px-2 hover:bg-gray-100 text-slate-600"
                                    >
                                        <CircleMinus className="h-3 w-3" />
                                    </button>
                                    <span className="w-7 text-center font-bold text-xs text-slate-900">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(q => Math.min(product?.stock_quantity || 99, q + 1))}
                                        className="px-2 hover:bg-gray-100 text-slate-600 border-l border-gray-100"
                                    >
                                        <CirclePlus className="h-3 w-3" />
                                    </button>
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    disabled={!product?.stock_quantity}
                                    className="py-2 px-4 h-9 bg-brand text-white font-bold text-[10px] rounded shadow shadow-brand/10 hover:bg-brand/90 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                                >
                                    <ShoppingCart className="h-3.5 w-3.5" />
                                    {product?.stock_quantity ? "ADD TO CART" : "OUT OF STOCK"}
                                </button>

                                <button className="w-9 h-9 flex items-center justify-center bg-white border border-gray-100 rounded text-slate-400 hover:text-brand hover:border-brand/20 transition-all active:scale-90 cursor-pointer">
                                    <Heart className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Tabbed Content ── */}
                    <div className="mt-12 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <div className="flex border-b border-gray-100 px-6 pt-4 gap-6">
                            {['description', 'info', 'reviews'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={cn(
                                        "pb-3 text-[10px] font-black uppercase tracking-widest transition-all relative",
                                        activeTab === tab ? "text-brand" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <motion.div layoutId="tab-u" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="p-5 md:p-8">
                            {activeTab === 'description' && (
                                <div className="prose prose-slate max-w-none text-[11px] text-slate-500 leading-relaxed">
                                    {product?.description || "No detailed description available."}
                                    <div className="mt-6 border-t border-gray-50 pt-4">
                                        <h4 className="font-bold text-slate-900 mb-1 text-[11px]">Packaging & Delivery</h4>
                                        <p>Global shipping available. Standard delivery 3-5 business days. Eco-friendly packaging used.</p>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'info' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                                    {product?.specification?.split('\n').map((line: string, i: number) => (
                                        <div key={i} className="flex justify-between py-1.5 border-b border-gray-50">
                                            <span className="font-bold text-slate-400 uppercase tracking-widest">{line.split(':')[0]}</span>
                                            <span className="text-slate-700 font-medium">{line.split(':')[1] || '-'}</span>
                                        </div>
                                    )) || <p className="text-slate-400 italic">No specific data available.</p>}
                                </div>
                            )}
                            {activeTab === 'reviews' && (
                                <div className="space-y-10">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                        {/* Summary Section */}
                                        <div className="lg:col-span-4">
                                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                                <h3 className="font-black text-slate-900 mb-4 uppercase tracking-widest text-[10px]">Customer Ratings</h3>
                                                {summary ? <ReviewSummary summary={summary} /> : <p className="text-slate-400 text-xs italic">No ratings yet.</p>}
                                            </div>
                                        </div>

                                        {/* Reviews List & Form */}
                                        <div className="lg:col-span-8 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Recent Reviews</h3>
                                                {isCustomerAuthenticated ? (
                                                    <Button variant="outline" size="sm" onClick={() => setShowReviewForm(!showReviewForm)} className="h-8 text-[10px] font-bold rounded-lg px-4 border-brand text-brand hover:bg-brand hover:text-white transition-all">
                                                        {showReviewForm ? 'Cancel' : 'Write Review'}
                                                    </Button>
                                                ) : (
                                                    <Link href="/login">
                                                        <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold rounded-lg px-4 flex items-center gap-2 border-brand text-brand hover:bg-brand hover:text-white transition-all">
                                                            <LogIn className="h-3 w-3" />
                                                            Login To Review
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>

                                            {showReviewForm && (
                                                <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6 shadow-sm">
                                                    <ReviewForm productId={productId!} onSubmit={async (data) => {
                                                        try { await createReview(data); toast.success('Submitted!'); setShowReviewForm(false); mutateReviews(); }
                                                        catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
                                                    }} />
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                {reviewsLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto text-brand" /> :
                                                    reviews.length === 0 ? (
                                                        <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                                            <MessageSquare className="h-8 w-8 text-gray-200 mx-auto mb-3" />
                                                            <p className="text-slate-600 text-xs font-bold mb-1">No reviews yet for this product.</p>
                                                            <p className="text-slate-400 text-[10px] font-medium tracking-wide">Be the first to share your experience!</p>
                                                        </div>
                                                    ) :
                                                        reviews.map((r: any) => (
                                                            <div key={r.id} className="p-5 bg-gray-50/30 rounded-xl border border-gray-50 space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <StarRating rating={r.rating} size={12} />
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(r.created_at).toLocaleDateString()}</span>
                                                                </div>
                                                                <p className="text-xs text-slate-600 leading-relaxed font-medium">{r.body}</p>
                                                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">— {r.user_name || 'Verified Buyer'}</p>
                                                            </div>
                                                        ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Popular Products Section ── */}
                    <div className="mt-16 space-y-6">
                        <div className="text-center space-y-1">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Handpicked Collection</h2>
                            <p className="text-slate-400 text-[10px] font-medium tracking-wide">Explore our most loved products this season</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {popularLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="bg-gray-50 aspect-[3/4] rounded-xl animate-pulse" />
                                ))
                            ) : (
                                popularProducts.map((p: any) => (
                                    <ProductCard
                                        key={p.id}
                                        product={p}
                                        showNewBadge={true}
                                        discountPercentage={p.sale_price ? Math.round((1 - p.sale_price / p.price) * 100) : 0}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
}
