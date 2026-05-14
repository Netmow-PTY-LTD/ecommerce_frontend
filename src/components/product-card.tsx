"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, Eye, GitCompare, Star, Check, Sparkles, Truck, Package, Gift } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore, useWishlistStore, useCompareStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useCurrency } from '@/contexts/CurrencyContext';

interface ProductCardProps {
    product: Product;
    rating?: number;
    reviewsCount?: number;
    showNewBadge?: boolean;
    showSaleBadge?: boolean;
    discountPercentage?: number;
    freeShipping?: boolean;
    bogoDeal?: boolean;
}

export function ProductCard({
    product,
    rating = 4.5,
    reviewsCount = 0,
    showNewBadge = false,
    showSaleBadge = false,
    discountPercentage = 0,
    freeShipping = false,
    bogoDeal = false
}: ProductCardProps) {
    const addItem = useCartStore((state) => state.addItem);
    const toggleWishlist = useWishlistStore((state) => state.toggleItem);
    const isInWishlist = useWishlistStore((state) => state.isInWishlist(product.id));
    const addToCompare = useCompareStore((state) => state.addItem);
    const isInCompare = useCompareStore((state) => state.isInCompare(product.id));
    const { formatCurrency } = useCurrency();

    const [isAdding, setIsAdding] = useState(false);
    const [showAddedCheck, setShowAddedCheck] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageError, setImageError] = useState(false);
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
    const [lastProductId, setLastProductId] = useState<number | null>(null);
    const [lastAttributesLength, setLastAttributesLength] = useState<number>(0);

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

        // Update if product ID changed OR if attributes were just loaded (length changed from 0 to > 0)
        const productChanged = product.id !== lastProductId;
        const attributesJustLoaded = lastAttributesLength === 0 && currentAttributesLength > 0;

        if (productChanged || attributesJustLoaded) {
            setSelectedAttributes(initialSelections);
            setLastProductId(product.id);
            setLastAttributesLength(currentAttributesLength);
        }
    }, [product?.id, product?.attributes, initialSelections]); // Watch product ID and attributes

    const isNewProduct = useCallback(() => {
        if (!product.created_at) return false;
        const createdAt = new Date(product.created_at);
        const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceCreation <= 30; // New if within 30 days
    }, [product.created_at]);

    const hasDiscount = discountPercentage > 0 || showSaleBadge;

    const handleAddToCart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!product.stock_quantity || product.stock_quantity === 0) {
            toast.error('This product is out of stock');
            return;
        }

        setIsAdding(true);
        addItem(product, 1, selectedAttributes);

        setTimeout(() => {
            setIsAdding(false);
            setShowAddedCheck(true);
            toast.success('Added to cart!', {
                icon: <Check className="h-4 w-4" />
            });

            setTimeout(() => {
                setShowAddedCheck(false);
            }, 2000);
        }, 500);
    }, [addItem, product, selectedAttributes]);

    const handleWishlist = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);

        if (!isInWishlist) {
            toast.success('Added to wishlist');
        } else {
            toast.info('Removed from wishlist');
        }
    }, [toggleWishlist, product, isInWishlist]);

    const handleCompare = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addToCompare(product);
        toast.success('Added to compare');
    }, [addToCompare, product]);

    const shouldShowNewBadge = isNewProduct();
    const soldCount = (product.initial_stock || 0) - (product.stock_quantity || 0);
    const totalStock = product.initial_stock || (product.stock_quantity ? product.stock_quantity + 10 : 100);
    const soldPercentage = Math.min(Math.max((soldCount / totalStock) * 100, 10), 90);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group relative bg-white rounded-2xl border hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden"
        >
            {/* Image Container (Full Width) */}
            <div className="relative aspect-[5/4] w-full bg-gray-50/50 flex items-center justify-center overflow-hidden">
                <Link href={`/product/${product.slug || product.id}`} className="w-full h-full relative">
                    {imageError || (!product.image_url && !product.thumb_url) ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                            <Package className="h-10 w-10 text-gray-300" />
                        </div>
                    ) : (
                        <Image
                            src={product.image_url || product.thumb_url || '/placeholder.png'}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            onError={() => setImageError(true)}
                            unoptimized
                        />
                    )}
                </Link>

                {/* Badges - Floating on Image */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                    {shouldShowNewBadge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-gray-100 shadow-sm text-gray-900 uppercase">
                            NEW
                        </span>
                    )}
                    {hasDiscount && (
                        <span className="bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm w-fit">
                            -{discountPercentage || 50}%
                        </span>
                    )}
                </div>

                {/* Action Buttons - Floating on Image */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                    <Button
                        size="icon"
                        variant="ghost"
                        className={`rounded-full bg-white/90 backdrop-blur-sm shadow-sm border border-gray-50 h-8 w-8 hover:bg-white transition-all ${isInWishlist ? 'text-brand' : 'text-gray-400'
                            }`}
                        onClick={handleWishlist}
                    >
                        <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
                    </Button>

                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <Button
                            size="icon"
                            variant="secondary"
                            className="rounded-full shadow-sm h-8 w-8 bg-white/90 backdrop-blur-sm border border-gray-50 text-gray-500 hover:text-brand"
                            onClick={handleCompare}
                        >
                            <GitCompare className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            size="icon"
                            variant="secondary"
                            className="rounded-full shadow-sm h-8 w-8 bg-white/90 backdrop-blur-sm border border-gray-50 text-gray-500 hover:text-brand"
                            asChild
                        >
                            <Link href={`/product/${product.slug || product.id}`}>
                                <Eye className="h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Section (Padded) */}
            <div className="p-4 flex-grow flex flex-col">
                {/* Brand/Category */}
                <p className="text-[11px] text-gray-400 font-medium mb-1">
                    {product.category?.name || 'Hodo Foods'}
                </p>

                {/* Product Name */}
                <Link href={`/product/${product.slug || product.id}`} className="block mb-2">
                    <h3 className="font-bold text-sm leading-tight text-gray-800 line-clamp-2 hover:text-brand transition-colors">
                        {product.name}
                    </h3>
                </Link>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                    <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`h-3 w-3 ${star <= Math.floor(rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'fill-gray-200 text-gray-200'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-[10px] text-gray-400">({rating.toFixed(1)})</span>
                </div>

                {/* Price and Stock */}
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-baseline gap-2">
                        {product.sale_price && product.sale_price < product.price ? (
                            <>
                                <span className="text-2xl font-bold text-foreground">
                                    {formatCurrency(product.sale_price)}
                                </span>
                                <span className="text-sm text-muted-foreground line-through">
                                    {formatCurrency(product.price)}
                                </span>
                            </>
                        ) : (
                            <span className="text-2xl font-bold text-foreground">
                                {formatCurrency(product.price)}
                            </span>
                        )}
                    </div>

                    {/* Low Stock Warning */}
                    {(product.stock_quantity || 0) > 0 && (product.stock_quantity || 0) <= 5 && (
                        <span className="text-xs font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full whitespace-nowrap">
                            Only {product.stock_quantity} left
                        </span>
                    )}
                </div>

                {/* Product Attributes (Compact) */}
                {product.attributes && Array.isArray(product.attributes) && product.attributes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        {product.attributes.slice(0, 2).map((attr, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                                <span className="text-[9px] text-gray-400 uppercase">{attr.name}:</span>
                                <span className="text-[9px] font-semibold text-gray-600">{attr.values[0]}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Progress Bar Section */}
                <div className="mt-auto space-y-1.5 mb-4">
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${soldPercentage}%` }}
                            className="h-full bg-brand rounded-full"
                        />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium">
                        <span>Sold: {soldCount}/{totalStock}</span>
                    </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                    onClick={handleAddToCart}
                    disabled={isAdding || !product.stock_quantity || product.stock_quantity === 0}
                    className={`w-full py-5 rounded-lg border flex items-center justify-center gap-2 font-bold text-xs transition-all duration-300 ${isAdding
                        ? 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-brand text-brand hover:bg-brand hover:text-white group/btn'
                        }`}
                >
                    {isAdding ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            <ShoppingCart className="h-4 w-4" />
                        </motion.div>
                    ) : showAddedCheck ? (
                        <>
                            <Check className="h-4 w-4" />
                            <span>Added!</span>
                        </>
                    ) : (
                        <>
                            <ShoppingCart className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                            <span>Add To Cart</span>
                        </>
                    )}
                </Button>
            </div>

            {/* Out of Stock Overlay */}
            {(!product.stock_quantity || product.stock_quantity === 0) && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-20 rounded-2xl">
                    <div className="bg-white border border-gray-100 text-red-600 font-bold px-4 py-2 rounded-lg shadow-sm">
                        Out of Stock
                    </div>
                </div>
            )}
        </motion.div>
    );
}
