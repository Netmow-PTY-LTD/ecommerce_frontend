"use client";

import { useActiveFlashSales } from "@/hooks/use-pricing";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Clock, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function FlashSalesSection() {
  const { flashSales, isLoading, isError } = useActiveFlashSales();
  const { formatCurrency } = useCurrency();

  if (isLoading) {
    return (
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (isError || flashSales.length === 0) {
    return null; // Don't show section if no active flash sales
  }

  return (
    <section className="py-16 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Clock className="h-8 w-8 text-red-600" />
            <h2 className="text-3xl md:text-4xl font-bold">Flash Sale</h2>
          </div>
          <p className="text-muted-foreground">Limited time offers - Don't miss out!</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {flashSales.map((sale: any) => (
            <div key={sale.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
              <div className="relative">
                <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                  FLASH SALE
                </div>
                <div className="absolute top-3 right-3 bg-white dark:bg-zinc-900 text-red-600 text-xs font-bold px-2 py-1 rounded-full z-10">
                  {sale.discount_percentage}% OFF
                </div>
                <Link href={`/flash-sale/${sale.slug || sale.id}`} className="block aspect-square bg-secondary/30">
                  {sale.banner_image ? (
                    <Image
                      src={sale.banner_image}
                      alt={sale.name}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-muted-foreground">No image</span>
                    </div>
                  )}
                </Link>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-sm mb-2">{sale.name}</h3>

                <div className="space-y-1 mb-3">
                  {sale.items?.slice(0, 2).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate flex-1">{item.product?.name}</span>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-red-600 font-bold">{formatCurrency(item.sale_price)}</span>
                        {item.product?.price && item.product.price > item.sale_price && (
                          <span className="text-muted-foreground line-through text-xs">
                            {formatCurrency(item.product.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {sale.items?.length > 2 && (
                    <p className="text-xs text-muted-foreground">+{sale.items.length - 2} more items</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>Ends:</span>
                  <span className="font-medium text-foreground">
                    {new Date(sale.ends_at).toLocaleDateString()}
                  </span>
                </div>

                <Link
                  href={`/flash-sale/${sale.slug || sale.id}`}
                  className="block w-full bg-primary text-primary-foreground text-center py-2 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                  View Deal
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
