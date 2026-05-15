"use client";

import { useActiveCoupons } from "@/hooks/use-pricing";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Copy, Loader2, Tag, Clock, Percent, DollarSign, Truck, Gift, Ticket, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CouponsSection() {
  const { coupons, isLoading, isError } = useActiveCoupons();
  const { formatCurrency } = useCurrency();

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code "${code}" copied!`);
  };

  if (isLoading) {
    return (
      <section className="py-8 md:py-16 bg-slate-50/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-brand" />
            <p className="mt-4 text-xs font-semibold text-slate-400 tracking-wide">Finding best offers...</p>
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
    if (coupon.type === 'bogo') return 'BUY 1 GET 1';
    return 'DISCOUNT';
  };

  return (
    <section className="py-8 md:py-16 bg-slate-50/50 border-y border-slate-100 overflow-hidden relative">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold tracking-wide">Exclusive Deals</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-4">
            Special <span className="text-brand">Savings</span>
          </h2>
          <p className="text-slate-500 font-medium text-sm md:text-base">
            Unlock premium discounts by using these active coupons at checkout. Limited time availability.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {coupons.map((coupon: any) => {
            const Icon = getIcon(coupon.type);
            const isExpiringSoon = coupon.expires_at && new Date(coupon.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const isLimited = coupon.remaining !== null && coupon.remaining <= 50;

            return (
              <div
                key={coupon.id}
                className="group relative flex flex-col transition-all duration-500 hover:-translate-y-1"
              >
                {/* Ticket Body */}
                <div className="relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm group-hover:shadow-xl group-hover:shadow-brand/5 group-hover:border-brand/20 transition-all duration-500 flex flex-col h-full overflow-hidden">

                  {/* Status Badges */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand/5 flex items-center justify-center text-brand">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 tracking-wide capitalize">{coupon.type.replace('_', ' ')}</span>
                    </div>
                    {isExpiringSoon && (
                      <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold">
                        <Clock className="w-3 h-3" />
                        Ending Soon
                      </span>
                    )}
                  </div>

                  {/* Value Section */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1 group-hover:text-brand transition-colors">
                      {getDiscountLabel(coupon)}
                    </h3>
                    {coupon.description && (
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{coupon.description}</p>
                    )}
                  </div>

                  {/* Perforated Separator */}
                  <div className="relative flex items-center mb-6">
                    <div className="absolute -left-8 w-4 h-4 rounded-full bg-slate-50 border border-slate-200 z-10" />
                    <div className="flex-1 border-t-2 border-dashed border-slate-100" />
                    <div className="absolute -right-8 w-4 h-4 rounded-full bg-slate-50 border border-slate-200 z-10" />
                  </div>

                  {/* Code Section */}
                  <div className="mt-auto space-y-4">
                    <div className="relative group/code">
                      <div className="absolute inset-0 bg-brand/5 rounded-xl border-2 border-dashed border-brand/20 transition-all group-hover/code:bg-brand/10 group-hover/code:border-brand/40" />
                      <div className="relative p-4 flex items-center justify-between">
                        <code className="text-lg font-bold text-slate-900 tracking-widest">{coupon.code}</code>
                        <button
                          onClick={() => copyToClipboard(coupon.code)}
                          className="h-10 w-10 rounded-lg bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          title="Copy Code"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Requirements Footer */}
                    <div className="pt-2 grid grid-cols-2 gap-3">
                      {coupon.min_order_amount > 0 && (
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 tracking-tight">Min Order</p>
                          <p className="text-xs font-bold text-slate-700">{formatCurrency(coupon.min_order_amount)}</p>
                        </div>
                      )}
                      {coupon.expires_at && (
                        <div className="space-y-0.5 text-right">
                          <p className="text-[10px] font-bold text-slate-400 tracking-tight">Valid Until</p>
                          <p className={cn(
                            "text-xs font-bold",
                            isExpiringSoon ? "text-red-500" : "text-slate-700"
                          )}>
                            {new Date(coupon.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Decorative Ticket Notch Overlay */}
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-slate-50/50 rounded-full blur-sm pointer-events-none opacity-50" />
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-slate-50/50 rounded-full blur-sm pointer-events-none opacity-50" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-px w-20 bg-slate-200" />
            <p className="text-xs font-semibold text-slate-400 tracking-wide max-w-xs leading-relaxed">
              Apply these codes in your cart summary to claim your special rewards
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
