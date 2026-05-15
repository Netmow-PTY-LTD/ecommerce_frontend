'use client';

import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ShoppingBag, Heart, User, Package, Clock,
  CheckCircle, ArrowRight, TrendingUp, DollarSign, Activity, CreditCard,
  Sparkles, Mail, Tag, Percent, Gift, Truck
} from 'lucide-react';
import Link from 'next/link';
import { useWishlistStore } from '@/lib/store';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useActiveCoupons, useActiveFlashSales } from '@/hooks/use-pricing';
import api from '@/lib/api';
import CustomerLayout from '@/components/customer/customer-layout';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function CustomerDashboard() {
  const { customer, loading, isAuthenticated } = useCustomerAuth();
  const router = useRouter();
  const wishlistItems = useWishlistStore((state) => state.items);
  const { formatCurrency } = useCurrency();
  const { coupons, isLoading: loadingCoupons } = useActiveCoupons();
  const { flashSales, isLoading: loadingFlashSales } = useActiveFlashSales();
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalSpent: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && customer) {
      fetchOrderStats();
    }
  }, [isAuthenticated, customer]);

  const fetchOrderStats = async () => {
    try {
      setLoadingStats(true);
      const response = await api.get('/sales/customer/orders');
      if (response.data && response.data.data) {
        const orders = response.data.data;
        const totalOrders = orders.length;
        const pendingOrders = orders.filter((o: any) => o.status === 'pending' || o.status === 'processing').length;
        const deliveredOrders = orders.filter((o: any) => o.status === 'delivered').length;
        const totalSpent = orders
          .filter((o: any) => o.status !== 'cancelled')
          .reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || 0), 0);

        setOrderStats({
          totalOrders,
          pendingOrders,
          deliveredOrders,
          totalSpent
        });
      }
    } catch (error) {
      console.error('Failed to fetch order stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  const getCouponIcon = (type: string) => {
    switch (type) {
      case 'percentage': return Percent;
      case 'fixed': return DollarSign;
      case 'free_shipping': return Truck;
      case 'bogo': return Gift;
      default: return Tag;
    }
  };

  const getCouponDiscountLabel = (coupon: any) => {
    if (coupon.type === 'percentage') return `${coupon.value}% OFF`;
    if (coupon.type === 'fixed') return `${formatCurrency(coupon.value)} OFF`;
    if (coupon.type === 'free_shipping') return 'FREE SHIPPING';
    if (coupon.type === 'bogo') return 'BUY 1 GET 1 FREE';
    return 'DISCOUNT';
  };

  if (loading || !isAuthenticated || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600"></div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Orders',
      value: orderStats.totalOrders,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      description: 'Orders placed so far'
    },
    {
      label: 'Total Spent',
      value: formatCurrency(orderStats.totalSpent),
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      description: 'Lifetime expenditure'
    },
    {
      label: 'Wishlist',
      value: wishlistItems.length,
      icon: Heart,
      color: 'from-rose-500 to-rose-600',
      description: 'Items you love'
    },
    {
      label: 'Delivered',
      value: orderStats.deliveredOrders,
      icon: CheckCircle,
      color: 'from-indigo-500 to-indigo-600',
      description: 'Successful deliveries'
    }
  ];

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, idx) => (
          <div key={idx} className={cn(
            "bg-gradient-to-br shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-100",
            stat.color
          )}>
            <div className="p-6 text-white relative overflow-hidden group">
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-black">{loadingStats ? '...' : stat.value}</h3>
                  <p className="text-white/60 text-[10px] mt-1 font-medium italic">{stat.description}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
              {/* Decorative circle */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            </div>
          </div>
        ))}
      </div>

      {/* Special Offers Section - Coupons & Flash Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Active Coupons */}
        {(coupons.length > 0 || loadingCoupons) && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-3xl p-8 shadow-sm border border-purple-100 dark:border-purple-900">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Your Coupons</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Exclusive discounts just for you</p>
              </div>
            </div>

            {loadingCoupons ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white/60 dark:bg-slate-800/60 rounded-2xl p-4 animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : coupons.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No active coupons available right now.</p>
            ) : (
              <div className="space-y-3">
                {coupons.slice(0, 3).map((coupon: any) => {
                  const Icon = getCouponIcon(coupon.type);
                  return (
                    <div key={coupon.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-4 w-4 text-purple-600" />
                            <span className="font-bold text-slate-900 dark:text-slate-100">{getCouponDiscountLabel(coupon)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded">{coupon.code}</code>
                            {copiedCoupon === coupon.code && (
                              <span className="text-xs text-green-600 dark:text-green-400">Copied!</span>
                            )}
                          </div>
                          {coupon.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{coupon.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => copyCouponCode(coupon.code)}
                          className="shrink-0 p-2 bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800 text-purple-600 dark:text-purple-400 rounded-xl transition-colors"
                          title="Copy code"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {coupons.length > 3 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2">
                    +{coupons.length - 3} more coupons available
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Active Flash Sales */}
        {(flashSales.length > 0 || loadingFlashSales) && (
          <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-3xl p-8 shadow-sm border border-red-100 dark:border-red-900">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Flash Sales</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Limited time offers - Act fast!</p>
              </div>
            </div>

            {loadingFlashSales ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white/60 dark:bg-slate-800/60 rounded-2xl p-4 animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : flashSales.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No active flash sales right now.</p>
            ) : (
              <div className="space-y-3">
                {flashSales.slice(0, 3).map((sale: any) => (
                  <Link
                    key={sale.id}
                    href={`/flash-sale/${sale.slug || sale.id}`}
                    className="block bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{sale.name}</h3>
                        {sale.discount_percentage && (
                          <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
                            Up to {sale.discount_percentage}% OFF
                          </span>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Ends: {new Date(sale.ends_at).toLocaleDateString()}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </Link>
                ))}
                {flashSales.length > 3 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2">
                    +{flashSales.length - 3} more flash sales
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity / Profile */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Links / Actions */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/customer/orders" className="group flex items-center justify-between p-5 bg-slate-50 hover:bg-indigo-600 rounded-2xl transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Package className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-white transition-colors">Track Orders</h3>
                      <p className="text-xs text-slate-500 group-hover:text-white/70 transition-colors">Check your order status</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </Link>

                <Link href="/customer/profile" className="group flex items-center justify-between p-5 bg-slate-50 hover:bg-indigo-600 rounded-2xl transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <User className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-white transition-colors">Edit Profile</h3>
                      <p className="text-xs text-slate-500 group-hover:text-white/70 transition-colors">Update your information</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </Link>

                <Link href="/wishlist" className="group flex items-center justify-between p-5 bg-slate-50 hover:bg-indigo-600 rounded-2xl transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Heart className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-white transition-colors">Your Wishlist</h3>
                      <p className="text-xs text-slate-500 group-hover:text-white/70 transition-colors">See what you've saved</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </Link>

              </div>
            </div>
          </div>

          {/* Account Details Summary */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Account Summary</h2>
              </div>
              <Link href="/customer/orders" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                View All Orders
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</p>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-bold text-slate-700">Active</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Orders</p>
                <p className="text-sm font-bold text-slate-700">{orderStats.totalOrders}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending</p>
                <p className="text-sm font-bold text-slate-700">{orderStats.pendingOrders}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer since</p>
                <p className="text-sm font-bold text-slate-700">2024</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Card Sidebar Style */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-slate-50 shadow-lg shadow-slate-100">
                {customer?.image_url && (
                  <AvatarImage
                    src={customer.image_url.startsWith('http') ? customer.image_url : `${process.env.NEXT_PUBLIC_API_URL}${customer.image_url}`}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="bg-indigo-600 text-white text-2xl font-black">
                  {customer.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{customer.name}</h3>
              <p className="text-sm text-slate-500 font-medium">{customer.email}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                {customer.customer_type} account
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Email</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{customer.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <CreditCard className="h-4 w-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Phone</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{customer.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            <button className="w-full mt-6 py-3 rounded-2xl text-xs font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all uppercase tracking-widest cursor-pointer">
              Manage Account
            </button>
          </div>

          {/* Support / Help Card */}
          {/* <div className="bg-indigo-600 rounded-3xl p-8 shadow-xl shadow-indigo-100 text-white relative overflow-hidden group">
                <div className="relative z-10">
                    <h3 className="text-lg font-bold mb-2">Need help?</h3>
                    <p className="text-indigo-100 text-xs mb-6 font-medium leading-relaxed">Our support team is available 24/7 to assist you with your orders.</p>
                    <button className="px-5 py-2.5 bg-white text-indigo-600 text-xs font-bold rounded-xl shadow-lg hover:scale-105 transition-transform active:scale-95 cursor-pointer">
                        Contact Support
                    </button>
                </div>
                <Sparkles className="absolute -top-6 -right-6 h-24 w-24 text-white/10 rotate-12 group-hover:scale-125 transition-transform duration-500" />
            </div> */}
        </div>
      </div>
    </>
  );
}
