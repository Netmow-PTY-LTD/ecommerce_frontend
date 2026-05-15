"use client";

import { useCompareStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, GitCompare, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function ComparePage() {
    const { items: compareItems, removeItem, clearCompare } = useCompareStore();
    const { formatCurrency } = useCurrency();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <section className="py-8 md:py-16">
                <div className="container">
                    <div className="animate-pulse space-y-8">
                        <div className="h-8 bg-secondary rounded w-48"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
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

    if (compareItems.length === 0) {
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
                                <GitCompare className="h-12 w-12 text-muted-foreground" />
                            </div>

                            {/* Heading */}
                            <h1 className="text-3xl font-bold mb-4">Compare Products</h1>
                            <p className="text-muted-foreground mb-8">
                                You haven't added any products to compare yet. Browse our shop and add products to compare their features.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/shop">
                                    <Button size="lg" className="w-full sm:w-auto">
                                        <ShoppingBag className="h-4 w-4 mr-2" />
                                        Browse Products
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        );
    }

    const handleRemove = (productId: number) => {
        removeItem(productId);
        toast.success('Product removed from comparison');
    };

    const handleClearAll = () => {
        clearCompare();
        toast.success('All products removed from comparison');
    };

    // Define comparison fields
    const comparisonFields = [
        {
            key: 'image',
            label: 'Product',
            render: (product: any) => (
                <div className="space-y-4">
                    <div className="relative aspect-square bg-secondary rounded-xl overflow-hidden">
                        {product.image_url || product.thumb_url ? (
                            <Image
                                src={product.image_url || product.thumb_url}
                                alt={product.name}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="h-16 w-16 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            {product.category?.name || 'Category'}
                        </p>
                    </div>
                </div>
            )
        },
        {
            key: 'name',
            label: 'Name',
            render: (product: any) => (
                <Link
                    href={`/product/${product.slug || product.id}`}
                    className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2"
                >
                    {product.name}
                </Link>
            )
        },
        {
            key: 'price',
            label: 'Price',
            render: (product: any) => (
                <div className="text-2xl font-bold text-primary">
                    {formatCurrency(product.price)}
                </div>
            )
        },
        {
            key: 'stock',
            label: 'Availability',
            render: (product: any) => {
                const stock = product.stock_quantity || 0;
                if (stock === 0) {
                    return <span className="text-red-600 font-medium">Out of Stock</span>;
                } else if (stock <= 5) {
                    return (
                        <span className="text-amber-600 font-medium">
                            Low Stock ({stock} left)
                        </span>
                    );
                } else {
                    return (
                        <span className="text-green-600 font-medium">
                            In Stock ({stock} available)
                        </span>
                    );
                }
            }
        },
        {
            key: 'rating',
            label: 'Rating',
            render: () => {
                const rating = 4.5;
                return (
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                                key={star}
                                className={`h-4 w-4 ${star <= Math.floor(rating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'fill-slate-200 text-slate-200 dark:fill-slate-700'
                                    }`}
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ))}
                        <span className="text-sm text-muted-foreground ml-2">{rating} out of 5</span>
                    </div>
                );
            }
        },
        {
            key: 'description',
            label: 'Description',
            render: (product: any) => (
                <p className="text-sm text-muted-foreground line-clamp-4">
                    {product.description || 'No description available.'}
                </p>
            )
        },
        {
            key: 'specification',
            label: 'Specification',
            render: (product: any) => (
                <p className="text-sm text-muted-foreground">
                    {product.specification || 'Not specified'}
                </p>
            )
        },
        {
            key: 'category',
            label: 'Category',
            render: (product: any) => (
                <span className="text-sm">{product.category?.name || 'N/A'}</span>
            )
        },
        {
            key: 'sku',
            label: 'SKU',
            render: (product: any) => (
                <span className="text-sm font-mono bg-secondary px-2 py-1 rounded">
                    {product.sku || 'N/A'}
                </span>
            )
        },
        {
            key: 'attributes',
            label: 'Attributes',
            render: (product: any) => (
                <div className="space-y-2">
                    {product.attributes && product.attributes.length > 0 ? (
                        product.attributes.map((attr: any, idx: number) => (
                            <div key={idx} className="text-sm">
                                <span className="font-medium">{attr.name}:</span>{' '}
                                <span className="text-muted-foreground">{attr.values.join(', ')}</span>
                            </div>
                        ))
                    ) : (
                        <span className="text-sm text-muted-foreground">No attributes</span>
                    )}
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (product: any) => (
                <div className="space-y-2">
                    <Link href={`/product/${product.slug || product.id}`} className="block">
                        <Button variant="outline" size="sm" className="w-full">
                            View Details
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemove(product.id)}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Compare Products</h1>
                    <p className="text-muted-foreground mt-1">
                        Comparing {compareItems.length} product{compareItems.length > 1 ? 's' : ''}
                    </p>
                </div>

                <div className="flex gap-3">
                    {compareItems.length > 1 && (
                        <Button
                            variant="outline"
                            onClick={handleClearAll}
                            className="text-red-600 hover:text-red-700"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Clear All
                        </Button>
                    )}
                    <Link href="/shop">
                        <Button>
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Add More
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* Comparison Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="overflow-x-auto"
            >
                <div className="min-w-[800px]">
                    <table className="w-full border-collapse">
                        <tbody>
                            {comparisonFields.map((field, fieldIndex) => (
                                <tr
                                    key={field.key}
                                    className={`border-b border-border ${fieldIndex % 2 === 0 ? 'bg-background' : 'bg-secondary/20'
                                        }`}
                                >
                                    {/* Field Label */}
                                    <td className="p-4 font-semibold text-sm w-48 sticky left-0 bg-background border-r border-border z-10">
                                        {field.label}
                                    </td>

                                    {/* Product Values */}
                                    {compareItems.map((product) => (
                                        <td
                                            key={product.id}
                                            className="p-4 min-w-[250px] align-top"
                                        >
                                            {field.render(product)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Bottom Actions */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
            >
                <Link href="/shop" className="block">
                    <Button size="lg" variant="outline">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Continue Shopping
                    </Button>
                </Link>
            </motion.div>
        </div>
    );
}
