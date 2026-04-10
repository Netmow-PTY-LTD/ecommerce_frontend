'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/lib/api';

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
  shipping_address: string;
}

export default function OrderStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>}>
      <OrderStatusContent />
    </Suspense>
  );
}

function OrderStatusContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const { formatCurrency } = useCurrency();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);

  const fetchOrder = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/sales/customer/orders/${id}`);
      const data = response.data.data;

      // Calculate subtotal from items
      const itemsSubtotal = data.items?.reduce((sum: number, item: any) => {
        return sum + parseFloat(item.line_total || item.total_price || 0);
      }, 0) || 0;

      const taxAmount = parseFloat(data.tax_amount || 0);
      const shippingCost = parseFloat(data.shipping_cost || 0);
      const discountAmount = parseFloat(data.discount_amount || 0);
      const calculatedTotal = itemsSubtotal + taxAmount + shippingCost - discountAmount;

      const transformedOrder: Order = {
        id: data.id,
        order_number: data.order_number,
        customer_name: data.customer?.name && data.customer?.name !== 'undefined undefined'
          ? data.customer.name
          : [data.customer?.first_name, data.customer?.last_name].filter(Boolean).join(' ') || 'Customer',
        customer_email: data.customer_email || data.customer?.email || '',
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
        shipping_address: data.shipping_address || '',
      };

      setOrder(transformedOrder);
    } catch (err: any) {
      console.error('Failed to fetch order:', err);
      setError('Order not found. Please check your order ID and try again.');
    } finally {
      setLoading(false);
    }
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

  const getPaymentMethodBadge = (method: string) => {
    const methodLower = method.toLowerCase();
    if (methodLower === 'cash' || methodLower === 'cod') {
      return { label: 'COD', color: 'bg-green-100 text-green-800 border-green-300' };
    } else if (methodLower.includes('stripe') || methodLower.includes('online') || methodLower.includes('card')) {
      return { label: 'Stripe', color: 'bg-purple-100 text-purple-800 border-purple-300' };
    } else if (methodLower.includes('bank')) {
      return { label: 'Bank Transfer', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    } else {
      return { label: method, color: 'bg-gray-100 text-gray-800 border-gray-300' };
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <svg className="mx-auto h-16 w-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.532-3L5.008 7.362 4.724 4.638 7.523 4.9a2.25 2.25 0 012.186 3.355l-.733 2.2a9.009 9.009 0 01-1.605 3.714m0 0V12a2 2 0 002 2h2.586a1 1 0 001 1v-5a1 1 0 00-1-1V7a1 1 0 00-1-1v-.063c0-.536.21-1.054.468-1.447l-2.2-.733a9.009 9.009 0 01-3.714-1.605M7 5a9.009 9.009 0 012.186 3.355l-.733 2.2A2.25 2.25 0 017.532 7h2.586a1 1 0 001 1v-5a1 1 0 00-1-1V7a1 1 0 00-1-1v-.063c0-.536.21-1.054.468-1.447l-2.2-.733a9.009 9.009 0 01-3.714-1.605" />
          </svg>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Order ID Required</h2>
          <p className="text-slate-600 mb-6">Please provide an order ID to check the status.</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <svg className="mx-auto h-16 w-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.532-3L5.008 7.362 4.724 4.638 7.523 4.9a2.25 2.25 0 012.186 3.355l-.733 2.2a9.009 9.009 0 01-1.605 3.714m0 0V12a2 2 0 002 2h2.586a1 1 0 001 1v-5a1 1 0 00-1-1V7a1 1 0 00-1-1v-.063c0-.536.21-1.054.468-1.447l-2.2-.733a9.009 9.009 0 01-3.714-1.605M7 5a9.009 9.009 0 012.186 3.355l-.733 2.2A2.25 2.25 0 017.532 7h2.586a1 1 0 001 1v-5a1 1 0 00-1-1V7a1 1 0 00-1-1v-.063c0-.536.21-1.054.468-1.447l-2.2-.733a9.009 9.009 0 01-3.714-1.605" />
          </svg>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Not Found</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="flex items-center text-slate-600 hover:text-indigo-600 transition-colors font-medium">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7 7M5 10v10a2 2 0 002 2h2a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2h2" />
                </svg>
                Back to Store
              </a>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Order Status</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-6 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">{order.order_number}</h2>
                <p className="text-sm text-slate-600 mt-1">Placed on {formatDate(order.created_at)}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className={`px-4 py-2 text-sm font-bold rounded-full border-2 ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <span className={`px-4 py-2 text-sm font-bold rounded-full border-2 ${getPaymentMethodBadge(order.payment_method).color}`}>
                  {getPaymentMethodBadge(order.payment_method).label}
                </span>
                <span className={`px-4 py-2 text-sm font-bold rounded-full border-2 ${getPaymentStatusColor(order.payment_status)}`}>
                  {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Order Summary</h3>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Subtotal</span>
              <span className="text-base font-semibold text-slate-900">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Tax</span>
              <span className="text-base font-semibold text-slate-900">{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Shipping</span>
              <span className="text-base font-semibold text-slate-900">{formatCurrency(order.shipping_cost)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-green-600 font-medium">Discount (Coupon)</span>
                <span className="text-base font-semibold text-green-600">-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg px-4 -mx-4">
              <span className="text-lg font-bold text-slate-900">Total</span>
              <span className="text-2xl font-bold text-indigo-600">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        {order.items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Order Items ({order.items.length})</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-slate-900">{item.product_name}</h4>
                      <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(item.total)}</p>
                      <p className="text-xs text-slate-500">{formatCurrency(item.price)} each</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Notes */}
        {order.notes && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Order Notes</h3>
            </div>
            <div className="p-6">
              <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4">
                <p className="text-sm text-amber-900">{order.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Customer Information */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Customer Information</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Customer Name</p>
                <p className="text-base font-medium text-slate-900">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email</p>
                <p className="text-base font-medium text-slate-900">{order.customer_email || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-sm text-slate-500 mb-2">Need help with your order?</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
