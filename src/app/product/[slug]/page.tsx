"use client";

import { use, useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { useProduct } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/lib/store';
import { ShoppingCart, Heart, Minus, Plus, Loader2, ArrowLeft, Truck, ShieldCheck, Star, MessageSquare, Package, Gift } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';
import { useProductReviews, useReviewSummary, createReview } from '@/hooks/use-reviews';
import { StarRating } from '@/components/reviews/star-rating';
import { ReviewSummary } from '@/components/reviews/review-summary';
import { ReviewForm } from '@/components/reviews/review-form';
import api, { fetcher } from '@/lib/api';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const { product, isLoading, isError } = useProduct(slug);
    const addItem = useCartStore((state) => state.addItem);
    const { isAuthenticated: isCustomerAuthenticated } = useCustomerAuth();

    // Similar products from product's stored similar_products IDs
    const similarIds = product?.similar_products
        ? (Array.isArray(product.similar_products) ? product.similar_products : JSON.parse(product.similar_products || '[]'))
        : [];
    const { data: similarData, isLoading: similarLoading } = useSWR(
        similarIds.length > 0 ? `/ecommerce/products?limit=20` : null,
        fetcher
    );
    const similarProducts = similarData?.data?.filter((p: any) => similarIds.includes(p.id)) || [];

    // Reviews state (must be before hooks that use them)
    const [reviewSort, setReviewSort] = useState('newest');
    const [reviewPage, setReviewPage] = useState(1);
    const [showReviewForm, setShowReviewForm] = useState(false);

    const { formatCurrency } = useCurrency();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
    const [lastProductId, setLastProductId] = useState<number | null>(null);
    const [lastAttributesLength, setLastAttributesLength] = useState<number>(0);

    // Reviews data hooks
    const productId = product?.id;
    const { summary, isLoading: summaryLoading } = useReviewSummary(productId || 0);
    const { reviews, pagination: reviewPagination, isLoading: reviewsLoading, mutate: mutateReviews } = useProductReviews(productId || 0, reviewPage, reviewSort);

    // Check if product has BOGO deal
    const [isBogoDeal, setIsBogoDeal] = useState(false);
    const [bogoCouponCode, setBogoCouponCode] = useState('');
    useEffect(() => {
        if (!productId) return;
        api.get('/pricing/public/bogo-deals').then(res => {
            const deals = res.data?.data || [];
            for (const deal of deals) {
                if ((deal.product_ids || []).includes(productId)) {
                    setIsBogoDeal(true);
                    setBogoCouponCode(deal.coupon_code);
                    break;
                }
            }
        }).catch(() => { });
    }, [productId]);

    // Compute initial selections from product attributes
    const initialSelections = useMemo(() => {
        if (!product?.attributes) {
            return {};
        }

        // Ensure attributes is an array
        const attributesArray = Array.isArray(product.attributes) ? product.attributes : [];

        if (attributesArray.length === 0) {
            return {};
        }

        const selections: Record<string, string> = {};
        attributesArray.forEach((attr: any) => {
            if (attr.values && Array.isArray(attr.values) && attr.values.length > 0) {
                selections[attr.name] = attr.values[0];
            }
        });

        return selections;
    }, [product?.id, product?.attributes]);

    // Auto-select first value for each attribute when product changes
    useEffect(() => {
        const currentAttributesLength = Array.isArray(product?.attributes) ? product.attributes.length : 0;

        if (!product?.id) return;

        // Update if product ID changed OR if attributes were just loaded
        const productChanged = product.id !== lastProductId;
        const attributesJustLoaded = lastAttributesLength === 0 && currentAttributesLength > 0;

        if (productChanged || attributesJustLoaded) {
            setSelectedAttributes(initialSelections);
            setLastProductId(product.id);
            setLastAttributesLength(currentAttributesLength);
        }
    }, [product?.id, product?.attributes, initialSelections]); // Watch product ID and attributes

    if (isLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError || !product) {
        return (
            <div className="container py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">Product not found</h2>
                <div className="text-muted-foreground mb-6">
                    Could not find product with slug: <span className="font-mono">{slug}</span>
                </div>
                <Link href="/shop">
                    <Button>Back to Shop</Button>
                </Link>
            </div>
        );
    }

    const handleAddToCart = () => {
        addItem(product, quantity, selectedAttributes);
        toast.success('Added to cart!', {
            description: `${quantity} ${quantity > 1 ? 'items' : 'item'} added to your cart`
        });
    };

    const currentImage = selectedImage || product.image_url || '/placeholder.png';
    // Deduplicate images: combine image_url + gallery_items, remove nulls, make unique
    const uniqueImages = Array.from(new Set([product.image_url, ...(product.gallery_items || [])].filter(Boolean)));

    const incrementQuantity = () => {
        if (quantity < (product.stock_quantity || 1)) {
            setQuantity(prev => prev + 1);
        }
    };

    const decrementQuantity = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    return (
        <section className='py-20'>
            <div className="container mx-auto">
                <Link href="/shop" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shop
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Column 1: Images (5 col span) */}
                    <div className="lg:col-span-5 space-y-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative aspect-square bg-secondary/30 rounded-2xl overflow-hidden border border-border"
                        >
                            <Image
                                src={currentImage}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority
                            />
                        </motion.div>
                        {uniqueImages.length > 1 && (
                            <div className="grid grid-cols-4 gap-4">
                                {uniqueImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(img as string)}
                                        className={cn(
                                            "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                                            currentImage === img ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-70 hover:opacity-100"
                                        )}
                                    >
                                        <Image src={img as string} alt="" fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Column 2: Description & Details (4 col span) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{product.name}</h1>
                            <p className="text-sm text-muted-foreground mb-4">
                                SKU: {product.sku}
                            </p>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="px-2 py-1 bg-secondary rounded text-xs font-semibold">
                                    {product.category?.name || 'Uncategorized'}
                                </div>
                            </div>
                        </div>

                        <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none">
                            <h3 className="text-base font-semibold text-foreground">Overview</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {product.description || "No description available for this product."}
                            </p>
                        </div>

                        {/* Additional Details */}
                        {product.specification && (
                            <div className="pt-4 border-t border-border">
                                <h3 className="text-base font-semibold mb-2">Specifications</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-line">{product.specification}</p>
                            </div>
                        )}

                        {/* Product Attributes */}
                        {product.attributes && Array.isArray(product.attributes) && product.attributes.length > 0 && (
                            <div className="pt-4 border-t border-border">
                                <h3 className="text-base font-semibold mb-3">Product Attributes</h3>
                                <div className="space-y-3">
                                    {product.attributes.map((attr: any, idx: number) => (
                                        <div key={idx} className="bg-secondary/20 rounded-lg p-3">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                                {attr.name}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {attr.values && Array.isArray(attr.values) && attr.values.map((value: string, vIdx: number) => {
                                                    const isSelected = selectedAttributes[attr.name] === value;
                                                    return (
                                                        <button
                                                            key={vIdx}
                                                            onClick={() => {
                                                                setSelectedAttributes(prev => ({
                                                                    ...prev,
                                                                    [attr.name]: value
                                                                }));
                                                            }}
                                                            className={`text-sm px-4 py-2 rounded-md border transition-all ${isSelected
                                                                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                                                : 'bg-background border-border hover:border-primary/50 hover:bg-secondary/50'
                                                                }`}
                                                        >
                                                            {value}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Column 3: Cart / Purchase Card (3 col span) */}
                    <div className="lg:col-span-3">
                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm sticky top-24 space-y-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col">
                                        {product.sale_price && product.sale_price < product.price ? (
                                            <>
                                                <div className="text-3xl font-bold text-primary">{formatCurrency(product.sale_price)}</div>
                                                <div className="text-sm text-muted-foreground line-through">{formatCurrency(product.price)}</div>
                                            </>
                                        ) : (
                                            <div className="text-3xl font-bold text-primary">{formatCurrency(product.price)}</div>
                                        )}
                                    </div>
                                    {isBogoDeal && (
                                        <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                                            <Gift className="h-3.5 w-3.5" />
                                            Buy 1 Get 1 Free
                                        </span>
                                    )}
                                </div>
                                {isBogoDeal && bogoCouponCode && (
                                    <p className="text-xs text-orange-600 font-medium">
                                        Use code <span className="font-mono bg-orange-100 px-1.5 py-0.5 rounded">{bogoCouponCode}</span> at checkout
                                    </p>
                                )}
                                {(product.stock_quantity ?? 0) > 0 ? (
                                    <div className="text-sm text-green-600 font-medium flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-600" />
                                        In Stock
                                    </div>
                                ) : (
                                    <div className="text-sm text-red-600 font-medium flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-red-600" />
                                        Out of Stock
                                    </div>
                                )}
                            </div>

                            {/* Quantity Selector */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium">Quantity</span>
                                <div className="flex items-center border border-input rounded-md">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-none rounded-l-md"
                                        onClick={decrementQuantity}
                                        disabled={quantity <= 1}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <div className="w-10 text-center text-sm font-medium">{quantity}</div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-none rounded-r-md"
                                        onClick={incrementQuantity}
                                        disabled={quantity >= (product.stock_quantity ?? 0)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            <Button
                                className="w-full h-12 text-base font-semibold"
                                size="lg"
                                onClick={handleAddToCart}
                                disabled={!product.stock_quantity || product.stock_quantity === 0}
                            >
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                Add to Cart
                            </Button>

                            <div className="space-y-3 pt-4 border-t border-border">
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Truck className="w-4 h-4 text-primary" />
                                    <span>Free shipping over {formatCurrency(100)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <ShieldCheck className="w-4 h-4 text-primary" />
                                    <span>2 year warranty</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                {productId && (
                    <div className="mt-16 border-t border-border pt-10">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold">Customer Reviews</h2>
                            {isCustomerAuthenticated ? (
                                <Button
                                    variant={showReviewForm ? "outline" : "default"}
                                    onClick={() => setShowReviewForm(!showReviewForm)}
                                >
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    {showReviewForm ? 'Cancel' : 'Write a Review'}
                                </Button>
                            ) : (
                                <Link href="/login">
                                    <Button variant="outline">
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Login to Review
                                    </Button>
                                </Link>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Review Summary - Left Side */}
                            <div className="lg:col-span-4">
                                <div className="bg-card border border-border rounded-xl p-6">
                                    <h3 className="font-semibold mb-4">Rating Overview</h3>
                                    {summaryLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : summary ? (
                                        <ReviewSummary summary={summary} />
                                    ) : (
                                        <p className="text-muted-foreground text-sm">No reviews yet. Be the first to review!</p>
                                    )}
                                </div>
                            </div>

                            {/* Review Form + List - Right Side */}
                            <div className="lg:col-span-8 space-y-6">
                                {/* Review Form */}
                                {showReviewForm && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-card border border-border rounded-xl p-6"
                                    >
                                        <h3 className="font-semibold mb-4">Write Your Review</h3>
                                        <ReviewForm
                                            productId={productId}
                                            onSubmit={async (data) => {
                                                try {
                                                    await createReview(data);
                                                    toast.success('Review submitted! It will appear after approval.');
                                                    setShowReviewForm(false);
                                                    mutateReviews();
                                                } catch (err: any) {
                                                    toast.error(err.response?.data?.message || 'Failed to submit review');
                                                }
                                            }}
                                        />
                                    </motion.div>
                                )}

                                {/* Sort Controls */}
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        {summary?.total || 0} review{(summary?.total || 0) !== 1 ? 's' : ''}
                                    </p>
                                    <select
                                        value={reviewSort}
                                        onChange={(e) => { setReviewSort(e.target.value); setReviewPage(1); }}
                                        className="text-sm border border-border rounded-md px-3 py-1.5 bg-background"
                                    >
                                        <option value="newest">Newest</option>
                                        <option value="highest">Highest Rated</option>
                                        <option value="lowest">Lowest Rated</option>
                                        <option value="helpful">Most Helpful</option>
                                    </select>
                                </div>

                                {/* Review List */}
                                {reviewsLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                                        <p className="text-muted-foreground">No reviews yet for this product.</p>
                                        <p className="text-sm text-muted-foreground mt-1">Be the first to share your experience!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {reviews.map((review: any) => (
                                            <div key={review.id} className="bg-card border border-border rounded-xl p-5">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <StarRating rating={review.rating} size={16} />
                                                            {review.is_verified_purchase && (
                                                                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                                                                    Verified Purchase
                                                                </span>
                                                            )}
                                                        </div>
                                                        {review.title && (
                                                            <h4 className="font-semibold text-sm">{review.title}</h4>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {review.body && (
                                                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.body}</p>
                                                )}
                                                {review.images && (Array.isArray(review.images) ? review.images : JSON.parse(review.images || '[]')).length > 0 && (
                                                    <div className="flex gap-2 mt-3">
                                                        {(Array.isArray(review.images) ? review.images : JSON.parse(review.images || '[]')).map((img: string, idx: number) => (
                                                            <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border border-border">
                                                                <Image src={img} alt="" fill className="object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {review.admin_reply && (
                                                    <div className="mt-3 bg-secondary/30 rounded-lg p-3">
                                                        <p className="text-xs font-medium text-muted-foreground mb-1">Store Response</p>
                                                        <p className="text-sm">{review.admin_reply}</p>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                                                    <span className="text-xs text-muted-foreground">{review.helpful_count || 0} found this helpful</span>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Pagination */}
                                        {reviewPagination && reviewPagination.totalPage > 1 && (
                                            <div className="flex items-center justify-center gap-2 pt-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={reviewPage <= 1}
                                                    onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                                                >
                                                    Previous
                                                </Button>
                                                <span className="text-sm text-muted-foreground">
                                                    Page {reviewPage} of {reviewPagination.totalPage}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={reviewPage >= reviewPagination.totalPage}
                                                    onClick={() => setReviewPage(p => p + 1)}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Similar Products */}
                {similarIds.length > 0 && !similarLoading && similarProducts.length > 0 && (
                    <div className="mt-16 border-t border-border pt-10">
                        <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {similarProducts.map((p: any) => (
                                <Link key={p.id} href={`/product/${p.slug}`} className="group">
                                    <div className="bg-card border border-border rounded-xl overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                                        <div className="relative aspect-square bg-secondary/30">
                                            <Image
                                                src={p.image_url || '/placeholder.png'}
                                                alt={p.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                                            />
                                        </div>
                                        <div className="p-3">
                                            <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">{p.name}</h3>
                                            <p className="text-sm font-bold text-primary mt-1">{formatCurrency(p.price)}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {similarLoading && (
                    <div className="mt-16 flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}
            </div>
        </section>
    );
}
