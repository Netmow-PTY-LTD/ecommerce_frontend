"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, X, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import Image from 'next/image';
import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Product } from '@/types';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const addItem = useCartStore((state) => state.addItem);
    const { formatCurrency } = useCurrency();

    useEffect(() => {
        if (isOpen) {
            // Focus input when modal opens
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setLoading(true);
                try {
                    const response = await api.get(`/ecommerce/products?search=${encodeURIComponent(searchQuery)}&limit=8`);
                    setResults(response.data.data || []);
                    setSelectedIndex(-1);
                } catch (error) {
                    console.error('Search error:', error);
                    setResults([]);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen || results.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < results.length - 1 ? prev + 1 : prev
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
            } else if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault();
                const product = results[selectedIndex];
                if (product) {
                    handleProductClick(product);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex]);

    const handleProductClick = (product: Product) => {
        onClose();
        setSearchQuery('');
        setResults([]);
        router.push(`/product/${product.slug || product.id}`);
    };

    const handleAddToCart = (product: Product, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!product.stock_quantity || product.stock_quantity === 0) {
            toast.error('This product is out of stock');
            return;
        }

        addItem(product);
        toast.success('Added to cart!');
    };

    const handleViewAllResults = () => {
        if (searchQuery.trim()) {
            onClose();
            router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
                        <motion.div
                            initial={{ opacity: 0, y: -50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -50, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-3xl bg-background rounded-2xl shadow-2xl border border-border overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Search Header */}
                            <div className="flex items-center gap-4 p-4 border-b border-border">
                                <Search className="h-5 w-5 text-muted-foreground" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products..."
                                    className="flex-1 bg-transparent border-0 outline-none text-lg placeholder:text-muted-foreground"
                                    autoFocus
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setResults([]);
                                        }}
                                        className="p-1 hover:bg-secondary rounded-full transition-colors"
                                    >
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                >
                                    <span className="text-sm text-muted-foreground">ESC</span>
                                </button>
                            </div>

                            {/* Search Results */}
                            <div className="max-h-[60vh] overflow-y-auto">
                                {loading ? (
                                    <div className="p-8 flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : searchQuery.trim().length < 2 ? (
                                    <div className="p-12 text-center">
                                        <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-lg text-muted-foreground">
                                            Start typing to search for products
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Enter at least 2 characters to begin search
                                        </p>
                                    </div>
                                ) : results.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-lg text-muted-foreground">
                                            No products found
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Try different keywords or browse our shop
                                        </p>
                                        <button
                                            onClick={() => {
                                                onClose();
                                                router.push('/shop');
                                            }}
                                            className="mt-4 text-primary hover:underline"
                                        >
                                            Browse all products →
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-4">
                                        <div className="mb-4 flex items-center justify-between">
                                            <p className="text-sm text-muted-foreground">
                                                Found {results.length} result{results.length !== 1 ? 's' : ''}
                                            </p>
                                            <button
                                                onClick={handleViewAllResults}
                                                className="text-sm text-primary hover:underline font-medium"
                                            >
                                                View all results →
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {results.map((product, index) => (
                                                <motion.div
                                                    key={product.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    onClick={() => handleProductClick(product)}
                                                    className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${
                                                        selectedIndex === index
                                                            ? 'bg-secondary'
                                                            : 'hover:bg-secondary/50'
                                                    }`}
                                                >
                                                    {/* Product Image */}
                                                    <div className="relative w-20 h-20 flex-shrink-0 bg-secondary rounded-lg overflow-hidden">
                                                        {product.image_url || product.thumb_url ? (
                                                            <Image
                                                                src={product.image_url || product.thumb_url || ''}
                                                                alt={product.name}
                                                                fill
                                                                className="object-cover"
                                                                unoptimized
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Product Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-muted-foreground mb-1">
                                                            {product.category?.name || 'Product'}
                                                        </p>
                                                        <h4 className="font-semibold text-foreground truncate">
                                                            {product.name}
                                                        </h4>
                                                        <p className="text-lg font-bold text-primary mt-1">
                                                            {formatCurrency(product.price)}
                                                        </p>
                                                    </div>

                                                    {/* Stock & Add to Cart */}
                                                    <div className="flex flex-col items-end gap-2">
                                                        {(!product.stock_quantity || product.stock_quantity === 0) ? (
                                                            <span className="text-xs text-red-600 font-medium">
                                                                Out of Stock
                                                            </span>
                                                        ) : (product.stock_quantity <= 5) ? (
                                                            <span className="text-xs text-amber-600 font-medium">
                                                                Only {product.stock_quantity} left
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-green-600 font-medium">
                                                                In Stock
                                                            </span>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-xs"
                                                            onClick={(e) => handleAddToCart(product, e)}
                                                            disabled={!product.stock_quantity || product.stock_quantity === 0}
                                                        >
                                                            Add to Cart
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Search Tips */}
                            {searchQuery.trim().length < 2 && !loading && (
                                <div className="p-4 border-t border-border bg-secondary/20">
                                    <p className="text-xs text-muted-foreground mb-2">Search tips:</p>
                                    <ul className="text-xs text-muted-foreground space-y-1">
                                        <li>• Use product name, SKU, or category</li>
                                        <li>• Minimum 2 characters to start searching</li>
                                        <li>• Use arrow keys to navigate results</li>
                                        <li>• Press Enter to select a product</li>
                                    </ul>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
