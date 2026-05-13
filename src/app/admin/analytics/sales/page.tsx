'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import AdminLayout from '@/components/admin/admin-layout';
import Image from 'next/image';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  RefreshCw,
  Calendar,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Package,
  Users,
  CreditCard,
  PieChart,
} from 'lucide-react';

interface SalesSummary {
  total_orders: number;
  cancelled_orders: number;
  gross_sales: number;
  net_sales: number;
  average_order_value: number;
  total_tax: number;
  total_discount: number;
  total_shipping: number;
  paid_orders: number;
  paid_amount: number;
  previous_period?: {
    summary: {
      net_sales: number;
      total_orders: number;
      gross_sales: number;
    };
  };
}

interface SalesTrend {
  period: string;
  total_orders: number;
  cancelled_orders: number;
  gross_sales: number;
  net_sales: number;
  discounts: number;
  shipping: number;
  avg_order_value: number;
}

interface TopProduct {
  id: number;
  name: string;
  sku: string;
  total_quantity_sold: number;
  total_revenue: number;
  image_url?: string;
}

interface TopCustomer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  order_count: number;
  total_spent: number;
}

export default function SalesAnalyticsPage() {
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

  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
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
      const [summaryRes, trendsRes, productsRes, customersRes] = await Promise.all([
        api.get('/reports/sales/summary', {
          params: {
            start_date: startDate,
            end_date: endDate,
            include_previous: 'true'
          }
        }),
        api.get('/reports/sales/trends', {
          params: {
            start_date: startDate,
            end_date: endDate,
            granularity
          }
        }),
        api.get('/reports/sales/top-products', {
          params: {
            startDate,
            endDate,
            limit: 10
          }
        }),
        api.get('/reports/sales/top-customers', {
          params: {
            startDate,
            endDate,
            limit: 10
          }
        })
      ]);

      setSalesSummary(summaryRes.data?.data?.summary || null);
      setSalesTrends(trendsRes.data?.data || []);
      setTopProducts(productsRes.data?.data || []);
      setTopCustomers(customersRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch sales analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const isDataLoading = loading || authLoading;

  if (!authLoading && !isAuthenticated) return null;

  const growthPct = salesSummary?.previous_period?.summary
    ? ((salesSummary.net_sales - salesSummary.previous_period.summary.net_sales) /
       Math.max(1, Math.abs(salesSummary.previous_period.summary.net_sales))) * 100
    : 0;

  const StatsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 animate-pulse">
          <div className="flex justify-between mb-3">
            <div className="h-4 w-20 bg-slate-100 rounded" />
            <div className="h-8 w-8 bg-slate-50 rounded-lg" />
          </div>
          <div className="h-8 w-32 bg-slate-100 rounded mb-3" />
          <div className="h-4 w-24 bg-slate-50 rounded" />
        </div>
      ))}
    </div>
  );

  const ListSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 animate-pulse">
          <div className="w-10 h-10 rounded-lg bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-slate-100 rounded" />
            <div className="h-3 w-20 bg-slate-100 rounded" />
          </div>
          <div className="text-right space-y-2">
            <div className="h-4 w-16 bg-slate-100 rounded ml-auto" />
            <div className="h-3 w-12 bg-slate-100 rounded ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales & Revenue Analytics</h1>
            <p className="text-slate-500 mt-1 text-sm">Comprehensive sales reports with trends and insights</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl shadow-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-500" />
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
            <select
              value={granularity}
              onChange={e => setGranularity(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <button
            onClick={fetchAll}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Stats Cards */}
        {isDataLoading ? <StatsSkeleton /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-600">Net Sales</p>
                <div className="bg-green-100 p-2 rounded-xl text-green-600">
                  <DollarSign size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(salesSummary?.net_sales || 0)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {growthPct >= 0 ? (
                  <ArrowUp size={14} className="text-green-600" />
                ) : (
                  <ArrowDown size={14} className="text-red-600" />
                )}
                <span className={`text-sm font-medium ${growthPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(growthPct).toFixed(1)}%
                </span>
                <span className="text-xs text-slate-500">vs previous</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-600">Total Orders</p>
                <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                  <ShoppingCart size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {salesSummary?.total_orders || 0}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {salesSummary?.cancelled_orders || 0} cancelled
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-600">Avg Order Value</p>
                <div className="bg-brand/10 p-2 rounded-xl text-brand">
                  <TrendingUp size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(salesSummary?.average_order_value || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Gross: {formatCurrency(salesSummary?.gross_sales || 0)}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-600">Paid Amount</p>
                <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                  <CreditCard size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(salesSummary?.paid_amount || 0)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {salesSummary?.paid_orders || 0} paid orders
              </p>
            </div>
          </div>
        )}

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <p className="text-sm font-medium text-slate-600 mb-2">Discounts</p>
            <p className="text-xl font-bold text-amber-600">
              -{formatCurrency(salesSummary?.total_discount || 0)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <p className="text-sm font-medium text-slate-600 mb-2">Shipping</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(salesSummary?.total_shipping || 0)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <p className="text-sm font-medium text-slate-600 mb-2">Tax Collected</p>
            <p className="text-xl font-bold text-brand">
              {formatCurrency(salesSummary?.total_tax || 0)}
            </p>
          </div>
        </div>

        {/* Sales Trends Chart */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Over Time</h3>
          {isDataLoading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                  <div className="flex-1 h-4 bg-slate-50 rounded-full animate-pulse" />
                  <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : salesTrends.length === 0 ? (
            <p className="text-center text-slate-500 py-12">No sales data available for the selected period</p>
          ) : (
            <div className="space-y-3">
              {salesTrends.map((trend, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-500 w-24 shrink-0">{trend.period}</span>
                    <div className="flex-1 flex items-center gap-4">
                      <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-brand h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(trend.net_sales / Math.max(...salesTrends.map(t => t.net_sales))) * 100}%`
                          }}
                        />
                      </div>
                      <span className="font-semibold text-slate-900 w-24 text-right">
                        {formatCurrency(trend.net_sales)}
                      </span>
                      <span className="text-slate-500 w-16 text-right">{trend.total_orders} orders</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-green-600" />
              <h3 className="text-lg font-semibold text-slate-900">Top Products</h3>
            </div>
            {isDataLoading ? (
              <ListSkeleton />
            ) : topProducts.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No sales data yet</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <span className="text-sm font-bold text-slate-400 w-6">#{idx + 1}</span>
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0">
                      {p.image_url ? (
                        <Image src={p.image_url} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={16} className="text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">SKU: {p.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{formatCurrency(Number(p.total_revenue))}</p>
                      <p className="text-xs text-slate-500">{p.total_quantity_sold} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Customers */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Top Customers</h3>
            </div>
            {isDataLoading ? (
              <ListSkeleton />
            ) : topCustomers.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No customer data</p>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((c, idx) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <span className="text-sm font-bold text-slate-400 w-6">#{idx + 1}</span>
                    <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {(c.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                      <p className="text-xs text-slate-500 truncate">{c.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{formatCurrency(Number(c.total_spent))}</p>
                      <p className="text-xs text-slate-500">{c.order_count} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
