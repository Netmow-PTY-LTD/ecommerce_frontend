"use client";

import { useWishlistStore, useCartStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, X, ShoppingBag, ShoppingCart, Trash2, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ProductCard } from '@/components/product-card';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function WishlistPage() {
    const { items: wishlistItems, removeItem, clearWishlist, isInWishlist } = useWishlistStore();
    const { addItem } = useCartStore();
    const { formatCurrency } = useCurrency();
    const [mounted, setMounted] = useState(false);
    const [addingToCart, setAddingToCart] = useState<Set<number>>(new Set());
    const [showAddedCheck, setShowAddedCheck] = useState<Set<number>>(new Set());

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleAddToCart = (product: any, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!product.stock_quantity || product.stock_quantity === 0) {
            toast.error('This product is out of stock');
            return;
        }

        setAddingToCart(prev => new Set(prev).add(product.id));

        setTimeout(() => {
            addItem(product);
            setAddingToCart(prev => {
                const newSet = new Set(prev);
                newSet.delete(product.id);
                return newSet;
            });
            setShowAddedCheck(prev => new Set(prev).add(product.id));

            setTimeout(() => {
                setShowAddedCheck(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(product.id);
                    return newSet;
                });
            }, 2000);

            toast.success('Added to cart!', {
                icon: <Check className="h-4 w-4" />
            });
        }, 500);
    };

    const handleRemove = (productId: number) => {
        removeItem(productId);
        toast.success('Removed from wishlist');
    };

    const handleClearAll = () => {
        clearWishlist();
        toast.success('Wishlist cleared');
    };

    if (!mounted) {
        return (
            <section className="py-8 md:py-16">
                <div className="container">
                    <div className="animate-pulse space-y-8">
                        <div className="h-8 bg-secondary rounded w-48"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="space-y-4">
                                    <div className="aspect-square bg-secondary rounded-xl"></div>
                                    <div className="h-4 bg-secondary rounded w-3/4"></div>
                                    <div className="h-4 bg-secondary rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (wishlistItems.length === 0) {
        return (
            <section className="py-8 md:py-16">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl mx-auto text-center"
                    >
                        <div className="bg-card border border-border rounded-2xl p-12">
                            {/* Icon */}
                            <div className="w-24 h-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
                                <Heart className="h-12 w-12 text-muted-foreground" />
                            </div>

                            {/* Heading */}
                            <h1 className="text-3xl font-bold mb-4">Your Wishlist</h1>
                            <p className="text-muted-foreground mb-8">
                                Your wishlist is empty. Start adding products you love and they'll appear here!
                            </p>

                            {/* CTA Button */}
                            <Link href="/shop">
                                <Button size="lg">
                                    <ShoppingBag className="h-4 w-4 mr-2" />
                                    Start Shopping
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-8 md:py-16">
            <div className="container">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
                >
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Your Wishlist</h1>
                        <p className="text-muted-foreground mt-1">
                            {wishlistItems.length} product{wishlistItems.length !== 1 ? 's' : ''} saved
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleClearAll}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear All
                        </Button>
                        <Link href="/shop">
                            <Button>
                                <ShoppingBag className="h-4 w-4 mr-2" />
                                Continue Shopping
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* Products Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    <AnimatePresence>
                        {wishlistItems.map((product) => (
                            <motion.div
                                key={product.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                className="group relative bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300"
                            >
                                {/* Image Container */}
                                <div className="aspect-square relative overflow-hidden bg-secondary/50">
                                    <Link href={`/product/${product.slug || product.id}`}>
                                        {product.image_url || product.thumb_url ? (
                                            <Image
                                                src={product.image_url || product.thumb_url || ''}
                                                alt={product.name}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ShoppingBag className="h-16 w-16 text-muted-foreground" />
                                            </div>
                                        )}
                                    </Link>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => handleRemove(product.id)}
                                        className="absolute top-3 right-3 bg-white/90 dark:bg-black/90 hover:bg-red-600 hover:text-white text-red-600 rounded-full p-2 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                                        aria-label="Remove from wishlist"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>

                                    {/* Out of Stock Overlay */}
                                    {(!product.stock_quantity || product.stock_quantity === 0) && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                            <div className="bg-white text-red-600 font-bold px-4 py-2 rounded-lg shadow-xl">
                                                Out of Stock
                                            </div>
                                        </div>
                                    )}

                                    {/* Add to Cart Button */}
                                    <div className="absolute bottom-4 right-4 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                        <motion.button
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => handleAddToCart(product, e)}
                                            disabled={
                                                addingToCart.has(product.id) ||
                                                !product.stock_quantity ||
                                                product.stock_quantity === 0
                                            }
                                            className={`bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-lg h-12 w-12 flex items-center justify-center transition-all ${addingToCart.has(product.id) ? 'opacity-70' : ''
                                                } ${!product.stock_quantity || product.stock_quantity === 0
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : ''
                                                }`}
                                        >
                                            {showAddedCheck.has(product.id) ? (
                                                <Check className="h-6 w-6" />
                                            ) : addingToCart.has(product.id) ? (
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
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 space-y-2">
                                    {/* Category */}
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                        {product.category?.name || 'Category'}
                                    </p>

                                    {/* Product Name */}
                                    <Link href={`/product/${product.slug || product.id}`}>
                                        <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
                                            {product.name}
                                        </h3>
                                    </Link>

                                    {/* Price */}
                                    <div className="flex items-baseline gap-2 pt-2">
                                        <span className="text-2xl font-bold text-foreground">
                                            {formatCurrency(product.price)}
                                        </span>
                                    </div>

                                    {/* Stock Status */}
                                    <div className="pt-2">
                                        {(!product.stock_quantity || product.stock_quantity === 0) ? (
                                            <span className="text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full">
                                                Out of Stock
                                            </span>
                                        ) : (product.stock_quantity <= 5) ? (
                                            <span className="text-xs font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full">
                                                Only {product.stock_quantity} left
                                            </span>
                                        ) : (
                                            <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                                                In Stock
                                            </span>
                                        )}
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="pt-2 flex gap-2">
                                        <Link
                                            href={`/product/${product.slug || product.id}`}
                                            className="flex-1"
                                        >
                                            <Button variant="outline" size="sm" className="w-full">
                                                View Details
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRemove(product.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {/* Bottom Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-12"
                >
                    {/* Summary Stats */}
                    <div className="bg-card border border-border rounded-xl p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary">
                                    {wishlistItems.length}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Products Saved
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary">
                                    {formatCurrency(
                                        wishlistItems.reduce((sum, p) => sum + (p.price || 0), 0)
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Total Value
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary">
                                    {
                                        wishlistItems.filter(
                                            p => p.stock_quantity && p.stock_quantity > 0
                                        ).length
                                    }
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Available Now
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Continue Shopping Banner */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-center text-white">
                        <h3 className="text-2xl font-bold mb-2">Love what you see?</h3>
                        <p className="text-indigo-100 mb-6">
                            Explore more products and add them to your wishlist
                        </p>
                        <Link href="/shop">
                            <Button size="lg" variant="secondary">
                                <ShoppingBag className="h-4 w-4 mr-2" />
                                Browse More Products
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
