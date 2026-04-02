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
import { CheckCircle2, Download, Filter, ArrowUpDown, TrendingUp } from 'lucide-react';

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

export default function PaidOrdersPage() {
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
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
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
      fetchPaidOrders();
    }
  }, [isAuthenticated, currentPage, selectedStatus, selectedPaymentMethod, sortBy, sortOrder, appliedSearch]);

  const fetchPaidOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        payment_status: 'paid',
      });
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedPaymentMethod) params.append('payment_method', selectedPaymentMethod);
      if (appliedSearch) params.append('search', appliedSearch);
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
      console.error('Failed to fetch paid orders:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to load paid orders: ' + errorMessage);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setAppliedSearch(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setAppliedSearch('');
    setCurrentPage(1);
  };

  const handleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const exportPaidOrders = () => {
    // Export functionality placeholder
    const csv = [
      ['Order Number', 'Customer', 'Email', 'Total', 'Payment Method', 'Status', 'Date'].join(','),
      ...orders.map(o => [
        o.order_number,
        o.customer_name,
        o.customer_email,
        o.total.toString(),
        o.payment_method,
        o.status,
        new Date(o.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paid-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setSuccess('Paid orders exported successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  // Calculate stats
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

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
      title="Paid Orders"
      subtitle="Manage and track all paid customer orders"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <Card className="shadow-lg border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Paid Orders</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{orders.length}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(avgOrderValue)}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Delivery</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {orders.filter(o => o.status === 'processing' || o.status === 'shipped').length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-10 w-40"
                  >
                    <option value="">All Statuses</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </Select>
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
                {appliedSearch && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearSearch}
                    className="h-10"
                  >
                    Clear
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={exportPaidOrders}
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
                  <TableHead className="font-semibold cursor-pointer hover:bg-muted" onClick={() => handleSort('amount')}>
                    <div className="flex items-center gap-1">
                      Total
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">Payment</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold cursor-pointer hover:bg-muted" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-1">
                      Date
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No paid orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-semibold text-primary">#{order.order_number}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{order.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                      </TableCell>
                      <TableCell className="font-bold">{formatCurrency(order.total)}</TableCell>
                      <TableCell>
                        <Badge className={`${getPaymentMethodLabel(order.payment_method).color}`} variant="secondary">
                          {getPaymentMethodLabel(order.payment_method).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(order.status)}`} variant="secondary">
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDateTime(order.created_at)}</TableCell>
                      <TableCell>
                        <a
                          href={`/admin/orders/${order.id}`}
                          className="text-primary hover:underline font-medium text-sm"
                        >
                          View Details
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
