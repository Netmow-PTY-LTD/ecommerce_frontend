"use client";

import { use } from 'react';
import { useFlashSale } from '@/hooks/use-pricing';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Clock, Loader2, ArrowLeft, ShoppingCart, Package, AlertCircle, Sparkles, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function FlashSalePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { flashSale, isLoading, isError } = useFlashSale(slug);
  const { formatCurrency } = useCurrency();
  const addItem = useCartStore((state) => state.addItem);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand" />
        <p className="text-sm font-medium text-slate-400 animate-pulse tracking-wide">Loading exclusive deals...</p>
      </div>
    );
  }

  if (isError || !flashSale) {
    return (
      <div className="container py-20 text-center max-w-xl mx-auto">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-10 w-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Flash Sale Not Found</h2>
        <p className="text-slate-500 mb-8 text-sm">
          The flash sale you are looking for might have ended or is no longer available.
          Slug: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[12px]">{slug}</span>
        </p>
        <Link href="/">
          <Button className="rounded-xl px-8 h-12 bg-brand hover:bg-brand/90 transition-all">
            Back to Home
          </Button>
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
    <div className="min-h-screen bg-white pb-10">
      {/* Red Header Banner - Consistent with site branding */}
      <section className='py-3 bg-brand'>
        <div className="container">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-white font-bold text-sm md:text-base tracking-wide">Flash Deal Details</h1>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
              <Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
              <span className="text-white/50">/</span>
              <span className="text-white">Flash Sale</span>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-50 py-8 md:py-16">
        {/* Background blobs for visual interest */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative z-10">
          <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-center">

            {/* Left: Info Content */}
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold tracking-widest uppercase">{isActive ? 'Active Flash Sale' : 'Sale Ended'}</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
                {flashSale.name}
              </h1>

              {flashSale.description && (
                <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto md:mx-0 leading-relaxed font-medium mb-4">
                  {flashSale.description}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                <div className="flex flex-col p-4 bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[140px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ends At</span>
                  <span className={cn("text-sm font-bold", isExpired ? "text-red-600" : "text-slate-900")}>
                    {new Date(flashSale.ends_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex flex-col p-4 bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[140px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</span>
                  <div className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-green-500" : "bg-slate-300")} />
                    <span className={cn("text-sm font-bold", isActive ? "text-green-600" : "text-slate-400")}>
                      {isActive ? 'Active Now' : 'Expired'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Banner Image */}
            <div className="w-full md:w-1/2 lg:w-2/5">
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-brand/10 border-4 border-white group">
                {flashSale.banner_image ? (
                  <Image
                    src={flashSale.banner_image}
                    alt={flashSale.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <TrendingUp className="w-20 h-20 text-slate-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Featured Deals
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                {flashSale.items?.length || 0} Limited time offers
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <div className="w-8 h-[2px] bg-slate-200" />
              Shop the Collection
            </div>
          </div>

          {!flashSale.items || flashSale.items.length === 0 ? (
            <div className="text-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <Package className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No products currently listed</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {flashSale.items.map((item: any) => {
                const isSoldOut = item.quantity_limit && item.sold_count >= item.quantity_limit;
                const isOutOfStock = !item.product?.stock_quantity || item.product.stock_quantity === 0;
                const discountPercentage = item.original_price > 0
                  ? Math.round(((item.original_price - item.sale_price) / item.original_price) * 100)
                  : 0;

                return (
                  <div key={item.id} className="group flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-brand/20 transition-all duration-300">
                    <div className="relative aspect-square overflow-hidden bg-slate-50">
                      {/* Badge Container */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                        {discountPercentage > 0 && (
                          <div className="bg-brand text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-brand/20 tracking-wider">
                            {discountPercentage}% OFF
                          </div>
                        )}
                      </div>

                      {(isSoldOut || isOutOfStock) && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                          <span className="bg-white text-slate-900 text-[10px] font-bold px-4 py-2 rounded-xl shadow-xl uppercase tracking-widest">
                            Sold Out
                          </span>
                        </div>
                      )}

                      <Link href={`/product/${item.product?.slug}`} className="block w-full h-full p-6">
                        {item.product?.thumb_url || item.product?.image_url ? (
                          <Image
                            src={item.product.thumb_url || item.product.image_url}
                            alt={item.product?.name || 'Product'}
                            fill
                            className="object-contain p-8 group-hover:scale-110 transition-transform duration-500"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-12 w-12 text-slate-200" />
                          </div>
                        )}
                      </Link>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="mb-4">
                        <Link href={`/product/${item.product?.slug}`}>
                          <h3 className="font-bold text-slate-800 text-sm md:text-base mb-1 line-clamp-1 group-hover:text-brand transition-colors">
                            {item.product?.name || 'Unnamed Product'}
                          </h3>
                        </Link>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {item.product?.category?.name || 'Essential Item'}
                        </p>
                      </div>

                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-xl font-black text-slate-900">
                          {formatCurrency(item.sale_price)}
                        </span>
                        {item.original_price > item.sale_price && (
                          <span className="text-xs text-slate-400 line-through font-medium">
                            {formatCurrency(item.original_price)}
                          </span>
                        )}
                      </div>

                      {item.quantity_limit && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                            <span>Availability</span>
                            <span className={cn(isSoldOut ? "text-red-500" : "text-brand")}>
                              {item.quantity_limit - item.sold_count} Left
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-brand h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${Math.min((item.sold_count / item.quantity_limit) * 100, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <Button
                        className={cn(
                          "w-full rounded-xl font-bold text-xs uppercase tracking-widest h-11 transition-all shadow-md",
                          isActive && !isSoldOut && !isOutOfStock
                            ? "bg-brand hover:bg-brand/90 text-white shadow-brand/10"
                            : "bg-slate-100 text-slate-400 hover:bg-slate-100"
                        )}
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
      </section>
    </div>
  );
}
