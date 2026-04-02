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

    const renderStars = () => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${star <= Math.floor(rating)
                                ? 'fill-amber-400 text-amber-400'
                                : star <= rating
                                    ? 'fill-amber-400/30 text-amber-400'
                                    : 'fill-slate-200 text-slate-200 dark:fill-slate-700'
                            }`}
                    />
                ))}
                {reviewsCount > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">({reviewsCount})</span>
                )}
            </div>
        );
    };

    const shouldShowNewBadge = showNewBadge || isNewProduct();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group relative bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300"
        >
            {/* Image Container */}
            <div className="aspect-square relative overflow-hidden bg-secondary/50">
                <Link href={`/product/${product.slug || product.id}`}>
                    {imageError || (!product.image_url && !product.thumb_url) ? (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Package className="h-16 w-16 text-muted-foreground" />
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

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                    {shouldShowNewBadge && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg"
                        >
                            <Sparkles className="h-3 w-3" />
                            NEW
                        </motion.span>
                    )}

                    {hasDiscount && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg"
                        >
                            -{discountPercentage || 20}%
                        </motion.span>
                    )}

                    {freeShipping && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg"
                        >
                            <Truck className="h-3 w-3" />
                            FREE SHIP
                        </motion.span>
                    )}

                    {bogoDeal && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.25 }}
                            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg"
                        >
                            <Gift className="h-3 w-3" />
                            BOGO
                        </motion.span>
                    )}

                    {/* Stock Availability Badge */}
                    {(product.stock_quantity || 0) > 5 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg"
                        >
                            <Package className="h-3 w-3" />
                            In Stock: {product.stock_quantity}
                        </motion.span>
                    )}

                    {(product.stock_quantity || 0) > 0 && (product.stock_quantity || 0) <= 5 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg"
                        >
                            <Package className="h-3 w-3" />
                            Low Stock: {product.stock_quantity}
                        </motion.span>
                    )}
                </div>

                {/* Stock Status Badge */}
                {(!product.stock_quantity || product.stock_quantity === 0) && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                        <div className="bg-white text-red-600 font-bold px-4 py-2 rounded-lg shadow-xl">
                            Out of Stock
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
                    <Button
                        size="icon"
                        variant={isInWishlist ? "default" : "secondary"}
                        className={`rounded-full shadow-md h-9 w-9 ${isInWishlist ? 'bg-red-500 hover:bg-red-600' : ''
                            }`}
                        onClick={handleWishlist}
                    >
                        <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
                    </Button>

                    <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-full shadow-md h-9 w-9"
                        onClick={handleCompare}
                    >
                        <GitCompare className="h-4 w-4" />
                    </Button>

                    <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-full shadow-md h-9 w-9"
                        asChild
                    >
                        <Link href={`/product/${product.slug || product.id}`}>
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                {/* Quick Add Button */}
                <div className="absolute bottom-4 right-4 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <AnimatePresence mode="wait">
                        {showAddedCheck ? (
                            <motion.div
                                key="check"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="bg-green-600 text-white rounded-full shadow-md h-12 w-12 flex items-center justify-center"
                            >
                                <Check className="h-6 w-6" />
                            </motion.div>
                        ) : (
                            <motion.button
                                key="add"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                onClick={handleAddToCart}
                                disabled={isAdding || !product.stock_quantity || product.stock_quantity === 0}
                                className={`bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-lg h-12 w-12 flex items-center justify-center transition-all ${isAdding ? 'opacity-70' : ''
                                    } ${!product.stock_quantity || product.stock_quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isAdding ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <ShoppingCart className="h-5 w-5" />
                                    </motion.div>
                                ) : (
                                    <ShoppingCart className="h-5 w-5" />
                                )}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-2">
                {/* Category */}
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    {product.category?.name || 'Category'}
                </p>

                {/* Product Name */}
                <Link href={`/product/${product.slug || product.id}`} className="block">
                    <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
                        {product.name}
                    </h3>
                </Link>

                {/* Rating */}
                <div className="flex items-center gap-2">
                    {renderStars()}
                    {reviewsCount === 0 && (
                        <span className="text-xs text-muted-foreground">New</span>
                    )}
                </div>

                {/* Price and Stock */}
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-baseline gap-2">
                        {hasDiscount ? (
                            <>
                                <span className="text-2xl font-bold text-foreground">
                                    {formatCurrency(product.price * (1 - (discountPercentage || 20) / 100))}
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

                {/* Product Attributes */}
                {product.attributes && Array.isArray(product.attributes) && product.attributes.length > 0 && (
                    <div className="space-y-2 pt-1">
                        {product.attributes.map((attr, idx) => (
                            <div key={idx}>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                    {attr.name}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {attr.values && Array.isArray(attr.values) && attr.values.map((value: string, vIdx: number) => {
                                        const isSelected = selectedAttributes[attr.name] === value;
                                        return (
                                            <button
                                                key={vIdx}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setSelectedAttributes(prev => ({
                                                        ...prev,
                                                        [attr.name]: value
                                                    }));
                                                }}
                                                className={`text-xs px-3 py-1 rounded-md border transition-all ${isSelected
                                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
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
                )}

                {/* Free Shipping Text */}
                {freeShipping && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <Truck className="h-3 w-3" />
                        <span>Free shipping on this item</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
