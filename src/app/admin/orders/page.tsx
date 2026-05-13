'use client';

import { useEffect, useState, ReactNode, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/admin/admin-layout';
import { DataTable } from '@/components/ui/data-table';
import { Receipt, Eye, Search as SearchIcon, Package, User,
  ShoppingCart, Printer, PlusCircle, Truck,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  subtotal: number;
  tax: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  items: OrderItem[];
  notes: string;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Pagination {
  total: number;
  page: string;
  limit: string;
  totalPage: number;
}

function OrdersContent() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatCurrency } = useCurrency();
  const customerIdParam = searchParams.get('customer_id');

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: '1',
    limit: '10',
    totalPage: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState('');

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setColumnVisibility({
        order_number: true,
        customer: width >= 640,
        status: width >= 1600,
        total: width >= 1024,
        payment: width >= 1440,
        return_status: width >= 1440,
        items: width >= 1440,
        created_at: width >= 1600,
        actions: width >= 1600,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, router]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
      if (appliedSearch) params.append('search', appliedSearch);
      if (customerIdParam) params.append('customer_id', customerIdParam);

      if (selectedDateRange) {
        const today = new Date();
        const end = today.toISOString().split('T')[0];
        let start: Date;
        switch (selectedDateRange) {
          case 'today': start = today; break;
          case '7d': start = new Date(today); start.setDate(start.getDate() - 7); break;
          case '30d': start = new Date(today); start.setDate(start.getDate() - 30); break;
          case '90d': start = new Date(today); start.setDate(start.getDate() - 90); break;
          default: start = new Date(today);
        }
        params.append('start_date', start.toISOString().split('T')[0]);
        params.append('end_date', end);
      }

      const response = await api.get(`/sales/orders?${params}`);
      const data = response.data;

      const transformedOrders: Order[] = data.data.map((order: any) => {
        let shippingAddress = 'N/A';
        try {
          if (order.shipping_address) {
            const addr = typeof order.shipping_address === 'string'
              ? JSON.parse(order.shipping_address)
              : order.shipping_address;

            if (addr && typeof addr === 'object') {
              const parts = [
                addr.firstName && addr.lastName ? `${addr.firstName} ${addr.lastName}` : null,
                addr.address,
                addr.apartment ? `Apt/Suite ${addr.apartment}` : null,
                addr.city,
                addr.state,
                addr.postalCode,
                addr.country
              ].filter(Boolean);
              shippingAddress = parts.join(', ');
            } else {
              shippingAddress = order.shipping_address;
            }
          }
        } catch (e) {
          shippingAddress = order.shipping_address || 'N/A';
        }

        return {
          id: order.id,
          order_number: order.order_number,
          customer_name: order.customer?.name || 'N/A',
          customer_email: order.customer_email || order.customer?.email || 'N/A',
          customer_phone: order.customer_phone || order.customer?.phone || 'N/A',
          shipping_address: shippingAddress,
          status: order.status,
          subtotal: parseFloat(order.subtotal || order.total_amount * 0.9),
          tax: parseFloat(order.tax_amount || 0),
          shipping_cost: parseFloat(order.shipping_cost || 0),
          discount_amount: parseFloat(order.discount_amount || 0),
          total: parseFloat(order.total_amount || 0),
          payment_method: order.payment_method || 'N/A',
          payment_status: order.payment_status || 'pending',
          items: order.items?.map((item: any) => ({
            id: item.id,
            product_name: item.product?.name || item.name || 'Product',
            quantity: item.quantity,
            price: parseFloat(item.unit_price || item.price || 0),
            total: parseFloat(item.total_price || item.total || 0),
          })) || [],
          notes: order.notes || '',
          created_at: order.created_at || order.order_date || new Date().toISOString(),
          updated_at: order.updated_at || new Date().toISOString(),
        };
      });

      setOrders(transformedOrders);
      setPagination({
        total: data.pagination?.total || transformedOrders.length,
        page: data.pagination?.page || currentPage.toString(),
        limit: data.pagination?.limit || '10',
        totalPage: data.pagination?.totalPage || 1,
      });

      // Update stats if available or calculate from current data
      if (data.stats) {
        setStats({
          pending: data.stats.pending || 0,
          processing: data.stats.processing || 0,
          shipped: data.stats.shipped || 0,
          delivered: data.stats.delivered || 0,
        });
      } else if (data.data) {
        const currentStats = data.data.reduce((acc: any, curr: any) => {
          const status = curr.status?.toLowerCase();
          if (status === 'pending') acc.pending++;
          else if (status === 'processing') acc.processing++;
          else if (status === 'shipped') acc.shipped++;
          else if (status === 'delivered') acc.delivered++;
          return acc;
        }, { pending: 0, processing: 0, shipped: 0, delivered: 0 });
        setStats(currentStats);
      }
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, currentPage, selectedStatus, selectedDateRange, appliedSearch, customerIdParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setAppliedSearch(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setAppliedSearch('');
    setSelectedStatus('');
    setSelectedDateRange('');
    setCurrentPage(1);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'processing': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'shipped': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'returned': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodLower = method.toLowerCase();
    if (methodLower === 'cash' || methodLower === 'cod') return { label: 'COD', color: 'bg-green-50 text-green-700 border-green-200' };
    if (methodLower.includes('stripe') || methodLower.includes('online') || methodLower.includes('card')) return { label: 'Stripe', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    return { label: method, color: 'bg-gray-50 text-gray-700 border-gray-200' };
  };

  const getPaymentStatusColor = (status: Order['payment_status']) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'failed': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'refunded': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-4 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Orders</h1>
            <p className="text-slate-500 mt-1 text-sm">Manage and track your customer orders.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-6 border shadow-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:bg-brand/10"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Total Orders</p>
                <p className="text-2xl font-bold mt-1 text-slate-900">{pagination.total}</p>
              </div>
              <div className="p-3 bg-brand/10 text-brand rounded-xl">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border shadow-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-50 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:bg-yellow-100/50"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold mt-1 text-slate-900">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border shadow-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:bg-blue-100/50"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Processing</p>
                <p className="text-2xl font-bold mt-1 text-slate-900">{stats.processing}</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border shadow-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:bg-purple-100/50"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Shipped</p>
                <p className="text-2xl font-bold mt-1 text-slate-900">{stats.shipped}</p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Truck className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border shadow-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:bg-emerald-100/50"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Delivered</p>
                <p className="text-2xl font-bold mt-1 text-slate-900">{stats.delivered}</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-2xl border overflow-hidden shadow-none p-6">
            <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by order ID or customer..."
                  className="pl-10 h-11 bg-slate-50 border-slate-300 rounded-xl focus:bg-white transition-all text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-[180px] h-11 bg-slate-50 border-slate-300 rounded-xl text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
              </Select>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button type="submit" className="flex-1 sm:flex-none h-11 px-8 bg-brand hover:bg-brand/90 text-white transition-all rounded-xl font-semibold shadow-lg">
                  Apply
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-4 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
                  onClick={handleClearSearch}
                >
                  Reset
                </Button>
              </div>
            </form>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border overflow-hidden shadow-none">
          <div className="bg-slate-50/50 px-6 py-2 border-b-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Orders List</h2>
            <span className="text-xs text-slate-500">{pagination.total} Total Orders</span>
          </div>
          <div className="p-0 sm:p-2">
          <DataTable<Order>
            data={orders}
            columns={[
              {
                key: 'order_number',
                title: 'Order ID',
                render: (_, order): ReactNode => (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">#{order.order_number}</span>
                      <Badge className={`${getStatusColor(order.status)} shadow-none border px-1.5 py-0 rounded text-[9px] font-bold uppercase`} variant="outline">
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                )
              },
              {
                key: 'customer',
                title: 'Customer',
                render: (_, order): ReactNode => (
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-sm truncate block text-slate-900">
                        {order.customer_name}
                      </span>
                    </div>
                  </div>
                )
              },
              {
                key: 'items',
                title: 'Items',
                render: (items): ReactNode => {
                  const orderItems = items as OrderItem[];
                  return (
                    <div className="flex flex-col min-w-[100px]">
                      <span className="text-sm text-slate-900 font-medium">{orderItems.length} Product{orderItems.length > 1 ? 's' : ''}</span>
                    </div>
                  );
                }
              },
              {
                key: 'total',
                title: 'Total',
                render: (value): ReactNode => <span className="font-bold text-slate-900 whitespace-nowrap">{formatCurrency(Number(value))}</span>
              },

              {
                key: 'payment',
                title: 'Payment',
                render: (_, order): ReactNode => (
                  <div className="flex flex-col gap-1 min-w-[80px]">
                    <Badge className={`${getPaymentMethodLabel(order.payment_method).color} shadow-none border px-1.5 py-0 rounded text-[9px] font-bold uppercase`} variant="outline">
                      {getPaymentMethodLabel(order.payment_method).label}
                    </Badge>
                    <Badge className={`${getPaymentStatusColor(order.payment_status)} shadow-none border px-1.5 py-0 rounded text-[9px] font-bold uppercase`} variant="outline">
                      {order.payment_status === 'paid' ? 'Paid' : order.payment_status === 'refunded' ? 'Refunded' : order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </Badge>
                  </div>
                )
              },
              {
                key: 'return_status',
                title: 'Return Status',
                render: (_, order): ReactNode => (
                  <div className="flex items-center min-w-[80px]">
                    {order.status === 'returned' ? (
                      <Badge className="bg-orange-50 text-orange-700 border-orange-200 shadow-none border px-2 py-1 rounded text-[10px] font-bold uppercase" variant="outline">
                        Returned
                      </Badge>
                    ) : order.payment_status === 'refunded' ? (
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 shadow-none border px-2 py-1 rounded text-[10px] font-bold uppercase" variant="outline">
                        Refunded
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </div>
                )
              },
              {
                key: 'created_at',
                title: 'Date',
                render: (value): ReactNode => (
                  <div className="text-sm text-slate-600 whitespace-nowrap">
                    {format(new Date(value as string), 'dd MMM')}
                  </div>
                )
              },
              {
                key: 'actions',
                title: 'Actions',
                className: 'text-right',
                headerClassName: 'text-right',
                render: (_, order): ReactNode => (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => router.push(`/admin/orders/${order.id}/invoice`)}
                      title="View Invoice"
                    >
                      <Receipt className="h-4 w-4" />
                    </Button>
                  </div>
                )
              }
            ]}
            expandable
            renderExpandedRow={(order) => (
              <div className="py-2 space-y-3 text-sm animate-in fade-in slide-in-from-top-1 duration-200 px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <User className="h-3 w-3" /> Customer Info
                    </p>
                    <p className="font-semibold text-slate-900">{order.customer_name}</p>
                    <p className="text-slate-600 text-xs">{order.customer_email}</p>
                    <p className="text-slate-600 text-xs">{order.customer_phone}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Truck className="h-3 w-3" /> Shipping Address
                    </p>
                    <p className="text-slate-700 leading-snug">{order.shipping_address}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <ShoppingCart className="h-3 w-3" /> Order Summary
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Subtotal:</span>
                        <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Shipping:</span>
                        <span className="font-medium">+{formatCurrency(order.shipping_cost)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200">
                        <span className="text-slate-900">Total:</span>
                        <span className="text-brand font-bold">{formatCurrency(order.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    size="sm"
                    className="h-9 px-4 text-xs gap-2 rounded-lg bg-slate-900 text-white"
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <Eye className="h-3.5 w-3.5" /> Full Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-4 text-xs gap-2 rounded-lg bg-white border-slate-200"
                    onClick={() => router.push(`/admin/orders/${order.id}/invoice`)}
                  >
                    <Printer className="h-3.5 w-3.5" /> View Invoice
                  </Button>
                </div>
              </div>
            )}
            searchable={false}
            serverPagination
            paginationMeta={{
              total: pagination.total,
              page: currentPage,
              limit: parseInt(pagination.limit),
              totalPage: pagination.totalPage
            }}
            onPageChange={(page) => setCurrentPage(page)}
            loading={loadingOrders}
          />
          </div>
        </div>
      </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <AdminLayout>
      <Suspense fallback={
        <div className="h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
        </div>
      }>
        <OrdersContent />
      </Suspense>
    </AdminLayout>
  );
}

