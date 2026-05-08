'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import AdminLayout from '@/components/admin/admin-layout';
import {
  TrendingUp,
  DollarSign,
  Package,
  CreditCard,
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ProfitLossData {
  revenue: {
    gross_sales: number;
    discounts: number;
    net_sales: number;
    tax_collected: number;
    shipping_collected: number;
  };
  costs: {
    cogs: number;
    shipping: number;
    payment_fees: number;
    total_costs: number;
  };
  profit: {
    gross_profit: number;
    gross_profit_margin: number;
    operating_profit: number;
    net_profit: number;
    net_profit_margin: number;
  };
  orders: {
    total_orders: number;
  };
}

interface ProductProfitability {
  id: number;
  name: string;
  sku: string;
  price: number;
  cost: number;
  units_sold: number;
  revenue: number;
  cogs: number;
  discounts: number;
  gross_profit: number;
  profit_margin: number;
  avg_price: number;
}

export default function ProfitLossPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { formatCurrency } = useCurrency();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [profitLoss, setProfitLoss] = useState<ProfitLossData | null>(null);
  const [productProfitability, setProductProfitability] = useState<ProductProfitability[]>([]);
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
      const [plRes, prodRes] = await Promise.all([
        api.get('/reports/profit-loss/summary', {
          params: { start_date: startDate, end_date: endDate }
        }),
        api.get('/reports/profit-loss/product-profitability', {
          params: { startDate, endDate, limit: 20 }
        })
      ]);

      setProfitLoss(plRes.data?.data);
      setProductProfitability(prodRes.data?.data?.rows || []);
    } catch (err) {
      console.error('Failed to fetch profit & loss data:', err);
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
    <AdminLayout title="Profit & Loss Analytics" subtitle="Track profitability, margins, and financial performance">
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
              <p className="text-sm font-medium text-slate-600">Net Sales</p>
              <DollarSign size={18} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(profitLoss?.revenue.net_sales || 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Gross: {formatCurrency(profitLoss?.revenue.gross_sales || 0)}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">Gross Profit</p>
              <TrendingUp size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(profitLoss?.profit.gross_profit || 0)}
            </p>
            <p className={`text-sm font-medium mt-1 ${(profitLoss?.profit.gross_profit_margin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitLoss?.profit.gross_profit_margin.toFixed(1) || 0}% margin
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">Operating Profit</p>
              <BarChart3 size={18} className="text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(profitLoss?.profit.operating_profit || 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">After shipping & fees</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">Net Profit</p>
              {(profitLoss?.profit.net_profit || 0) >= 0 ? (
                <CheckCircle2 size={18} className="text-green-600" />
              ) : (
                <AlertCircle size={18} className="text-red-600" />
              )}
            </div>
            <p className={`text-2xl font-bold ${(profitLoss?.profit.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profitLoss?.profit.net_profit || 0)}
            </p>
            <p className={`text-sm font-medium mt-1 ${(profitLoss?.profit.net_profit_margin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitLoss?.profit.net_profit_margin.toFixed(1) || 0}% margin
            </p>
          </div>
        </div>

        {/* Revenue & Costs Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Breakdown */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Gross Sales</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(profitLoss?.revenue.gross_sales || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Less: Discounts</span>
                <span className="text-lg font-bold text-amber-600">
                  -{formatCurrency(profitLoss?.revenue.discounts || 0)}
                </span>
              </div>
              <div className="border-t border-slate-200 my-2" />
              <div className="flex justify-between items-center p-3 bg-slate-100 rounded-xl">
                <span className="text-sm font-semibold text-slate-900">Net Sales</span>
                <span className="text-lg font-bold text-slate-900">
                  {formatCurrency(profitLoss?.revenue.net_sales || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Costs Breakdown */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Costs Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">COGS</span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(profitLoss?.costs.cogs || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Shipping</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(profitLoss?.costs.shipping || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl">
                <span className="text-sm font-medium text-slate-700">Payment Fees</span>
                <span className="text-lg font-bold text-purple-600">
                  {formatCurrency(profitLoss?.costs.payment_fees || 0)}
                </span>
              </div>
              <div className="border-t border-slate-200 my-2" />
              <div className="flex justify-between items-center p-3 bg-slate-100 rounded-xl">
                <span className="text-sm font-semibold text-slate-900">Total Costs</span>
                <span className="text-lg font-bold text-slate-900">
                  {formatCurrency(profitLoss?.costs.total_costs || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profit Summary */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Profit Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm opacity-80">Gross Profit</p>
              <p className="text-2xl font-bold">{formatCurrency(profitLoss?.profit.gross_profit || 0)}</p>
              <p className="text-sm opacity-80">{profitLoss?.profit.gross_profit_margin.toFixed(1) || 0}% margin</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Operating Profit</p>
              <p className="text-2xl font-bold">{formatCurrency(profitLoss?.profit.operating_profit || 0)}</p>
              <p className="text-sm opacity-80">After operations</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Net Profit</p>
              <p className="text-2xl font-bold">{formatCurrency(profitLoss?.profit.net_profit || 0)}</p>
              <p className="text-sm opacity-80">{profitLoss?.profit.net_profit_margin.toFixed(1) || 0}% margin</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Total Orders</p>
              <p className="text-2xl font-bold">{profitLoss?.orders.total_orders || 0}</p>
              <p className="text-sm opacity-80">{profitLoss && profitLoss.orders.total_orders > 0
                ? formatCurrency(profitLoss.revenue.net_sales / profitLoss.orders.total_orders)
                : formatCurrency(0)}/order</p>
            </div>
          </div>
        </div>

        {/* Product Profitability */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Product Profitability</h3>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : productProfitability.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No product data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">SKU</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Units Sold</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Revenue</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">COGS</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Gross Profit</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {productProfitability.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 font-mono">{p.sku}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 text-right">{p.units_sold}</td>
                      <td className="px-4 py-3 text-sm text-green-600 font-medium text-right">{formatCurrency(Number(p.revenue))}</td>
                      <td className="px-4 py-3 text-sm text-red-600 font-medium text-right">{formatCurrency(Number(p.cost))}</td>
                      <td className={`px-4 py-3 text-sm font-medium text-right ${p.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Number(p.gross_profit))}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          p.profit_margin >= 20 ? 'bg-green-100 text-green-700' :
                          p.profit_margin >= 10 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {Number(p.profit_margin).toFixed(1)}%
                        </span>
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
