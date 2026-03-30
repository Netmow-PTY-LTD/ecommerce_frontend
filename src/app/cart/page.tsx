"use client";
import { useState, useEffect } from 'react';

import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, ArrowRight, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function CartPage() {
    const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();
    const { formatCurrency } = useCurrency();
    const [mounted, setMounted] = useState(false);
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

    useEffect(() => {
        setMounted(true);
    }, []);

    const cartTotal = total();
    const shipping = cartTotal > 100 ? 0 : 15.00; // Free shipping over $100
    const finalTotal = cartTotal + shipping;

    if (!mounted || items.length === 0) {
        return (
            <div className="container py-20 text-center space-y-6">
                <h2 className="text-3xl font-bold">Your cart is empty</h2>
                <p className="text-muted-foreground">It looks like you haven't added anything to your cart yet.</p>
                <Link href="/shop">
                    <Button size="lg">Start Shopping</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container px-4 py-8 mx-auto">
            <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-6">
                    <AnimatePresence initial={false}>
                        {items.map((item, index) => {
                            // Create unique key combining product ID and selected attributes
                            const uniqueKey = `${item.id}-${JSON.stringify(item.selectedAttributes)}`;

                            return (
                                <motion.div
                                    key={uniqueKey}
                                    layout
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex gap-4 p-4 border border-border rounded-xl bg-card"
                                >
                                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
                                    {imageErrors.has(item.id) || (!item.image_url && !item.thumb_url) ? (
                                        <div className="w-full h-full flex items-center justify-center bg-muted">
                                            <Package className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                    ) : (
                                        <Image
                                            src={item.image_url || item.thumb_url || ''}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                            onError={() => {
                                                setImageErrors(prev => new Set(prev).add(item.id));
                                            }}
                                            unoptimized
                                        />
                                    )}
                                </div>

                                <div className="flex flex-1 flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between">
                                            <h3 className="text-base font-semibold">
                                                <Link href={`/product/${item.slug || item.id}`} className="hover:underline">{item.name}</Link>
                                            </h3>
                                            <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">{item.sku}</p>

                                        {/* Selected Attributes */}
                                        {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {Object.entries(item.selectedAttributes).map(([name, value], idx) => (
                                                    <div
                                                        key={idx}
                                                        className="text-xs bg-secondary/50 px-2 py-1 rounded-md border border-border"
                                                    >
                                                        <span className="font-medium text-muted-foreground">{name}:</span>{' '}
                                                        <span className="font-semibold">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex items-center border border-input rounded-md">
                                            <button
                                                className="px-2 py-1 hover:bg-secondary transition-colors"
                                                onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedAttributes)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                            <button
                                                className="px-2 py-1 hover:bg-secondary transition-colors"
                                                onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedAttributes)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => removeItem(item.id, item.selectedAttributes)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    <Button variant="outline" onClick={clearCart} className="mt-4">
                        Clear Cart
                    </Button>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-secondary/30 rounded-xl p-6 border border-border sticky top-24">
                        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">{formatCurrency(cartTotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Shipping</span>
                                <span className="font-medium">
                                    {shipping === 0 ? 'Free' : formatCurrency(shipping)}
                                </span>
                            </div>
                            {shipping > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Add {formatCurrency(100 - cartTotal)} more for free shipping.
                                </p>
                            )}

                            <div className="border-t border-border pt-4 flex justify-between items-center text-base font-bold">
                                <span>Total</span>
                                <span>{formatCurrency(finalTotal)}</span>
                            </div>
                        </div>

                        <Link href="/checkout">
                            <Button size="lg" className="w-full mt-6 text-base font-semibold h-12">
                                Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>

                        <p className="text-xs text-center text-muted-foreground mt-4">
                            Secure transaction. Taxes calculated at checkout.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
