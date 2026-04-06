'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/admin-layout';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  RefreshCw,
  Calendar,
  BarChart3,
} from 'lucide-react';

export default function SalesAnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [period, setPeriod] = useState('30d');
  const [granularity, setGranularity] = useState('daily');
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<any[]>([]);
  const [avgOrderValue, setAvgOrderValue] = useState<any>(null);
  const [realtimeStats, setRealtimeStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/admin/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) fetchAll();
  }, [isAuthenticated, period, granularity]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [revRes, catRes, avgRes, rtRes] = await Promise.all([
        api.get('/analytics/revenue', { params: { granularity } }),
        api.get('/analytics/revenue-by-category'),
        api.get('/analytics/avg-order-value', { params: { period } }),
        api.get('/analytics/realtime'),
      ]);
      setRevenueData(revRes.data?.data || []);
      setCategoryRevenue(catRes.data?.data || []);
      setAvgOrderValue(avgRes.data?.data);
      setRealtimeStats(rtRes.data?.data);
    } catch (err) {
      console.error('Failed to fetch sales analytics:', err);
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

  const totalRevenue = revenueData.reduce((sum, r) => sum + Number(r.revenue || 0), 0);
  const totalOrders = revenueData.reduce((sum, r) => sum + Number(r.order_count || 0), 0);
  const maxRevenue = Math.max(...revenueData.map(r => Number(r.revenue || 0)), 1);

  return (
    <AdminLayout title="Sales & Revenue Analytics" subtitle="Track revenue trends, category performance, and key sales metrics">
      <div className="w-full">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
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
          <button onClick={fetchAll} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">${Number(totalRevenue).toFixed(2)}</p>
              </div>
              <div className="bg-green-600 p-3 rounded-xl text-white"><DollarSign size={20} /></div>
            </div>
          </div>
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
                <p className="text-sm font-medium text-slate-600">Today&apos;s Revenue</p>
                <p className="text-2xl font-bold text-amber-600">${Number(realtimeStats?.todayRevenue || 0).toFixed(2)}</p>
              </div>
              <div className="bg-amber-600 p-3 rounded-xl text-white"><BarChart3 size={20} /></div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Over Time</h3>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : revenueData.length === 0 ? (
            <p className="text-center text-slate-500 py-12">No revenue data available</p>
          ) : (
            <div className="space-y-2">
              {revenueData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-24 shrink-0">{item.period}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(Number(item.revenue || 0) / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-700 w-24 text-right">${Number(item.revenue || 0).toFixed(2)}</span>
                  <span className="text-xs text-slate-400 w-16 text-right">{item.order_count} orders</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue by Category */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue by Category</h3>
          {categoryRevenue.length === 0 ? (
            <p className="text-center text-slate-500 py-12">No category revenue data</p>
          ) : (
            <div className="space-y-3">
              {categoryRevenue.map((item, idx) => {
                const catMax = Number(categoryRevenue[0]?.revenue || 1);
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm text-slate-700 w-32 shrink-0 truncate">{item.category}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full flex items-center pl-3 transition-all duration-500"
                        style={{ width: `${Math.max((Number(item.revenue) / catMax) * 100, 8)}%` }}
                      >
                        <span className="text-xs font-medium text-white">${Number(item.revenue).toFixed(2)}</span>
                      </div>
                    </div>
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
