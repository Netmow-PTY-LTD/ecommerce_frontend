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
import {
  Receipt, Eye, Search as SearchIcon, Package, User,
  ShoppingCart, Printer, Mail, Phone, MapPin,
  Clock, AlertTriangle, CheckCircle2, TrendingUp, XCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  tax: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed';
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

export default function UnpaidOrdersPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { formatCurrency } = useCurrency();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: '1',
    limit: '10',
    totalPage: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  const [stats, setStats] = useState({
    unpaid: 0,
    amount: 0,
    overdue: 0,
    critical: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setColumnVisibility({
        order_number: true,
        customer: width >= 640,
        total: width >= 1024,
        payment_status: width >= 1440,
        overdue: width >= 1280,
        created_at: width >= 1600,
        actions: true,
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

  const fetchUnpaidOrders = async () => {
    try {
      setLoadingOrders(true);
      // Fetch a larger batch since the backend doesn't support specific payment_status filtering
      const response = await api.get('/sales/orders?limit=1000');
      const data = response.data;

      let transformedOrders: Order[] = (data.data || []).map((order: any) => {
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

      // Frontend filter for unpaid orders
      transformedOrders = transformedOrders.filter(order => order.payment_status !== 'paid');

      // Apply other filters if selected
      if (selectedStatus && selectedStatus !== 'all') {
        transformedOrders = transformedOrders.filter(order => order.status === selectedStatus);
      }
      if (appliedSearch) {
        const search = appliedSearch.toLowerCase();
        transformedOrders = transformedOrders.filter(order => 
          order.order_number.toLowerCase().includes(search) ||
          order.customer_name.toLowerCase().includes(search) ||
          order.customer_email.toLowerCase().includes(search)
        );
      }

      setOrders(transformedOrders);
      setPagination({
        total: transformedOrders.length,
        page: '1',
        limit: '10',
        totalPage: Math.ceil(transformedOrders.length / 10),
      });

      const totalAmt = transformedOrders.reduce((sum, order) => sum + order.total, 0);
      const overdueCount = transformedOrders.filter(order => {
        const days = Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return days > 3;
      }).length;
      const criticalCount = transformedOrders.filter(order => {
        const days = Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return days > 7;
      }).length;

      setStats({
        unpaid: transformedOrders.length,
        amount: totalAmt,
        overdue: overdueCount,
        critical: criticalCount,
      });

    } catch (error: any) {
      console.error('Failed to fetch unpaid orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnpaidOrders();
    }
  }, [isAuthenticated, selectedStatus, appliedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setAppliedSearch(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setAppliedSearch('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'processing': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'shipped': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const sendReminder = (order: Order) => {
    const emailLink = `mailto:${order.customer_email}?subject=Payment Reminder for Order ${order.order_number}&body=Dear ${order.customer_name},%0D%0A%0D%0AThis is a friendly reminder that your order ${order.order_number} is awaiting payment.%0D%0A%0D%0ATotal Amount: ${formatCurrency(order.total)}%0D%0APlease complete the payment at your earliest convenience.`;
    window.open(emailLink);
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Unpaid Orders</h1>
            <p className="text-slate-500 mt-1 text-sm">Track and manage pending and failed payments.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 md:p-6 transition-all hover:scale-[1.02] cursor-default">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Unpaid Orders</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.unpaid}</h3>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 md:p-6 transition-all hover:scale-[1.02] cursor-default">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Pending Amount</p>
                  <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.amount)}</h3>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-rose-500 to-rose-600 text-white p-4 md:p-6 transition-all hover:scale-[1.02] cursor-default">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-rose-100 text-sm font-medium">Overdue (&gt;3 days)</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.overdue}</h3>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 md:p-6 transition-all hover:scale-[1.02] cursor-default">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Critical (&gt;7 days)</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.critical}</h3>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <XCircle className="h-6 w-6 text-white" />
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
                  placeholder="Search by order #, customer..."
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
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
                title: 'Order Info',
                render: (_, order): ReactNode => (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">#{order.order_number}</span>
                      <Badge className={`${getStatusColor(order.status)} shadow-none border px-1.5 py-0 rounded text-[9px] font-bold uppercase`} variant="outline">
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> {format(new Date(order.created_at), 'MMM dd, HH:mm')}
                    </span>
                  </div>
                )
              },
              {
                key: 'customer',
                title: 'Customer',
                render: (_, order): ReactNode => (
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{order.customer_name}</span>
                    <span className="text-xs text-slate-500 truncate max-w-[150px]">{order.customer_email}</span>
                  </div>
                )
              },
              {
                key: 'total',
                title: 'Total Amount',
                render: (total): ReactNode => (
                  <span className="font-bold text-slate-900">{formatCurrency(Number(total))}</span>
                )
              },
              {
                key: 'payment_status',
                title: 'Payment Status',
                render: (status): ReactNode => {
                  const s = status as string;
                  const config: Record<string, string> = {
                    pending: 'bg-amber-50 text-amber-700 border-amber-200',
                    failed: 'bg-rose-50 text-rose-700 border-rose-200',
                    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  };
                  return (
                    <Badge className={`${config[s] || 'bg-slate-50'} shadow-none border px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase tracking-wider`} variant="outline">
                      {s}
                    </Badge>
                  );
                }
              },
              {
                key: 'overdue',
                title: 'Overdue',
                render: (_, order): ReactNode => {
                  const days = Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24));
                  let color = 'text-slate-500';
                  if (days > 7) color = 'text-rose-600 font-bold';
                  else if (days > 3) color = 'text-orange-600 font-bold';
                  
                  return (
                    <div className="flex flex-col">
                      <span className={`text-xs ${color}`}>{days} days</span>
                      {days > 3 && (
                        <span className="text-[10px] uppercase font-bold tracking-tighter text-slate-400">Attention Required</span>
                      )}
                    </div>
                  );
                }
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
                      title="View Order"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50"
                      onClick={() => router.push(`/admin/orders/unpaid/${order.id}/invoice`)}
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
                    <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      <p className="font-semibold text-slate-900">{order.customer_name}</p>
                      <p className="text-slate-500 text-xs">{order.customer_email}</p>
                      <p className="text-slate-500 text-xs">{order.customer_phone}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" /> Shipping Address
                    </p>
                    <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-slate-700 leading-snug">{order.shipping_address}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ShoppingCart className="h-3 w-3" /> Order Items
                  </p>
                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50/80 border-b border-slate-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-tighter">Product</th>
                          <th className="px-3 py-2 text-center font-bold text-slate-500 uppercase tracking-tighter w-16">Qty</th>
                          <th className="px-3 py-2 text-right font-bold text-slate-500 uppercase tracking-tighter w-24">Price</th>
                          <th className="px-3 py-2 text-right font-bold text-slate-500 uppercase tracking-tighter w-24">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {order.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-3 py-2 font-medium text-slate-900 truncate max-w-[200px]">{item.product_name}</td>
                            <td className="px-3 py-2 text-center text-slate-600 font-bold">{item.quantity}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{formatCurrency(item.price)}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-4 text-xs gap-2 rounded-lg bg-white border-slate-200"
                    onClick={() => sendReminder(order)}
                  >
                    <Mail className="h-3.5 w-3.5" /> Send Payment Reminder
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-4 text-xs gap-2 rounded-lg bg-white border-slate-200 ml-auto"
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <Eye className="h-3.5 w-3.5" /> View Full Details
                  </Button>
                </div>
              </div>
            )}
            searchable={false}
            serverPagination={false}
            loading={loadingOrders}
            emptyMessage="No unpaid orders found."
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
