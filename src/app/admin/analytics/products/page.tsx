'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
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
  Warehouse,
  Scale,
} from 'lucide-react';

interface ProductAnalytics {
  id: number;
  name: string;
  sku: string;
  total_quantity_sold: number;
  total_revenue: number;
  image_url?: string;
}

interface InventoryStatus {
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  healthy_stock_count: number;
  total_inventory_value: number;
  total_retail_value: number;
  potential_profit_margin: number;
}

interface InventoryValuation {
  category: string;
  product_count: number;
  total_units: number;
  total_cost_value: number;
  total_retail_value: number;
  potential_profit: number;
  profit_margin: number;
}

interface LowStockItem {
  id: number;
  sku: string;
  product: string;
  stock: number;
  minLevel: number;
  urgency_level: string;
  stock_value: number;
}

export default function ProductAnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { formatCurrency } = useCurrency();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [topProducts, setTopProducts] = useState<ProductAnalytics[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus | null>(null);
  const [inventoryValuation, setInventoryValuation] = useState<InventoryValuation[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
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
      const [topRes, statusRes, valuationRes, lowStockRes] = await Promise.all([
        api.get('/reports/sales/top-products', {
          params: { startDate, endDate, limit: 10 }
        }),
        api.get('/reports/inventory/status'),
        api.get('/reports/inventory/valuation'),
        api.get('/reports/inventory/low-stock-list', {
          params: { page: 1, limit: 20 }
        })
      ]);

      setTopProducts(topRes.data?.data || []);
      setInventoryStatus(statusRes.data?.data);
      setInventoryValuation(valuationRes.data?.data || []);
      setLowStock(lowStockRes.data?.data?.rows || []);
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

  const urgencyColors: Record<string, { bg: string; text: string; border: string }> = {
    'Out of Stock': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    'Critical': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'Low Stock': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Analytics</h1>
            <p className="text-slate-500 mt-1 text-sm">Inventory status, valuation, and performance metrics</p>
          </div>
        </div>

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">Inventory Value</p>
              <div className="bg-green-100 p-2 rounded-xl text-green-600">
                <DollarSign size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(inventoryStatus?.total_inventory_value || 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">At cost</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">Retail Value</p>
              <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                <BarChart3 size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(inventoryStatus?.total_retail_value || 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">At selling price</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">Total Products</p>
              <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                <Package size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {inventoryStatus?.total_products || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {inventoryStatus?.healthy_stock_count || 0} healthy
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">Low Stock</p>
              <div className="bg-red-100 p-2 rounded-xl text-red-600">
                <AlertTriangle size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {inventoryStatus?.low_stock_count || 0}
            </p>
            <p className="text-xs text-red-600 mt-1">
              {inventoryStatus?.out_of_stock_count || 0} out of stock
            </p>
          </div>
        </div>

        {/* Potential Profit */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Potential Profit Margin</p>
              <p className="text-3xl font-bold">{inventoryStatus?.potential_profit_margin.toFixed(1) || 0}%</p>
              <p className="text-sm opacity-80 mt-1">
                {formatCurrency(inventoryStatus?.total_retail_value || 0)} retail - {formatCurrency(inventoryStatus?.total_inventory_value || 0)} cost
              </p>
            </div>
            <div className="p-4 bg-white/20 rounded-2xl">
              <Scale size={48} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-green-600" />
              <h3 className="text-lg font-semibold text-slate-900">Best Sellers</h3>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
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

          {/* Inventory Valuation by Category */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Warehouse size={18} className="text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-900">Inventory by Category</h3>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : inventoryValuation.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No inventory data</p>
            ) : (
              <div className="space-y-3">
                {inventoryValuation.map((cat, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{cat.category}</p>
                        <p className="text-xs text-slate-500">{cat.product_count} products • {cat.total_units} units</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">{formatCurrency(Number(cat.total_cost_value))}</p>
                        <p className="text-xs text-slate-500">cost value</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                          style={{ width: `${Math.min(cat.profit_margin, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${cat.profit_margin >= 30 ? 'text-green-600' : cat.profit_margin >= 15 ? 'text-amber-600' : 'text-red-600'}`}>
                        {cat.profit_margin.toFixed(1)}% margin
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-600" />
              <h3 className="text-lg font-semibold text-slate-900">Low Stock Alerts</h3>
            </div>
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
              {lowStock.length} items need attention
            </span>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-center text-slate-500 py-8">All products are well stocked</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">SKU</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Current Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Min Level</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Stock Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {lowStock.map((item) => {
                    const urgency = urgencyColors[item.urgency_level] || urgencyColors['Low Stock'];
                    return (
                      <tr key={item.id} className={`hover:bg-slate-50 border-l-4 ${urgency.border}`}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.product}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 font-mono">{item.sku}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={`font-bold ${item.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                            {item.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 text-right">{item.minLevel || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${urgency.bg} ${urgency.text}`}>
                            {item.urgency_level}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 text-right">
                          {formatCurrency(item.stock_value)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
