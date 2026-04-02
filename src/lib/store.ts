import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

export interface CartItem extends Product {
    quantity: number;
    selectedAttributes?: Record<string, string>;
}

export interface AppliedCoupon {
    id: number;
    code: string;
    type: 'percentage' | 'fixed' | 'free_shipping' | 'bogo';
    value: number;
}

interface CartState {
    items: CartItem[];
    coupon: AppliedCoupon | null;
    discountAmount: number;
    freeShipping: boolean;
    addItem: (product: Product, quantity?: number, selectedAttributes?: Record<string, string>) => void;
    removeItem: (productId: number, selectedAttributes?: Record<string, string>) => void;
    updateQuantity: (productId: number, quantity: number, selectedAttributes?: Record<string, string>) => void;
    clearCart: () => void;
    applyCoupon: (coupon: AppliedCoupon, discountAmount: number, freeShipping: boolean) => void;
    removeCoupon: () => void;
    total: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            coupon: null,
            discountAmount: 0,
            freeShipping: false,
            addItem: (product, quantity = 1, selectedAttributes = {}) => {
                const items = get().items;

                // Check if item with same product ID AND same selected attributes exists
                const existingItem = items.find((item) => {
                    if (item.id !== product.id) return false;

                    // If no attributes, just check product ID
                    if (!item.selectedAttributes || Object.keys(item.selectedAttributes).length === 0) {
                        return !selectedAttributes || Object.keys(selectedAttributes).length === 0;
                    }

                    // Check if all selected attributes match
                    const itemAttrs = item.selectedAttributes || {};
                    const attrKeys = [...new Set([...Object.keys(itemAttrs), ...Object.keys(selectedAttributes)])];

                    return attrKeys.every(key => itemAttrs[key] === selectedAttributes[key]);
                });

                if (existingItem) {
                    set({
                        items: items.map((item) =>
                            item.id === product.id && JSON.stringify(item.selectedAttributes) === JSON.stringify(selectedAttributes)
                                ? { ...item, quantity: item.quantity + quantity }
                                : item
                        ),
                    });
                } else {
                    set({ items: [...items, { ...product, quantity, selectedAttributes }] });
                }
            },
            removeItem: (productId, selectedAttributes = {}) => {
                set({
                    items: get().items.filter((item) => {
                        if (item.id !== productId) return true;

                        // If no attributes provided, remove all matching product ID
                        if (!selectedAttributes || Object.keys(selectedAttributes).length === 0) {
                            return false;
                        }

                        // Check if attributes match
                        return JSON.stringify(item.selectedAttributes) !== JSON.stringify(selectedAttributes);
                    }),
                });
            },
            updateQuantity: (productId, quantity, selectedAttributes = {}) => {
                if (quantity <= 0) {
                    get().removeItem(productId, selectedAttributes);
                } else {
                    set({
                        items: get().items.map((item) =>
                            item.id === productId && JSON.stringify(item.selectedAttributes) === JSON.stringify(selectedAttributes)
                                ? { ...item, quantity }
                                : item
                        ),
                    });
                }
            },
            clearCart: () => set({ items: [], coupon: null, discountAmount: 0, freeShipping: false }),
            applyCoupon: (coupon, discountAmount, freeShipping) => set({ coupon, discountAmount, freeShipping }),
            removeCoupon: () => set({ coupon: null, discountAmount: 0, freeShipping: false }),
            total: () => {
                return get().items.reduce(
                    (total, item) => total + item.price * item.quantity,
                    0
                );
            },
        }),
        {
            name: 'cart-storage',
        }
    )
);

// Wishlist Store
interface WishlistState {
    items: Product[];
    addItem: (product: Product) => void;
    removeItem: (productId: number) => void;
    toggleItem: (product: Product) => void;
    isInWishlist: (productId: number) => boolean;
    clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product) => {
                const items = get().items;
                const exists = items.find((item) => item.id === product.id);
                if (!exists) {
                    set({ items: [...items, product] });
                }
            },
            removeItem: (productId) => {
                set({
                    items: get().items.filter((item) => item.id !== productId),
                });
            },
            toggleItem: (product) => {
                const items = get().items;
                const exists = items.find((item) => item.id === product.id);
                if (exists) {
                    set({
                        items: items.filter((item) => item.id !== product.id),
                    });
                } else {
                    set({ items: [...items, product] });
                }
            },
            isInWishlist: (productId) => {
                return get().items.some((item) => item.id === productId);
            },
            clearWishlist: () => set({ items: [] }),
        }),
        {
            name: 'wishlist-storage',
        }
    )
);

// Compare Store
interface CompareState {
    items: Product[];
    addItem: (product: Product) => void;
    removeItem: (productId: number) => void;
    clearCompare: () => void;
    isInCompare: (productId: number) => boolean;
}

export const useCompareStore = create<CompareState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product) => {
                const items = get().items;
                const exists = items.find((item) => item.id === product.id);
                if (!exists && items.length < 4) {
                    set({ items: [...items, product] });
                }
            },
            removeItem: (productId) => {
                set({
                    items: get().items.filter((item) => item.id !== productId),
                });
            },
            clearCompare: () => set({ items: [] }),
            isInCompare: (productId) => {
                return get().items.some((item) => item.id === productId);
            },
        }),
        {
            name: 'compare-storage',
        }
    )
);
