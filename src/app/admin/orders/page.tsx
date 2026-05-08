'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
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

export default function AdminOrdersPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { formatCurrency } = useCurrency();

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
  }, [isAuthenticated, currentPage, selectedStatus, selectedDateRange, appliedSearch]);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-5 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Orders</h1>
            <p className="text-slate-500 mt-1 text-sm">Manage and track your customer orders.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 md:p-6 transition-all hover:scale-[1.02] cursor-default">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Total Orders</p>
                  <h3 className="text-2xl font-bold mt-1">{pagination.total}</h3>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Package className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-4 md:p-6 transition-all hover:scale-[1.02] cursor-default">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pending Orders</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.pending}</h3>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 md:p-6 transition-all hover:scale-[1.02] cursor-default">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Processing</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.processing}</h3>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Package className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 md:p-6 transition-all hover:scale-[1.02] cursor-default">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Shipped</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.shipped}</h3>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Truck className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-4 md:p-6 transition-all hover:scale-[1.02] cursor-default">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Delivered</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.delivered}</h3>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 bg-white border-b border-slate-100">
            <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search..."
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-[160px] h-11 bg-slate-50 border-slate-200"
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
                <Button type="submit" className="flex-1 sm:flex-none h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white transition-all">
                  Apply
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-4 border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={handleClearSearch}
                >
                  Reset
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Orders Table */}
        <Card className="border-none shadow-sm overflow-hidden p-0 sm:p-4 md:p-6">
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
                        <span className="text-indigo-600">{formatCurrency(order.total)}</span>
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
            emptyMessage="No orders found."
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        </Card>
      </div>
    </AdminLayout>
  );
}

