'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import AdminLayout from '@/components/admin/admin-layout';
import {
  Truck,
  DollarSign,
  ShoppingCart,
  Calendar,
  Package,
  Users,
  Percent,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Info
} from 'lucide-react';

interface ShippingSummary {
  total_shipments: number;
  free_shipments: number;
  paid_shipments: number;
  free_shipping_rate: number;
  shipping_collected: number;
  estimated_courier_cost: number;
  net_shipping_cost: number;
}

interface CarrierData {
  carrier: string;
  total_shipments: number;
  free_shipments: number;
  paid_shipments: number;
  shipping_collected: number;
  estimated_courier_cost: number;
  net_shipping_cost: number;
}

interface FreeProduct {
  id: number;
  product_name: string;
  sku: string;
  price: number;
  orders_count: number;
  free_shipped_quantity: number;
  total_value: number;
}

interface FreeCustomer {
  customer_id: number;
  customer_name: string;
  email: string;
  phone: string;
  order_id: number;
  order_number: string;
  order_date: string;
  total_amount: number;
  products: string;
}

export default function ShippingAnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { formatCurrency } = useCurrency();

  // Date states
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // General Loading & Tab state
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'customers'>('overview');

  // Overview states
  const [summary, setSummary] = useState<ShippingSummary | null>(null);
  const [carriers, setCarriers] = useState<CarrierData[]>([]);

  // Free shipping products pagination & search state
  const [products, setProducts] = useState<FreeProduct[]>([]);
  const [productPage, setProductPage] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [productSearch, setProductSearch] = useState('');

  // Free shipping customers pagination & search state
  const [customers, setCustomers] = useState<FreeCustomer[]>([]);
  const [customerPage, setCustomerPage] = useState(1);
  const [customerTotal, setCustomerTotal] = useState(0);
  const [customerSearch, setCustomerSearch] = useState('');

  // Fetch all states whenever tab, dates or page shifts
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/admin/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'overview') {
        fetchOverview();
      } else if (activeTab === 'products') {
        fetchProducts();
      } else if (activeTab === 'customers') {
        fetchCustomers();
      }
    }
  }, [isAuthenticated, activeTab, startDate, endDate, productPage, customerPage]);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/shipping/summary', {
        params: { startDate, endDate, courier_rate: 15 }
      });
      const data = res.data?.data;
      if (data) {
        setSummary(data.summary || null);
        setCarriers(data.carriers || []);
      }
    } catch (err) {
      console.error('Failed to fetch shipping overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/shipping/free-products', {
        params: { startDate, endDate, page: productPage, limit: 10 }
      });
      const data = res.data?.data;
      const pagination = res.data?.pagination;
      if (data) {
        setProducts(data || []);
        setProductTotal(pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch free products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/shipping/free-customers', {
        params: { startDate, endDate, page: customerPage, limit: 10 }
      });
      const data = res.data?.data;
      const pagination = res.data?.pagination;
      if (data) {
        setCustomers(data || []);
        setProductTotal(pagination?.total || 0); // Keep tracking total items
        setCustomerTotal(pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch free customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const isDataLoading = loading || authLoading;

  if (!authLoading && !isAuthenticated) return null;

  // Search filter functions (Client-side filtering over paginated chunks for secondary UX refinement)
  const filteredProducts = products.filter(p =>
    p.product_name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    c.customer_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.order_number.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const totalPagesProducts = Math.ceil(productTotal / 10) || 1;
  const totalPagesCustomers = Math.ceil(customerTotal / 10) || 1;

  // Custom visual progress circle calculations
  const totalShipments = summary?.total_shipments || 0;
  const freeRate = summary?.free_shipping_rate || 0;
  const strokeDashoffset = 251.2 - (251.2 * freeRate) / 100;

  // Skeleton UI for loading state
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

  const TableSkeleton = () => (
    <div className="space-y-4 w-full bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
      <div className="h-8 bg-slate-100 rounded-lg w-1/4 mb-6" />
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100">
          <div className="h-4 bg-slate-100 rounded w-1/6" />
          <div className="h-4 bg-slate-50 rounded w-1/4" />
          <div className="h-4 bg-slate-100 rounded w-1/5 ml-auto" />
          <div className="h-4 bg-slate-50 rounded w-12" />
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Truck className="h-7 w-7 text-indigo-600" />
              Shipping & Fulfillment Analytics
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Track collected customer shipping charges, absorbed free shipping expenses, courier efficiency, and customers.
            </p>
          </div>
        </div>

        {/* Date Filter & Tab Navigation bar */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-2 border-b xl:border-b-0 pb-3 xl:pb-0">
            <button
              onClick={() => { setActiveTab('overview'); setProductPage(1); setCustomerPage(1); }}
              className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Overview & Courier Costs
            </button>
            <button
              onClick={() => { setActiveTab('products'); setProductPage(1); }}
              className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                activeTab === 'products'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Free Shipping Products
            </button>
            <button
              onClick={() => { setActiveTab('customers'); setCustomerPage(1); }}
              className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                activeTab === 'customers'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Free Shipping Customers
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-500 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setProductPage(1);
                  setCustomerPage(1);
                }}
                className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50 hover:bg-slate-100 transition-colors"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setProductPage(1);
                  setCustomerPage(1);
                }}
                className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50 hover:bg-slate-100 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* --- OVERVIEW TAB --- */}
        {activeTab === 'overview' && (
          <>
            {isDataLoading ? <StatsSkeleton /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Collected shipping */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-500">Shipping Charged</p>
                    <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600 shrink-0">
                      <DollarSign size={18} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(summary?.shipping_collected || 0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <Info size={12} />
                    Collected from customers
                  </p>
                </div>

                {/* Courier / Shipping Cost Paid */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-500">Estimated Courier Expenses</p>
                    <div className="bg-violet-100 p-2.5 rounded-xl text-violet-600 shrink-0">
                      <Truck size={18} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(summary?.estimated_courier_cost || 0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Paid to courier services (flat estimation)
                  </p>
                </div>

                {/* Net balance */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-500">Net Shipping Balance</p>
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      (summary?.net_shipping_cost || 0) >= 0
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-rose-100 text-rose-600'
                    }`}>
                      <TrendingUp size={18} />
                    </div>
                  </div>
                  <p className={`text-2xl font-bold ${
                    (summary?.net_shipping_cost || 0) >= 0 ? 'text-blue-600' : 'text-rose-600'
                  }`}>
                    {formatCurrency(summary?.net_shipping_cost || 0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {(summary?.net_shipping_cost || 0) >= 0 ? 'Shipping costs fully covered' : 'Absorbed shipping deficits'}
                  </p>
                </div>

                {/* Free shipping Rate */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-500">Free Shipping Penetration</p>
                    <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600 shrink-0">
                      <Percent size={18} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">
                    {freeRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {summary?.free_shipments || 0} of {summary?.total_shipments || 0} orders shipped free
                  </p>
                </div>
              </div>
            )}

            {/* Carrier Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Courier Breakdown list */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Courier Services breakdown</h3>
                  <p className="text-slate-500 text-sm mb-6">Fulfillment volumes, cost breakdowns, and profits by carrier partner.</p>
                  
                  {isDataLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map(i => (
                        <div key={i} className="h-10 bg-slate-50 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : carriers.length === 0 ? (
                    <div className="text-center text-slate-400 py-12">No carrier fulfillment tracking records found.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                            <th className="pb-3 pr-2">Courier Partner</th>
                            <th className="pb-3 px-2 text-center">Shipments</th>
                            <th className="pb-3 px-2 text-center">Free Shipped</th>
                            <th className="pb-3 px-2 text-right">Shipping Collected</th>
                            <th className="pb-3 px-2 text-right">Courier Expense</th>
                            <th className="pb-3 pl-2 text-right">Net Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {carriers.map((c, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 pr-2 font-semibold text-slate-800 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                                {c.carrier}
                              </td>
                              <td className="py-4 px-2 text-center font-medium text-slate-600">{c.total_shipments}</td>
                              <td className="py-4 px-2 text-center">
                                <span className="inline-block bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold">
                                  {c.free_shipments} orders
                                </span>
                              </td>
                              <td className="py-4 px-2 text-right font-medium text-slate-700">{formatCurrency(c.shipping_collected)}</td>
                              <td className="py-4 px-2 text-right font-medium text-rose-600">-{formatCurrency(c.estimated_courier_cost)}</td>
                              <td className={`py-4 pl-2 text-right font-bold ${
                                c.net_shipping_cost >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {c.net_shipping_cost >= 0 ? '+' : ''}{formatCurrency(c.net_shipping_cost)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Visual shipping distribution circle */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center text-center">
                <h3 className="text-base font-bold text-slate-800 mb-6 w-full text-left">Fulfillment Breakdown</h3>
                
                {isDataLoading ? (
                  <div className="h-40 w-40 rounded-full bg-slate-50 animate-pulse flex items-center justify-center" />
                ) : (
                  <div className="relative flex items-center justify-center h-48 w-48 mb-6">
                    {/* SVG Circular Graph */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-slate-100 fill-none"
                        strokeWidth="10"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-amber-500 fill-none transition-all duration-1000 ease-in-out"
                        strokeWidth="10"
                        strokeDasharray="251.2"
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-3xl font-extrabold text-slate-800">{freeRate.toFixed(0)}%</span>
                      <span className="text-slate-400 text-xs mt-1">Free Shipping</span>
                    </div>
                  </div>
                )}
                
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600 font-medium">
                      <span className="h-3.5 w-3.5 rounded bg-indigo-500" />
                      Paid Shipments
                    </span>
                    <span className="font-semibold text-slate-800">
                      {summary?.paid_shipments || 0} orders ({(100 - freeRate).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600 font-medium">
                      <span className="h-3.5 w-3.5 rounded bg-amber-500" />
                      Free Shipments
                    </span>
                    <span className="font-semibold text-slate-800">
                      {summary?.free_shipments || 0} orders ({freeRate.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- PRODUCTS TAB --- */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Products Provided with Free Shipping</h3>
                <p className="text-slate-500 text-sm">Total products ordered that qualified for free-shipping promotions.</p>
              </div>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Name, SKU..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow bg-slate-50"
                />
              </div>
            </div>

            {isDataLoading ? <TableSkeleton /> : filteredProducts.length === 0 ? (
              <div className="text-center text-slate-400 py-16">No products sold under free shipping rules.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                        <th className="pb-3 pr-2">Product Name</th>
                        <th className="pb-3 px-2">SKU</th>
                        <th className="pb-3 px-2 text-right">Price</th>
                        <th className="pb-3 px-2 text-center">Free Shipped Quantity</th>
                        <th className="pb-3 px-2 text-center">Orders Count</th>
                        <th className="pb-3 pl-2 text-right">Total Shipped Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 pr-2 font-semibold text-slate-800">{p.product_name}</td>
                          <td className="py-4 px-2 text-slate-500 font-medium font-mono">{p.sku}</td>
                          <td className="py-4 px-2 text-right font-medium text-slate-600">{formatCurrency(p.price)}</td>
                          <td className="py-4 px-2 text-center font-bold text-indigo-600">{p.free_shipped_quantity} units</td>
                          <td className="py-4 px-2 text-center font-semibold text-slate-600">{p.orders_count} orders</td>
                          <td className="py-4 pl-2 text-right font-extrabold text-slate-800">{formatCurrency(p.total_value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-4">
                  <span className="text-sm text-slate-500">
                    Showing {filteredProducts.length} items (Total: {productTotal})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setProductPage(prev => Math.max(prev - 1, 1))}
                      disabled={productPage === 1}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-semibold text-slate-700">
                      Page {productPage} of {totalPagesProducts}
                    </span>
                    <button
                      onClick={() => setProductPage(prev => Math.min(prev + 1, totalPagesProducts))}
                      disabled={productPage === totalPagesProducts}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* --- CUSTOMERS TAB --- */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Customers Getting Free Shipping</h3>
                <p className="text-slate-500 text-sm">Customers who received free shipping benefits on their transactions.</p>
              </div>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Customer, Order..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow bg-slate-50"
                />
              </div>
            </div>

            {isDataLoading ? <TableSkeleton /> : filteredCustomers.length === 0 ? (
              <div className="text-center text-slate-400 py-16">No customers found getting free shipping in this period.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                        <th className="pb-3 pr-2">Customer Name</th>
                        <th className="pb-3 px-2">Contact</th>
                        <th className="pb-3 px-2">Order Info</th>
                        <th className="pb-3 px-2">Date Shipped</th>
                        <th className="pb-3 px-2">Products Purchased</th>
                        <th className="pb-3 pl-2 text-right">Order Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredCustomers.map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 pr-2 font-semibold text-slate-800 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                              {(c.customer_name || '?').charAt(0).toUpperCase()}
                            </div>
                            {c.customer_name}
                          </td>
                          <td className="py-4 px-2">
                            <div className="text-slate-700 font-medium">{c.email}</div>
                            <div className="text-slate-400 text-xs">{c.phone || 'N/A'}</div>
                          </td>
                          <td className="py-4 px-2 font-semibold text-slate-600 font-mono">{c.order_number}</td>
                          <td className="py-4 px-2 text-slate-500">
                            {new Date(c.order_date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="py-4 px-2 text-slate-500 max-w-xs truncate" title={c.products}>
                            {c.products}
                          </td>
                          <td className="py-4 pl-2 text-right font-extrabold text-slate-800">{formatCurrency(c.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-4">
                  <span className="text-sm text-slate-500">
                    Showing {filteredCustomers.length} items (Total: {customerTotal})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCustomerPage(prev => Math.max(prev - 1, 1))}
                      disabled={customerPage === 1}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-semibold text-slate-700">
                      Page {customerPage} of {totalPagesCustomers}
                    </span>
                    <button
                      onClick={() => setCustomerPage(prev => Math.min(prev + 1, totalPagesCustomers))}
                      disabled={customerPage === totalPagesCustomers}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
