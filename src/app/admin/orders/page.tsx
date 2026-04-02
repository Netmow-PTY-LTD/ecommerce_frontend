'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/admin/admin-layout';

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

export default function AdminOrdersPage() {
  const { user, isAuthenticated, loading } = useAuth();
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
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, currentPage, selectedStatus]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      if (selectedStatus) params.append('status', selectedStatus);
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/sales/orders?${params}`);
      const data = response.data;

      // Transform API response to match our interface
      const transformedOrders: Order[] = data.data.map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer?.name || 'N/A',
        customer_email: order.customer_email || order.customer?.email || 'N/A',
        customer_phone: order.customer_phone || order.customer?.phone || 'N/A',
        shipping_address: order.shipping_address || 'N/A',
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
      }));

      setOrders(transformedOrders);
      setPagination({
        total: data.pagination?.total || transformedOrders.length,
        page: data.pagination?.page || currentPage.toString(),
        limit: data.pagination?.limit || '10',
        totalPage: data.pagination?.totalPage || 1,
      });
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      setError('Failed to load orders: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodLower = method.toLowerCase();
    if (methodLower === 'cash' || methodLower === 'cod') {
      return { label: 'COD', color: 'bg-green-100 text-green-800' };
    } else if (methodLower.includes('stripe') || methodLower.includes('online') || methodLower.includes('card')) {
      return { label: 'Stripe', color: 'bg-purple-100 text-purple-800' };
    } else if (methodLower.includes('bank')) {
      return { label: 'Bank Transfer', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { label: method, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getPaymentStatusColor = (status: Order['payment_status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
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
    <AdminLayout
      title="Orders Management"
      subtitle="Manage and track all customer orders"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert Messages */}
        {success && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl shadow-sm flex items-center">
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 101.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm flex items-center">
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Orders</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{orders.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{orders.filter(o => o.status === 'pending').length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Processing</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{orders.filter(o => o.status === 'processing').length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Shipped</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{orders.filter(o => o.status === 'shipped').length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Delivered</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{orders.filter(o => o.status === 'delivered').length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="shadow-xl mb-6">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <Input
                  type="text"
                  placeholder="Search by order number, customer name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12"
                />
              </div>
              <div>
                <Select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-12 w-48"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </div>
              <Button
                type="submit"
                className="h-12 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="shadow-xl">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-gray-50">
                  <TableHead className="font-semibold text-slate-600">Order Info</TableHead>
                  <TableHead className="font-semibold text-slate-600">Customer</TableHead>
                  <TableHead className="font-semibold text-slate-600">Items</TableHead>
                  <TableHead className="font-semibold text-slate-600">Total</TableHead>
                  <TableHead className="font-semibold text-slate-600">Coupon</TableHead>
                  <TableHead className="font-semibold text-slate-600">Status</TableHead>
                  <TableHead className="font-semibold text-slate-600">Payment Type</TableHead>
                  <TableHead className="font-semibold text-slate-600">Payment Status</TableHead>
                  <TableHead className="font-semibold text-slate-600">Date</TableHead>
                  <TableHead className="font-semibold text-slate-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-semibold text-indigo-600">{order.order_number}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-900">{order.customer_name}</div>
                      <div className="text-sm text-slate-500">{order.customer_email}</div>
                      <div className="text-xs text-slate-400">{order.customer_phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-900">{order.items.length} item{order.items.length > 1 ? 's' : ''}</div>
                      <div className="text-xs text-slate-500">
                        {order.items.slice(0, 2).map(item => item.product_name).join(', ')}
                        {order.items.length > 2 && '...'}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      {order.discount_amount > 0 ? (
                        <Badge className="bg-green-100 text-green-800" variant="secondary">
                          -{formatCurrency(order.discount_amount)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(order.status)}`} variant="secondary">
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getPaymentMethodLabel(order.payment_method).color}`} variant="secondary">
                        {getPaymentMethodLabel(order.payment_method).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getPaymentStatusColor(order.payment_status)}`} variant="secondary">
                        {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-900">{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <a
                        href={`/admin/orders/${order.id}`}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        View Details
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-700">
                Showing <span className="font-semibold">1</span> to <span className="font-semibold">{orders.length}</span> of{' '}
                <span className="font-semibold">{pagination.total}</span> results
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="disabled:opacity-50"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={currentPage >= pagination.totalPage}
                  variant="outline"
                  className="disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
