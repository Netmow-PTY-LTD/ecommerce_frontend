'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/lib/api';
import AdminLayout from '@/components/admin/admin-layout';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  totalImages: number;
}

interface Order {
  payment_status: string;
  total_amount?: number;
  total?: number;
}

export default function AdminDashboardPage() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    totalImages: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);

      // Fetch all stats in parallel for better performance
      const [
        productsRes,
        customersRes,
        imagesRes,
        summaryRes
      ] = await Promise.all([
        api.get('/products?limit=1', { skipAuthRedirect: true }).catch(() => ({ data: { pagination: { total: 0 } } })),
        api.get('/customers?limit=1', { skipAuthRedirect: true })
          .then(res => {
            console.log('[Dashboard] Customers fetched successfully', res.data);
            return res;
          })
          .catch(err => {
            console.error('[Dashboard] Customers fetch failed', err.response?.status, err.response?.data);
            return { data: { pagination: { total: 0 } } };
          }),
        api.get('/gallery?limit=1', { skipAuthRedirect: true }).catch(() => ({ data: { pagination: { total: 0 } } })),
        api.get('/reports/sales/summary', { skipAuthRedirect: true }).catch(() => ({ data: { data: { summary: { total_orders: 0, net_sales: 0 } } } }))
      ]);

      const summary = summaryRes.data?.data?.summary || summaryRes.data?.data || {};

      setStats({
        totalProducts: productsRes.data?.pagination?.total || 0,
        totalOrders: summary.total_orders || 0,
        totalCustomers: customersRes.data?.pagination?.total || 0,
        totalRevenue: summary.net_sales || 0,
        totalImages: imagesRes.data?.pagination?.total || 0,
      });
    } catch (error: unknown) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="w-full">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
              <p className="text-slate-500 mt-1 text-sm">Welcome back! Here's what's happening with your store today.</p>
            </div>
          </div>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Products */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-white/20 rounded-lg p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-indigo-100 truncate">Total Products</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl 2xl:text-3xl font-semibold text-white">{stats.totalProducts}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-white/20 rounded-lg p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-green-100 truncate">Total Orders</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl 2xl:text-3xl font-semibold text-white">{stats.totalOrders}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Customers */}
          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-white/20 rounded-lg p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-yellow-100 truncate">Total Customers</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl 2xl:text-3xl font-semibold text-white">{stats.totalCustomers}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-white/20 rounded-lg p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-blue-100 truncate">Total Revenue</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl 2xl:text-3xl font-semibold text-white">{formatCurrency(stats.totalRevenue)}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/admin/orders" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <h3 className="text-sm font-medium text-gray-900">Manage Orders</h3>
                <p className="text-sm text-gray-500 mt-1">View and manage orders</p>
              </Link>
              <a href="/admin/products" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <h3 className="text-sm font-medium text-gray-900">Manage Products</h3>
                <p className="text-sm text-gray-500 mt-1">Add, edit, or remove products</p>
              </a>
              <a href="/admin/customers" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <h3 className="text-sm font-medium text-gray-900">Manage Customers</h3>
                <p className="text-sm text-gray-500 mt-1">View and manage customer data</p>
              </a>
              <a href="/admin/settings" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <h3 className="text-sm font-medium text-gray-900">Settings</h3>
                <p className="text-sm text-gray-500 mt-1">Configure your store settings</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
