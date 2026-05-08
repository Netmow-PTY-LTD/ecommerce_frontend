'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import AdminLayout from '@/components/admin/admin-layout';
import {
  ShoppingCart,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Package,
  ArrowUp,
  ArrowDown,
  BarChart3,
} from 'lucide-react';

interface SalesTrend {
  period: string;
  total_orders: number;
  net_sales: number;
  cancelled_orders: number;
  discounts: number;
  shipping: number;
  avg_order_value: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
  amount: number;
}

interface PaymentStatusBreakdown {
  payment_status: string;
  count: number;
  amount: number;
}

interface PeriodComparison {
  current: {
    orders: number;
    revenue: number;
    avg_order_value: number;
    unique_customers: number;
  };
  previous: {
    orders: number;
    revenue: number;
    avg_order_value: number;
    unique_customers: number;
  };
  growth: {
    orders: number;
    revenue: number;
    avg_order_value: number;
    unique_customers: number;
  };
}

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  processing: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Package },
  shipped: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Truck },
  delivered: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  confirmed: { bg: 'bg-purple-100', text: 'text-purple-700', icon: CheckCircle2 },
};

const paymentStatusColors: Record<string, { bg: string; text: string; icon: any }> = {
  paid: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
  partially_paid: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  unpaid: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  refunded: { bg: 'bg-slate-100', text: 'text-slate-600', icon: RefreshCw },
};

export default function OrderAnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { formatCurrency } = useCurrency();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [granularity, setGranularity] = useState('daily');

  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [paymentStatusBreakdown, setPaymentStatusBreakdown] = useState<PaymentStatusBreakdown[]>([]);
  const [periodComparison, setPeriodComparison] = useState<PeriodComparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/admin/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) fetchAll();
  }, [isAuthenticated, startDate, endDate, granularity]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [trendsRes, comparisonRes] = await Promise.all([
        api.get('/reports/sales/trends', {
          params: {
            start_date: startDate,
            end_date: endDate,
            granularity
          }
        }),
        api.get('/reports/sales/period-comparison', {
          params: {
            start_date: startDate,
            end_date: endDate
          }
        })
      ]);

      const trendsData = trendsRes.data?.data || [];

      setSalesTrends(trendsData);

      // Extract status breakdown from trends or fetch separately
      if (comparisonRes.data?.data) {
        setPeriodComparison(comparisonRes.data.data);

        // Also fetch the sales summary to get status breakdown
        const summaryRes = await api.get('/reports/sales/summary', {
          params: {
            start_date: startDate,
            end_date: endDate
          }
        });

        setStatusBreakdown(summaryRes.data?.data?.status_breakdown || []);
        setPaymentStatusBreakdown(summaryRes.data?.data?.payment_status_breakdown || []);
      }
    } catch (err) {
      console.error('Failed to fetch order analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  const totalOrders = statusBreakdown.reduce((sum, s) => sum + s.count, 0);
  const maxTrendOrders = Math.max(...salesTrends.map(t => t.total_orders), 1);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Order Analytics</h1>
            <p className="text-slate-500 mt-1 text-sm">Order trends, status distribution, and period comparisons</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl shadow-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={granularity}
              onChange={e => setGranularity(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <button
            onClick={fetchAll}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Period Comparison Stats */}
        {periodComparison && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-600">Total Orders</p>
                <ShoppingCart size={18} className="text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{periodComparison.current.orders}</p>
              <div className="flex items-center gap-1 mt-2">
                {periodComparison.growth.orders >= 0 ? (
                  <ArrowUp size={14} className="text-green-600" />
                ) : (
                  <ArrowDown size={14} className="text-red-600" />
                )}
                <span className={`text-sm font-medium ${periodComparison.growth.orders >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(periodComparison.growth.orders).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-600">Revenue</p>
                <TrendingUp size={18} className="text-green-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(periodComparison.current.revenue)}</p>
              <div className="flex items-center gap-1 mt-2">
                {periodComparison.growth.revenue >= 0 ? (
                  <ArrowUp size={14} className="text-green-600" />
                ) : (
                  <ArrowDown size={14} className="text-red-600" />
                )}
                <span className={`text-sm font-medium ${periodComparison.growth.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(periodComparison.growth.revenue).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-600">Avg Order Value</p>
                <BarChart3 size={18} className="text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(periodComparison.current.avg_order_value)}</p>
              <div className="flex items-center gap-1 mt-2">
                {periodComparison.growth.avg_order_value >= 0 ? (
                  <ArrowUp size={14} className="text-green-600" />
                ) : (
                  <ArrowDown size={14} className="text-red-600" />
                )}
                <span className={`text-sm font-medium ${periodComparison.growth.avg_order_value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(periodComparison.growth.avg_order_value).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-600">Unique Customers</p>
                <Package size={18} className="text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{periodComparison.current.unique_customers}</p>
              <div className="flex items-center gap-1 mt-2">
                {periodComparison.growth.unique_customers >= 0 ? (
                  <ArrowUp size={14} className="text-green-600" />
                ) : (
                  <ArrowDown size={14} className="text-red-600" />
                )}
                <span className={`text-sm font-medium ${periodComparison.growth.unique_customers >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(periodComparison.growth.unique_customers).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Trends */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Trends</h3>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : salesTrends.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No order data</p>
            ) : (
              <div className="space-y-3">
                {salesTrends.map((trend, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-500 w-24 shrink-0">{trend.period}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${(trend.total_orders / maxTrendOrders) * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-700 w-8 text-right">{trend.total_orders}</span>
                      <span className="text-slate-500 text-xs w-16 text-right">{formatCurrency(Number(trend.net_sales))}</span>
                    </div>
                    {trend.cancelled_orders > 0 && (
                      <div className="flex items-center gap-3 text-xs pl-[136px]">
                        <span className="text-red-500">{trend.cancelled_orders} cancelled</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Status Distribution</h3>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : statusBreakdown.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No data</p>
            ) : (
              <div className="space-y-3">
                {statusBreakdown.map((item) => {
                  const status = item.status;
                  const styling = statusColors[status] || { bg: 'bg-slate-100', text: 'text-slate-600', icon: ShoppingCart };
                  const Icon = styling.icon;
                  const pct = totalOrders > 0 ? ((item.count / totalOrders) * 100).toFixed(1) : '0';
                  return (
                    <div key={status} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                      <div className={`p-2 rounded-lg ${styling.bg} ${styling.text}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 capitalize">{status}</p>
                        <div className="mt-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{item.count}</p>
                        <p className="text-xs text-slate-500">{pct}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Payment Status Distribution */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Status Distribution</h3>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : paymentStatusBreakdown.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No data</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {paymentStatusBreakdown.map((item) => {
                const status = item.payment_status;
                const styling = paymentStatusColors[status] || { bg: 'bg-slate-100', text: 'text-slate-600', icon: CheckCircle2 };
                const Icon = styling.icon;
                return (
                  <div key={status} className="p-4 rounded-xl bg-slate-50 text-center">
                    <div className={`inline-flex p-3 rounded-xl ${styling.bg} ${styling.text} mb-3`}>
                      <Icon size={24} />
                    </div>
                    <p className="text-sm font-medium text-slate-600 capitalize">{status.replace('_', ' ')}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{item.count}</p>
                    <p className="text-sm text-green-600">{formatCurrency(Number(item.amount))}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
