"use client";

import { use } from 'react';
import { useFlashSale } from '@/hooks/use-pricing';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Clock, Loader2, ArrowLeft, ShoppingCart, Package, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';
import { toast } from 'sonner';

export default function FlashSalePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { flashSale, isLoading, isError } = useFlashSale(slug);
  const { formatCurrency } = useCurrency();
  const addItem = useCartStore((state) => state.addItem);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !flashSale) {
    return (
      <div className="container py-20 text-center">
        <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Flash Sale Not Found</h2>
        <div className="text-muted-foreground mb-6">
          Could not find flash sale with slug: <span className="font-mono">{slug}</span>
        </div>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  const handleAddToCart = (item: any) => {
    if (!item.product?.stock_quantity || item.product.stock_quantity === 0) {
      toast.error('Out of Stock', {
        description: `${item.product?.name} is currently out of stock.`
      });
      return;
    }

    // Check if quantity limit is reached
    if (item.quantity_limit && item.sold_count >= item.quantity_limit) {
      toast.error('Sold Out', {
        description: `${item.product?.name} has sold out.`
      });
      return;
    }

    const productWithSalePrice = {
      ...item.product,
      price: item.sale_price,
      originalPrice: item.original_price
    };

    addItem(productWithSalePrice, 1, {});
    toast.success('Added to cart!', {
      description: `${item.product?.name} added to your cart at flash sale price`
    });
  };

  const isExpired = new Date(flashSale.ends_at) < new Date();
  const isActive = flashSale.status === 'active' && !isExpired;

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>

        {/* Banner */}
        {flashSale.banner_image && (
          <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden mb-8">
            <Image
              src={flashSale.banner_image}
              alt={flashSale.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-red-500" />
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${isActive ? 'bg-red-600 text-white' : 'bg-gray-500 text-white'}`}>
                  {isActive ? 'FLASH SALE' : 'ENDED'}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">{flashSale.name}</h1>
            </div>
          </div>
        )}

        {!flashSale.banner_image && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-6 w-6 text-red-600" />
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${isActive ? 'bg-red-600 text-white' : 'bg-gray-500 text-white'}`}>
                {isActive ? 'FLASH SALE' : 'ENDED'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{flashSale.name}</h1>
          </div>
        )}

        {/* Sale Info */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-semibold">{new Date(flashSale.starts_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className={`font-semibold ${isExpired ? 'text-red-600' : ''}`}>
                {new Date(flashSale.ends_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className={`font-semibold ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                {isActive ? 'Active' : 'Expired'}
              </p>
            </div>
          </div>
          {flashSale.description && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-muted-foreground">{flashSale.description}</p>
            </div>
          )}
        </div>

        {/* Products */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Package className="h-6 w-6" />
            Products ({flashSale.items?.length || 0})
          </h2>

          {!flashSale.items || flashSale.items.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No products in this flash sale.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {flashSale.items.map((item: any) => {
                const isSoldOut = item.quantity_limit && item.sold_count >= item.quantity_limit;
                const isOutOfStock = !item.product?.stock_quantity || item.product.stock_quantity === 0;
                const discountPercentage = item.original_price > 0
                  ? Math.round(((item.original_price - item.sale_price) / item.original_price) * 100)
                  : 0;

                return (
                  <div key={item.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                    <div className="relative">
                      {discountPercentage > 0 && (
                        <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                          {discountPercentage}% OFF
                        </div>
                      )}
                      {(isSoldOut || isOutOfStock) && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                          <span className="bg-white text-black text-sm font-bold px-4 py-2 rounded-lg">
                            SOLD OUT
                          </span>
                        </div>
                      )}
                      <Link href={`/product/${item.product?.slug}`} className="block aspect-square bg-secondary/30">
                        {item.product?.thumb_url || item.product?.image_url ? (
                          <Image
                            src={item.product.thumb_url || item.product.image_url}
                            alt={item.product?.name || 'Product'}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                      </Link>
                    </div>

                    <div className="p-4">
                      <Link href={`/product/${item.product?.slug}`}>
                        <h3 className="font-semibold text-sm mb-2 line-clamp-2 hover:text-primary transition-colors">
                          {item.product?.name || 'Unnamed Product'}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(item.sale_price)}
                        </span>
                        {item.original_price > item.sale_price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatCurrency(item.original_price)}
                          </span>
                        )}
                      </div>

                      {item.quantity_limit && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Available:</span>
                            <span className="font-medium">
                              {item.quantity_limit - item.sold_count} / {item.quantity_limit}
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-red-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min((item.sold_count / item.quantity_limit) * 100, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <Button
                        className="w-full"
                        size="sm"
                        onClick={() => handleAddToCart(item)}
                        disabled={!isActive || isSoldOut || isOutOfStock}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
