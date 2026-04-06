'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/admin-layout';
import {
  Users,
  UserPlus,
  UserCheck,
  Repeat,
  RefreshCw,
  Mail,
  Phone,
} from 'lucide-react';

export default function CustomerAnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [period, setPeriod] = useState('30d');
  const [customerStats, setCustomerStats] = useState<any>(null);
  const [customerGrowth, setCustomerGrowth] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
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
      const [statsRes, growthRes, topRes] = await Promise.all([
        api.get('/analytics/customer-stats'),
        api.get('/analytics/customer-growth', { params: { period } }),
        api.get('/analytics/top-customers', { params: { period, limit: 10 } }),
      ]);
      setCustomerStats(statsRes.data?.data);
      setCustomerGrowth(growthRes.data?.data || []);
      setTopCustomers(topRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch customer analytics:', err);
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

  const maxGrowth = Math.max(...customerGrowth.map(c => Number(c.new_customers || 0)), 1);
  const repeatRate = customerStats?.total > 0
    ? ((customerStats.repeat / customerStats.total) * 100).toFixed(1)
    : '0';

  return (
    <AdminLayout title="Customer Analytics" subtitle="Customer growth, retention, and top spenders">
      <div className="w-full">
        {/* Controls */}
        <div className="flex items-center gap-3 mb-6">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
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
                <p className="text-sm font-medium text-slate-600">Total Customers</p>
                <p className="text-2xl font-bold text-slate-900">{customerStats?.total || 0}</p>
              </div>
              <div className="bg-blue-600 p-3 rounded-xl text-white"><Users size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{customerStats?.active || 0}</p>
              </div>
              <div className="bg-green-600 p-3 rounded-xl text-white"><UserCheck size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Repeat Customers</p>
                <p className="text-2xl font-bold text-indigo-600">{customerStats?.repeat || 0} ({repeatRate}%)</p>
              </div>
              <div className="bg-indigo-600 p-3 rounded-xl text-white"><Repeat size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">New This Month</p>
                <p className="text-2xl font-bold text-amber-600">{customerStats?.newThisMonth || 0}</p>
              </div>
              <div className="bg-amber-600 p-3 rounded-xl text-white"><UserPlus size={20} /></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Growth */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Customer Growth</h3>
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
            ) : customerGrowth.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No growth data</p>
            ) : (
              <div className="space-y-2">
                {customerGrowth.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-24 shrink-0">{item.date}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${(Number(item.new_customers || 0) / maxGrowth) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700 w-8 text-right">{item.new_customers}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Customers */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Customers</h3>
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
            ) : topCustomers.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No customer data</p>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((c, idx) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <span className="text-sm font-bold text-slate-400 w-6">#{idx + 1}</span>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {(c.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {c.email && <><Mail size={10} /> {c.email}</>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">${Number(c.total_spent).toFixed(2)}</p>
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
