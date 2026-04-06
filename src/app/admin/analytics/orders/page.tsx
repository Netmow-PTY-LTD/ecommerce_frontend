'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
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
} from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-slate-100 text-slate-600',
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
  refunded: TrendingUp,
};

export default function OrderAnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [period, setPeriod] = useState('30d');
  const [orderTrends, setOrderTrends] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<any>(null);
  const [avgOrderValue, setAvgOrderValue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/admin/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) fetchAll();
  }, [isAuthenticated, period]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [trendsRes, statusRes, funnelRes, avgRes] = await Promise.all([
        api.get('/analytics/order-trends', { params: { period } }),
        api.get('/analytics/order-status-distribution'),
        api.get('/analytics/conversion-funnel', { params: { period } }),
        api.get('/analytics/avg-order-value', { params: { period } }),
      ]);
      setOrderTrends(trendsRes.data?.data || []);
      setStatusDistribution(statusRes.data?.data || []);
      setConversionFunnel(funnelRes.data?.data);
      setAvgOrderValue(avgRes.data?.data);
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

  const totalOrders = statusDistribution.reduce((sum, s) => sum + Number(s.count || (s as any).dataValues?.count || 0), 0);
  const maxTrendOrders = Math.max(...orderTrends.map(t => Number(t.orders || 0)), 1);

  return (
    <AdminLayout title="Order Analytics" subtitle="Order trends, status distribution, and fulfillment funnel">
      <div className="w-full">
        {/* Controls */}
        <div className="flex items-center gap-3 mb-6">
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500">
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button onClick={fetchAll} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Orders</p>
                <p className="text-2xl font-bold text-slate-900">{totalOrders}</p>
              </div>
              <div className="bg-blue-600 p-3 rounded-xl text-white"><ShoppingCart size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-indigo-600">${Number(avgOrderValue?.avg_value || 0).toFixed(2)}</p>
              </div>
              <div className="bg-indigo-600 p-3 rounded-xl text-white"><TrendingUp size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Min / Max Order</p>
                <p className="text-lg font-bold text-slate-900">
                  ${Number(avgOrderValue?.min_value || 0).toFixed(0)} / ${Number(avgOrderValue?.max_value || 0).toFixed(0)}
                </p>
              </div>
              <div className="bg-amber-600 p-3 rounded-xl text-white"><Package size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Paid Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {conversionFunnel?.orders > 0
                    ? ((conversionFunnel.paid / conversionFunnel.orders) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div className="bg-green-600 p-3 rounded-xl text-white"><CheckCircle2 size={20} /></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Order Trends */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Trends</h3>
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
            ) : orderTrends.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No order data</p>
            ) : (
              <div className="space-y-2">
                {orderTrends.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-24 shrink-0">{item.date}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${(Number(item.orders || 0) / maxTrendOrders) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700 w-8 text-right">{item.orders}</span>
                    <span className="text-xs text-slate-400 w-20 text-right">${Number(item.revenue || 0).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Status Distribution</h3>
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
            ) : statusDistribution.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No data</p>
            ) : (
              <div className="space-y-3">
                {statusDistribution.map((item) => {
                  const status = item.status || (item as any).dataValues?.status;
                  const count = Number(item.count || (item as any).dataValues?.count || 0);
                  const Icon = statusIcons[status] || ShoppingCart;
                  const colorClass = statusColors[status] || 'bg-slate-100 text-slate-700';
                  const pct = totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(1) : 0;
                  return (
                    <div key={status} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 capitalize">{status}</p>
                        <div className="mt-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{count}</p>
                        <p className="text-xs text-slate-500">{pct}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Funnel</h3>
          {conversionFunnel ? (
            <div className="flex items-center justify-center gap-4 py-4">
              {[
                { label: 'Total Orders', value: conversionFunnel.orders, color: 'bg-blue-500' },
                { label: 'Paid', value: conversionFunnel.paid, color: 'bg-green-500' },
                { label: 'Delivered', value: conversionFunnel.delivered, color: 'bg-emerald-500' },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="text-center">
                    <div className={`w-24 h-24 rounded-2xl ${step.color} flex items-center justify-center text-white`}>
                      <span className="text-2xl font-bold">{step.value}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 mt-2">{step.label}</p>
                  </div>
                  {idx < 2 && (
                    <div className="text-slate-300 text-2xl">&rarr;</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No funnel data</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
