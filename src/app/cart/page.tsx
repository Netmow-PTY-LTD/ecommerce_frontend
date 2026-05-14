"use client";
import { useState, useEffect } from 'react';

import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Minus, ArrowRight, Package, Tag, X, Loader2, Gift } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { validateCoupon } from '@/hooks/use-pricing';
import { useShippingRules } from '@/hooks/use-settings';
import api from '@/lib/api';

export default function CartPage() {
    const { items, removeItem, updateQuantity, total, clearCart, coupon, discountAmount, freeShipping, applyCoupon, removeCoupon } = useCartStore();
    const { formatCurrency } = useCurrency();
    const { customer } = useCustomerAuth();
    const { shippingRules } = useShippingRules();
    const [mounted, setMounted] = useState(false);
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

    // Coupon input state
    const [couponCode, setCouponCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');

    // BOGO deals state
    const [bogoProductIds, setBogoProductIds] = useState<Set<number>>(new Set());
    const [bogoCouponCodes, setBogoCouponCodes] = useState<Map<number, string>>(new Map());

    useEffect(() => {
        setMounted(true);
        // Fetch active BOGO deals
        api.get('/pricing/public/bogo-deals').then(res => {
            const deals = res.data?.data || res.data || [];
            const ids = new Set<number>();
            const codes = new Map<number, string>();
            for (const deal of deals) {
                let pids = deal.product_ids;
                if (typeof pids === 'string') {
                    try { pids = JSON.parse(pids); } catch { pids = []; }
                }
                if (!Array.isArray(pids)) continue;
                for (const pid of pids) {
                    ids.add(Number(pid));
                    codes.set(Number(pid), deal.coupon_code);
                }
            }
            setBogoProductIds(ids);
            setBogoCouponCodes(codes);
        }).catch(() => { });
    }, []);

    // Re-validate coupon when cart items change
    useEffect(() => {
        if (!coupon || !mounted) return;
        const cartTotal = total();
        if (cartTotal === 0) { removeCoupon(); return; }
        validateCoupon(coupon.code, cartTotal, customer?.id,
            items.map(i => ({ product_id: i.id, quantity: i.quantity, unit_price: i.price }))
        ).then(res => {
            if (res.data?.valid) {
                applyCoupon(res.data.coupon, res.data.discountAmount, res.data.freeShipping);
            } else {
                removeCoupon();
            }
        }).catch(() => {
            removeCoupon();
        });
    }, [items, coupon?.code, mounted]);

    const cartTotal = total();
    const effectiveDiscount = Math.min(discountAmount, cartTotal);
    const shipping = freeShipping || cartTotal >= shippingRules.free_shipping_threshold ? 0 : shippingRules.flat_rate;
    const discountedSubtotal = Math.max(0, cartTotal - effectiveDiscount);

    // Calculate tax based on each product's sales_tax rate
    const tax = items.reduce((totalTax, item) => {
        const itemSubtotal = (item.sale_price || item.price) * item.quantity;
        const taxRate = (item.sales_tax || 0) / 100; // Use product's sales_tax rate
        return totalTax + (itemSubtotal * taxRate);
    }, 0);

    const finalTotal = Math.max(0, discountedSubtotal + shipping + tax);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponLoading(true);
        setCouponError('');
        try {
            const res = await validateCoupon(couponCode.toUpperCase(), cartTotal, customer?.id,
                items.map(i => ({ product_id: i.id, quantity: i.quantity, unit_price: i.price }))
            );
            if (res.data?.valid) {
                applyCoupon(res.data.coupon, res.data.discountAmount, res.data.freeShipping);
                setCouponCode('');
            } else {
                setCouponError(res.message || 'Invalid coupon');
            }
        } catch (err: any) {
            setCouponError(err.response?.data?.message || 'Failed to validate coupon');
        } finally {
            setCouponLoading(false);
        }
    };

    if (!mounted || items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50/50">
                {/* Red Banner */}
                <section className='py-3 bg-brand'>
                    <div className="container px-4 mx-auto">
                        <div className="w-full flex items-center justify-between">
                            <h1 className="text-white font-bold text-sm md:text-base tracking-wide">Shopping Cart</h1>
                            <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
                                <Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
                                <span className="text-white/50">-</span>
                                <span className="text-white">Cart</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className='py-20 text-center'>
                    <div className="container space-y-6">
                        <h2 className="text-3xl font-bold">Your cart is empty</h2>
                        <p className="text-muted-foreground text-sm">It looks like you haven't added anything to your cart yet.</p>
                        <Link href="/shop">
                            <Button size="lg" className="rounded-xl px-8">Start Shopping</Button>
                        </Link>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Red Banner */}
            <section className='py-3 bg-brand'>
                <div className="container px-4 mx-auto">
                    <div className="w-full flex items-center justify-between">
                        <h1 className="text-white font-bold text-sm md:text-base tracking-wide">Shopping Cart</h1>
                        <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
                            <Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
                            <span className="text-white/50">-</span>
                            <span className="text-white">Cart</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className='py-10'>
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-6">
                            <AnimatePresence initial={false}>
                                {items.map((item, index) => {
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
                                                            {bogoProductIds.has(item.id) && (
                                                                <span className="ml-2 inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                                                                    <Gift className="h-3 w-3" /> BOGO
                                                                </span>
                                                            )}
                                                        </h3>
                                                        <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                                                    </div>
                                                    <p className="mt-1 text-sm text-muted-foreground">{item.sku}</p>

                                                    {bogoProductIds.has(item.id) && item.quantity < 2 && (
                                                        <p className="mt-1 text-xs text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1">
                                                            <Gift className="h-3 w-3" />
                                                            Add 1 more for Buy 1 Get 1 Free (code: {bogoCouponCodes.get(item.id)})
                                                        </p>
                                                    )}
                                                    {bogoProductIds.has(item.id) && item.quantity >= 2 && (
                                                        <p className="mt-1 text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                                            <Gift className="h-3 w-3" />
                                                            BOGO eligible — {Math.floor(item.quantity / 2)} free item{Math.floor(item.quantity / 2) > 1 ? 's' : ''} with code {bogoCouponCodes.get(item.id)}
                                                        </p>
                                                    )}

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
                                                            className="px-2 py-1 hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedAttributes)}
                                                            disabled={bogoProductIds.has(item.id) && item.quantity <= 2}
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

                            <div className="flex items-center gap-4 mt-4">
                                <Link href="/shop">
                                    <Button variant="outline">
                                        Continue Shopping
                                    </Button>
                                </Link>
                                <Button variant="outline" onClick={clearCart}>
                                    Clear Cart
                                </Button>
                            </div>
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

                                    {effectiveDiscount > 0 && (
                                        <div className="flex justify-between text-green-600 dark:text-green-400">
                                            <span className="flex items-center gap-1">
                                                <Tag className="h-3.5 w-3.5" />
                                                Discount
                                                {coupon && <span className="text-xs">({coupon.code})</span>}
                                            </span>
                                            <span className="font-medium">-{formatCurrency(effectiveDiscount)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span className="font-medium">
                                            {shipping === 0 ? 'Free' : formatCurrency(shipping)}
                                        </span>
                                    </div>
                                    {shipping > 0 && !freeShipping && (
                                        <p className="text-xs text-muted-foreground">
                                            Add {formatCurrency(shippingRules.free_shipping_threshold - cartTotal)} more for free shipping.
                                        </p>
                                    )}

                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tax</span>
                                        <span className="font-medium">{formatCurrency(tax)}</span>
                                    </div>

                                    <div className="border-t border-border pt-4 flex justify-between items-center text-base font-bold">
                                        <span>Total</span>
                                        <span>{formatCurrency(finalTotal)}</span>
                                    </div>
                                </div>

                                {/* Coupon Input */}
                                <div className="mt-4 pt-4 border-t border-border">
                                    {coupon ? (
                                        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2.5">
                                            <Tag className="text-green-600 dark:text-green-400 h-4 w-4" />
                                            <span className="text-sm text-green-700 dark:text-green-400 font-medium">{coupon.code}</span>
                                            <span className="text-sm text-green-600 dark:text-green-500">applied</span>
                                            <button onClick={removeCoupon} className="ml-auto p-0.5 hover:bg-green-100 dark:hover:bg-green-900/40 rounded">
                                                <X className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Have a coupon?</label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Enter code"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                                    className="uppercase text-sm h-9"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleApplyCoupon}
                                                    disabled={!couponCode.trim() || couponLoading}
                                                    className="h-9 px-4 shrink-0"
                                                >
                                                    {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                                                </Button>
                                            </div>
                                            {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                                        </div>
                                    )}
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
            </section>
        </div>
    );
}
