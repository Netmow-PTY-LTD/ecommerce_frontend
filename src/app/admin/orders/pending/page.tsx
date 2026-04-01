'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/admin/admin-layout';
import { Clock, Download, Filter, ArrowUpDown, TrendingUp, Package, CheckCircle2 } from 'lucide-react';

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

export default function PendingOrdersPage() {
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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
      fetchPendingOrders();
    }
  }, [isAuthenticated, currentPage, selectedPaymentMethod, sortBy, sortOrder]);

  const fetchPendingOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        status: 'pending',
      });

      if (selectedPaymentMethod) params.append('payment_method', selectedPaymentMethod);
      if (searchTerm) params.append('search', searchTerm);
      params.append('sort', sortBy);
      params.append('order', sortOrder);

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
    } catch (err: unknown) {
      console.error('Failed to fetch pending orders:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to load pending orders: ' + errorMessage);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPendingOrders();
  };

  const handleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const exportPendingOrders = () => {
    const csv = [
      ['Order Number', 'Customer', 'Email', 'Phone', 'Total', 'Payment Method', 'Payment Status', 'Items', 'Date'].join(','),
      ...orders.map(o => [
        o.order_number,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.total.toString(),
        o.payment_method,
        o.payment_status,
        o.items.length.toString(),
        new Date(o.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pending-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setSuccess('Pending orders exported successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodLower = method.toLowerCase();
    if (methodLower === 'cash' || methodLower === 'cod') {
      return { label: 'COD', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
    } else if (methodLower.includes('stripe') || methodLower.includes('online') || methodLower.includes('card')) {
      return { label: 'Stripe', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' };
    } else if (methodLower.includes('bank')) {
      return { label: 'Bank Transfer', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
    } else {
      return { label: method, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' };
    }
  };

  const getPaymentStatusColor = (status: Order['payment_status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  // Calculate stats
  const totalPendingAmount = orders.reduce((sum, order) => sum + order.total, 0);
  const paidPendingOrders = orders.filter(o => o.payment_status === 'paid').length;
  const unpaidPendingOrders = orders.filter(o => o.payment_status === 'pending').length;
  const totalItems = orders.reduce((sum, order) => sum + order.items.length, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout
      title="Pending Orders"
      subtitle="Manage and process orders awaiting action"
    >
      <div className="space-y-6">
        {/* Alert Messages */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-6 py-4 rounded-xl shadow-sm flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-xl shadow-sm flex items-center">
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-lg border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{orders.length}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalPendingAmount)}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Paid (Unshipped)</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{paidPendingOrders}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{totalItems}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
                <p className="text-sm text-muted-foreground">Process pending orders efficiently</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (paidPendingOrders > 0) {
                      setSuccess(`${paidPendingOrders} paid orders ready for shipping!`);
                      setTimeout(() => setSuccess(''), 3000);
                    }
                  }}
                  className="bg-white dark:bg-background"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Process Paid Orders
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <Card className="shadow-xl">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-64">
                  <Input
                    type="text"
                    placeholder="Search by order number, customer name, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div>
                  <Select
                    value={selectedPaymentMethod}
                    onChange={(e) => {
                      setSelectedPaymentMethod(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-10 w-40"
                  >
                    <option value="">All Payment Methods</option>
                    <option value="stripe">Stripe</option>
                    <option value="cod">Cash on Delivery</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </Select>
                </div>
                <Button type="submit" className="h-10">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={exportPendingOrders}
                  className="h-10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="shadow-xl">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Order Info</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Items</TableHead>
                  <TableHead className="font-semibold cursor-pointer hover:bg-muted" onClick={() => handleSort('amount')}>
                    <div className="flex items-center gap-1">
                      Total
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">Payment</TableHead>
                  <TableHead className="font-semibold cursor-pointer hover:bg-muted" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-1">
                      Date
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">Time Ago</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No pending orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-semibold text-primary">#{order.order_number}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{order.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                        <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{order.items.length} item{order.items.length > 1 ? 's' : ''}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.items.slice(0, 2).map(item => item.product_name).join(', ')}
                          {order.items.length > 2 && '...'}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">{formatCurrency(order.total)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge className={`${getPaymentMethodLabel(order.payment_method).color} whitespace-nowrap`} variant="secondary">
                            {getPaymentMethodLabel(order.payment_method).label}
                          </Badge>
                          <Badge className={`${getPaymentStatusColor(order.payment_status)} whitespace-nowrap`} variant="secondary">
                            {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatDateTime(order.created_at)}</TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{getTimeAgo(order.created_at)}</span>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`/admin/orders/${order.id}`}
                          className="text-primary hover:underline font-medium text-sm"
                        >
                          Process
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPage > 1 && (
            <div className="bg-muted/30 px-6 py-4 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{(currentPage - 1) * 10 + 1}</span> to{' '}
                  <span className="font-semibold text-foreground">{Math.min(currentPage * 10, pagination.total)}</span> of{' '}
                  <span className="font-semibold text-foreground">{pagination.total}</span> results
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={currentPage >= pagination.totalPage}
                    variant="outline"
                    size="sm"
                    className="disabled:opacity-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
