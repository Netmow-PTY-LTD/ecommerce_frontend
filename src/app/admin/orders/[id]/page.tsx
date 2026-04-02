'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/lib/api';
import OrderTimeline from '@/components/admin/order-timeline';
import PaymentHistory from '@/components/admin/payment-history';
import AddPaymentModal from '@/components/admin/add-payment-modal';
import AdminLayout from '@/components/admin/admin-layout';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

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

// Helper function to parse and format shipping address
const formatShippingAddress = (address: string | null | undefined): string => {
  if (!address) return 'N/A';

  // Try to parse if it's a JSON string
  try {
    const parsed = JSON.parse(address);
    const parts = [
      parsed.firstName && parsed.lastName ? `${parsed.firstName} ${parsed.lastName}` : null,
      parsed.address,
      parsed.apartment,
      parsed.city,
      parsed.state,
      parsed.postalCode,
      parsed.country
    ].filter(Boolean);

    return parts.join(', ') || address;
  } catch {
    // If not JSON, return as-is
    return address;
  }
};

export default function OrderDetailPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { formatCurrency } = useCurrency();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);
  const [paymentRefreshKey, setPaymentRefreshKey] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Order['status'] | null>(null);
  const [statusDate, setStatusDate] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrder();
    }
  }, [isAuthenticated, orderId]);

  const fetchOrder = async () => {
    try {
      setLoadingOrder(true);

      const response = await api.get(`/sales/orders/${orderId}`);
      const data = response.data.data;

      // Calculate subtotal from items (sum of line_total which excludes tax)
      const itemsSubtotal = data.items?.reduce((sum: number, item: any) => {
        return sum + parseFloat(item.line_total || item.total_price || 0);
      }, 0) || 0;

      const taxAmount = parseFloat(data.tax_amount || 0);
      const shippingCost = parseFloat(data.shipping_cost || 0);
      const discountAmount = parseFloat(data.discount_amount || 0);

      // Calculate total correctly: subtotal + tax + shipping - discount
      const calculatedTotal = itemsSubtotal + taxAmount + shippingCost - discountAmount;

      // Transform API response to match our interface
      const transformedOrder: Order = {
        id: data.id,
        order_number: data.order_number,
        customer_name: data.customer?.name || `${data.customer?.first_name || ''} ${data.customer?.last_name || ''}`.trim() || 'N/A',
        customer_email: data.customer_email || data.customer?.email || 'N/A',
        customer_phone: data.customer_phone || data.customer?.phone || 'N/A',
        shipping_address: data.shipping_address || 'N/A',
        status: data.status,
        subtotal: itemsSubtotal,
        tax: taxAmount,
        shipping_cost: shippingCost,
        discount_amount: discountAmount,
        total: calculatedTotal,
        payment_method: data.payment_method || 'N/A',
        payment_status: data.payment_status || 'pending',
        items: data.items?.map((item: any) => ({
          id: item.id,
          product_name: item.product?.name || item.name || 'Product',
          quantity: item.quantity,
          price: parseFloat(item.unit_price || item.price || 0),
          total: parseFloat(item.line_total || item.total_price || item.total || 0),
        })) || [],
        notes: data.notes || '',
        created_at: data.created_at || data.order_date || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      };

      setOrder(transformedOrder);
    } catch (error: any) {
      console.error('Failed to fetch order:', error);
      setError('Failed to load order: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleUpdateStatus = async (newStatus: Order['status']) => {
    setSelectedStatus(newStatus);
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setStatusDate(today);
    setStatusNote('');
    setShowStatusModal(true);
  };

  const handleStatusModalSubmit = async () => {
    if (!order || !selectedStatus) return;

    try {
      setIsUpdatingStatus(true);

      await api.put(`/sales/orders/${order.id}/status`, {
        status: selectedStatus,
        status_date: statusDate,
        status_note: statusNote
      });

      setSuccess(`Order status updated to ${selectedStatus}`);
      setShowStatusModal(false);
      setSelectedStatus(null);
      setStatusNote('');
      setStatusDate('');

      // Refetch order data to get updated timeline
      await fetchOrder();

      // Force timeline component to remount and refetch
      setTimelineRefreshKey(prev => prev + 1);

      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Failed to update status:', error);
      setError('Failed to update status: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStatusModalClose = () => {
    setShowStatusModal(false);
    setSelectedStatus(null);
    setStatusDate('');
    setStatusNote('');
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPaymentStatusColor = (status: Order['payment_status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || loadingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !order) {
    return null;
  }

  return (
    <AdminLayout
      title={`Order ${order.order_number}`}
      subtitle="Order details and management"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Order Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{order.order_number}</h2>
                <p className="text-sm text-slate-600 mt-1">Placed on {formatDate(order.created_at)}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-4 py-2 text-sm font-bold rounded-full border-2 ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Update */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Update Order Status
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-5 gap-3">
                  {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(status)}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                        order.status === status
                          ? getStatusColor(status) + ' scale-105 shadow-lg'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Customer Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer Name</label>
                      <p className="text-base font-medium text-slate-900 mt-1">{order.customer_name}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</label>
                      <p className="text-base font-medium text-slate-900 mt-1">{order.customer_email}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</label>
                      <p className="text-base font-medium text-slate-900 mt-1">{order.customer_phone}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Shipping Address</label>
                    <div className="mt-1 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-base text-slate-900 whitespace-pre-wrap">{formatShippingAddress(order.shipping_address)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Order Items ({order.items.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {order.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.product_name}</td>
                        <td className="px-6 py-4 text-sm text-slate-900 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 text-right">{formatCurrency(item.price)}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Notes */}
            {order.notes && (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Order Notes
                  </h3>
                </div>
                <div className="p-6">
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl">
                    <p className="text-sm text-amber-900">{order.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Summary & Payment */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Order Summary
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Subtotal</span>
                  <span className="text-base font-semibold text-slate-900">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Tax</span>
                  <span className="text-base font-semibold text-slate-900">{formatCurrency(order.tax)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Shipping</span>
                  <span className="text-base font-semibold text-slate-900">{formatCurrency(order.shipping_cost)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between items-center bg-green-50 -mx-2 px-2 py-1 rounded-lg">
                    <span className="text-sm text-green-600 font-medium">Discount (Coupon)</span>
                    <span className="text-base font-semibold text-green-600">-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <div className="border-t-2 border-slate-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-900">Total</span>
                    <span className="text-2xl font-bold text-indigo-600">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Payment Information
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Payment Method</span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    order.payment_method.toLowerCase() === 'cash' || order.payment_method.toLowerCase() === 'cod'
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : order.payment_method.toLowerCase().includes('stripe') || order.payment_method.toLowerCase().includes('online') || order.payment_method.toLowerCase().includes('card')
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-gray-100 text-gray-800 border-gray-300'
                  }`}>
                    {order.payment_method.toLowerCase() === 'cash' || order.payment_method.toLowerCase() === 'cod'
                      ? 'COD'
                      : order.payment_method.toLowerCase().includes('stripe') || order.payment_method.toLowerCase().includes('online')
                      ? 'Stripe'
                      : order.payment_method}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Payment Status</span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border-2 ${
                    order.payment_status === 'paid'
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : order.payment_status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                      : order.payment_status === 'failed'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-gray-100 text-gray-800 border-gray-300'
                  }`}>
                    {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <PaymentHistory
              key={`payment-${paymentRefreshKey}`}
              orderId={orderId}
              orderTotal={order.total}
            />

            {/* Timeline */}
            <OrderTimeline key={`timeline-${timelineRefreshKey}`} orderId={orderId} />

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-6 space-y-3">
                {/* Check if order is fully paid via Stripe */}
                {(order.payment_method.toLowerCase().includes('stripe') ||
                  order.payment_method.toLowerCase().includes('online') ||
                  order.payment_method.toLowerCase().includes('card')) &&
                  order.payment_status === 'paid' ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <svg className="mx-auto h-10 w-10 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-semibold text-green-800">Order fully paid via Stripe</p>
                    <p className="text-xs text-green-600 mt-1">No additional payment needed</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Payment
                  </button>
                )}
                <a
                  href="/admin/orders"
                  className="w-full px-6 py-3 bg-gradient-to-r from-slate-600 to-gray-600 text-white rounded-xl text-sm font-semibold hover:from-slate-700 hover:to-gray-700 transition-all shadow-lg flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Orders
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-slate-200 rounded-t-2xl">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Update Order Status
              </h3>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  New Status
                </label>
                <div className={`px-4 py-3 rounded-xl text-sm font-bold border-2 ${getStatusColor(selectedStatus!)}`}>
                  {selectedStatus?.charAt(0).toUpperCase() + selectedStatus?.slice(1)}
                </div>
              </div>

              <div>
                <label htmlFor="statusDate" className="block text-sm font-semibold text-slate-700 mb-2">
                  Status Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="statusDate"
                  value={statusDate}
                  onChange={(e) => setStatusDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="statusNote" className="block text-sm font-semibold text-slate-700 mb-2">
                  Note <span className="text-xs font-normal text-slate-500">(optional)</span>
                </label>
                <textarea
                  id="statusNote"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  placeholder="Add a note about this status change..."
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex space-x-3 rounded-b-2xl">
              <button
                onClick={handleStatusModalClose}
                disabled={isUpdatingStatus}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusModalSubmit}
                disabled={isUpdatingStatus || !statusDate}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isUpdatingStatus ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && order && (
        <AddPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderId={order.id}
          orderTotal={order.total}
          onSuccess={() => {
            setPaymentRefreshKey(prev => prev + 1);
            fetchOrder();
          }}
        />
      )}
    </AdminLayout>
  );
}
