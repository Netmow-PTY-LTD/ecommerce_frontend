'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import AdminLayout from '@/components/admin/admin-layout';
import {
  Users,
  UserPlus,
  UserCheck,
  Repeat,
  RefreshCw,
  Mail,
  TrendingUp,
  Award,
  Star,
  Target,
} from 'lucide-react';

interface CustomerAnalytics {
  acquisition: {
    new_customers: number;
  };
  metrics: {
    total_customers: number;
    active_customers: number;
    repeat_customers: number;
    repeat_rate: number;
    avg_customer_value: number;
    total_lifetime_value: number;
  };
  segments: Array<{
    segment: string;
    customer_count: number;
    total_revenue: number;
    avg_revenue: number;
  }>;
  cohorts: Array<{
    month: string;
    customers: number;
    purchasers: number;
    conversion_rate: number;
    revenue: number;
  }>;
}

interface CLVCustomer {
  id: number;
  name: string;
  email: string;
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  first_purchase: string;
  last_purchase: string;
  customer_lifetime_days: number;
  avg_days_between_orders: number | null;
  projected_annual_value: number;
}

export default function CustomerAnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { formatCurrency } = useCurrency();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null);
  const [topCLV, setTopCLV] = useState<CLVCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/admin/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) fetchAll();
  }, [isAuthenticated, startDate, endDate]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [analyticsRes, clvRes] = await Promise.all([
        api.get('/reports/customers/analytics', {
          params: { start_date: startDate, end_date: endDate }
        }),
        api.get('/reports/customers/lifetime-value', {
          params: { limit: 20 }
        })
      ]);

      setCustomerAnalytics(analyticsRes.data?.data);
      setTopCLV(clvRes.data?.data || []);
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

  const segmentColors: Record<string, { bg: string; text: string; icon: any }> = {
    'High Value': { bg: 'bg-green-100', text: 'text-green-700', icon: Award },
    'Medium Value': { bg: 'bg-blue-100', text: 'text-blue-700', icon: Star },
    'Low Value': { bg: 'bg-amber-100', text: 'text-amber-700', icon: Users },
    'No Purchase': { bg: 'bg-slate-100', text: 'text-slate-600', icon: UserCheck },
  };

  return (
    <AdminLayout title="Customer Analytics" subtitle="Customer segments, lifetime value, and retention metrics">
      <div className="w-full space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl shadow-xl border border-slate-200 p-4">
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
          <button
            onClick={fetchAll}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">Total Customers</p>
              <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                <Users size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {customerAnalytics?.metrics.total_customers || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {customerAnalytics?.metrics.active_customers || 0} active
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">Repeat Customers</p>
              <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                <Repeat size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {customerAnalytics?.metrics.repeat_customers || 0}
            </p>
            <p className="text-sm font-medium text-indigo-600 mt-1">
              {customerAnalytics?.metrics.repeat_rate.toFixed(1) || 0}% repeat rate
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">Avg Customer Value</p>
              <div className="bg-green-100 p-2 rounded-xl text-green-600">
                <Target size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(customerAnalytics?.metrics.avg_customer_value || 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Per customer</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">New This Period</p>
              <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                <UserPlus size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {customerAnalytics?.acquisition.new_customers || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">New customers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Segments */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Customer Segments</h3>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : customerAnalytics?.segments.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No segment data</p>
            ) : (
              <div className="space-y-3">
                {customerAnalytics?.segments.map((segment) => {
                  const styling = segmentColors[segment.segment] || segmentColors['No Purchase'];
                  const Icon = styling.icon;
                  const totalRevenue = customerAnalytics.segments.reduce((sum, s) => sum + s.total_revenue, 0);
                  const pct = totalRevenue > 0 ? (segment.total_revenue / totalRevenue) * 100 : 0;

                  return (
                    <div key={segment.segment} className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${styling.bg} ${styling.text}`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">{segment.segment}</p>
                          <p className="text-xs text-slate-500">{segment.customer_count} customers</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">{formatCurrency(Number(segment.total_revenue))}</p>
                          <p className="text-xs text-slate-500">{Number(pct).toFixed(1)}% of revenue</p>
                        </div>
                      </div>
                      <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cohort Analysis */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Acquisition Cohorts</h3>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : customerAnalytics?.cohorts.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No cohort data</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Month</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Customers</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Purchasers</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Conv. Rate</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {customerAnalytics?.cohorts.map((cohort, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{cohort.month}</td>
                        <td className="px-4 py-3 text-sm text-slate-700 text-right">{cohort.customers}</td>
                        <td className="px-4 py-3 text-sm text-slate-700 text-right">{cohort.purchasers}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            cohort.conversion_rate >= 20 ? 'bg-green-100 text-green-700' :
                            cohort.conversion_rate >= 10 ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {Number(cohort.conversion_rate).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600 font-medium text-right">
                          {formatCurrency(Number(cohort.revenue))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Customer Lifetime Value */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award size={18} className="text-amber-600" />
            <h3 className="text-lg font-semibold text-slate-900">Top Customers by Lifetime Value</h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : topCLV.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No customer data</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-gradient-to-r from-amber-50 to-orange-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Customer</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Total Orders</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Total Spent</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Avg Order</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Days Active</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Projected Annual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {topCLV.map((customer, idx) => (
                    <tr key={customer.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-amber-600">#{idx + 1}</span>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(customer.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{customer.name}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 text-right">{customer.total_orders}</td>
                      <td className="px-4 py-3 text-sm text-green-600 font-bold text-right">
                        {formatCurrency(Number(customer.total_spent))}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 text-right">
                        {formatCurrency(Number(customer.avg_order_value))}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 text-right">{customer.customer_lifetime_days}</td>
                      <td className="px-4 py-3 text-sm text-indigo-600 font-medium text-right">
                        {formatCurrency(Number(customer.projected_annual_value))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
