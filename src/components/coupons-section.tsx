"use client";

import { useActiveCoupons } from "@/hooks/use-pricing";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Copy, Loader2, Tag, Clock, Percent, DollarSign, Truck, Gift } from "lucide-react";
import { toast } from "sonner";

export function CouponsSection() {
  const { coupons, isLoading, isError } = useActiveCoupons();
  const { formatCurrency } = useCurrency();

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code "${code}" copied!`);
  };

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

  if (isError || coupons.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'percentage': return Percent;
      case 'fixed': return DollarSign;
      case 'free_shipping': return Truck;
      case 'bogo': return Gift;
      default: return Tag;
    }
  };

  const getDiscountLabel = (coupon: any) => {
    if (coupon.type === 'percentage') return `${coupon.value}% OFF`;
    if (coupon.type === 'fixed') return `${formatCurrency(coupon.value)} OFF`;
    if (coupon.type === 'free_shipping') return 'FREE SHIPPING';
    if (coupon.type === 'bogo') return 'BUY 1 GET 1 FREE';
    return 'DISCOUNT';
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Tag className="h-8 w-8 text-purple-600" />
            <h2 className="text-3xl md:text-4xl font-bold">Special Offers</h2>
          </div>
          <p className="text-muted-foreground">Use these coupons at checkout and save on your order!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {coupons.map((coupon: any) => {
            const Icon = getIcon(coupon.type);
            const isExpiringSoon = coupon.expires_at && new Date(coupon.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const isLimited = coupon.remaining !== null && coupon.remaining <= 50;

            return (
              <div
                key={coupon.id}
                className="bg-card border-2 border-border rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all"
              >
                {/* Header with discount */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <span className="font-bold text-lg">{getDiscountLabel(coupon)}</span>
                    </div>
                    {isExpiringSoon && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Ending soon
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  {coupon.description && (
                    <p className="text-sm text-muted-foreground">{coupon.description}</p>
                  )}

                  {/* Coupon Code Box */}
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Coupon Code:</p>
                        <code className="text-lg font-mono font-bold text-foreground">{coupon.code}</code>
                      </div>
                      <button
                        onClick={() => copyToClipboard(coupon.code)}
                        className="shrink-0 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        title="Copy code"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Requirements & Info */}
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {coupon.min_order_amount > 0 && (
                      <p>• Minimum order: {formatCurrency(coupon.min_order_amount)}</p>
                    )}
                    {coupon.max_discount_amount && (
                      <p>• Max discount: {formatCurrency(coupon.max_discount_amount)}</p>
                    )}
                    {coupon.expires_at && (
                      <p className={isExpiringSoon ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                        • Expires: {new Date(coupon.expires_at).toLocaleDateString()}
                      </p>
                    )}
                    {isLimited && (
                      <p className="text-amber-600 dark:text-amber-400 font-medium">
                        • Only {coupon.remaining} left!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Copy the coupon code and paste it at checkout to apply your discount.
          </p>
        </div>
      </div>
    </section>
  );
}
