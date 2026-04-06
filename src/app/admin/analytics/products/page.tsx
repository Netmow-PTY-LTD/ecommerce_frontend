'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/admin-layout';
import Image from 'next/image';
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  BarChart3,
} from 'lucide-react';

export default function ProductAnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [period, setPeriod] = useState('30d');
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [worstProducts, setWorstProducts] = useState<any[]>([]);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [inventoryValuation, setInventoryValuation] = useState<any>(null);
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
      const [topRes, worstRes, stockRes, invRes] = await Promise.all([
        api.get('/analytics/top-products', { params: { period, limit: 10 } }),
        api.get('/analytics/worst-products', { params: { limit: 10 } }),
        api.get('/analytics/stock-alerts'),
        api.get('/analytics/inventory-valuation'),
      ]);
      setTopProducts(topRes.data?.data || []);
      setWorstProducts(worstRes.data?.data || []);
      setStockAlerts(stockRes.data?.data || []);
      setInventoryValuation(invRes.data?.data);
    } catch (err) {
      console.error('Failed to fetch product analytics:', err);
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

  return (
    <AdminLayout title="Product Analytics" subtitle="Best sellers, worst performers, stock alerts, and inventory valuation">
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
                <p className="text-sm font-medium text-slate-600">Inventory Value</p>
                <p className="text-2xl font-bold text-green-600">${Number(inventoryValuation?.total_value || 0).toFixed(2)}</p>
              </div>
              <div className="bg-green-600 p-3 rounded-xl text-white"><DollarSign size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Products</p>
                <p className="text-2xl font-bold text-slate-900">{inventoryValuation?.total_products || 0}</p>
              </div>
              <div className="bg-blue-600 p-3 rounded-xl text-white"><Package size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Stock Units</p>
                <p className="text-2xl font-bold text-slate-900">{inventoryValuation?.total_stock || 0}</p>
              </div>
              <div className="bg-indigo-600 p-3 rounded-xl text-white"><BarChart3 size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-red-600">{stockAlerts.length}</p>
              </div>
              <div className="bg-red-600 p-3 rounded-xl text-white"><AlertTriangle size={20} /></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Products */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-green-600" />
              <h3 className="text-lg font-semibold text-slate-900">Best Sellers</h3>
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
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
                        <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-slate-300" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">SKU: {p.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">${Number(p.total_revenue).toFixed(2)}</p>
                      <p className="text-xs text-slate-500">{p.total_sold} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Worst Products */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={18} className="text-red-600" />
              <h3 className="text-lg font-semibold text-slate-900">Worst Performers</h3>
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
            ) : worstProducts.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No data</p>
            ) : (
              <div className="space-y-3">
                {worstProducts.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <span className="text-sm font-bold text-slate-400 w-6">#{idx + 1}</span>
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0">
                      {p.image_url ? (
                        <Image src={p.image_url} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-slate-300" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">Stock: {p.stock_quantity} | ${Number(p.price).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">{p.total_sold} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-600" />
            <h3 className="text-lg font-semibold text-slate-900">Low Stock Alerts</h3>
          </div>
          {stockAlerts.length === 0 ? (
            <p className="text-center text-slate-500 py-8">All products are well stocked</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-gradient-to-r from-red-50 to-amber-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Current Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Min Level</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stockAlerts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 font-mono">{p.sku}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-red-600">{p.stock_quantity}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{p.min_stock_level || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">${Number(p.price).toFixed(2)}</td>
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
