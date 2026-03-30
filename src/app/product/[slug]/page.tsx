"use client";

import { use, useState, useEffect, useMemo } from 'react';
import { useProduct } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/lib/store';
import { ShoppingCart, Heart, Minus, Plus, Loader2, ArrowLeft, Truck, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const { product, isLoading, isError } = useProduct(slug);
    const addItem = useCartStore((state) => state.addItem);
    const { formatCurrency } = useCurrency();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
    const [lastProductId, setLastProductId] = useState<number | null>(null);
    const [lastAttributesLength, setLastAttributesLength] = useState<number>(0);

    // Compute initial selections from product attributes
    const initialSelections = useMemo(() => {
        if (!product?.attributes || product.attributes.length === 0) {
            return {};
        }
        const selections: Record<string, string> = {};
        product.attributes.forEach((attr: any) => {
            if (attr.values && attr.values.length > 0) {
                selections[attr.name] = attr.values[0];
            }
        });
        return selections;
    }, [product?.id, product?.attributes]);

    // Auto-select first value for each attribute when product changes
    useEffect(() => {
        const currentAttributesLength = product?.attributes?.length || 0;

        if (!product?.id) return;

        // Update if product ID changed OR if attributes were just loaded
        const productChanged = product.id !== lastProductId;
        const attributesJustLoaded = lastAttributesLength === 0 && currentAttributesLength > 0;

        if (productChanged || attributesJustLoaded) {
            setSelectedAttributes(initialSelections);
            setLastProductId(product.id);
            setLastAttributesLength(currentAttributesLength);
        }
    }, [product?.id, product?.attributes]); // Watch product ID and attributes

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
        <div className="container px-4 py-8 mx-auto">
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
                    {product.attributes && product.attributes.length > 0 && (
                        <div className="pt-4 border-t border-border">
                            <h3 className="text-base font-semibold mb-3">Product Attributes</h3>
                            <div className="space-y-3">
                                {product.attributes.map((attr: any, idx: number) => (
                                    <div key={idx} className="bg-secondary/20 rounded-lg p-3">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                            {attr.name}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {attr.values.map((value: string, vIdx: number) => {
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
                                                        className={`text-sm px-4 py-2 rounded-md border transition-all ${
                                                            isSelected
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
                            <div className="text-3xl font-bold text-primary">{formatCurrency(product.price)}</div>
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
                                <span>Free shipping over $100</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                <span>2 year warranty</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
