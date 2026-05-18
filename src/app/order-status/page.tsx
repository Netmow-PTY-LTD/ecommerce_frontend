'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSettingsContext } from '@/contexts/SettingsContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Package,
  Calendar,
  ArrowLeft,
  FileText,
  MapPin,
  User,
  Mail,
  CreditCard,
  Download,
  AlertCircle,
  Home,
  ArrowRight
} from 'lucide-react';

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
  const { settings } = useSettingsContext();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);

  const fetchOrder = async (id: string) => {
    try {
      setLoading(true);
      let data: any = null;

      try {
        // Try public endpoint first (works for guest customers)
        const response = await api.get(`/sales/public/orders/${id}`);
        data = response.data.data || response.data;
      } catch (publicErr: any) {
        // Fallback to customer endpoint for logged-in users
        const response = await api.get(`/sales/customer/orders/${id}`);
        data = response.data.data || response.data;
      }

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
      setError('Order not found. Please check your order number or ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'processing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'shipped':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'delivered':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: Order['payment_status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodLower = (method || '').toLowerCase();
    if (methodLower === 'cash' || methodLower === 'cod') {
      return { label: 'COD', color: 'bg-green-50 text-green-700 border-green-200' };
    } else if (methodLower.includes('stripe') || methodLower.includes('online') || methodLower.includes('card')) {
      return { label: 'Stripe', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    } else if (methodLower.includes('bank')) {
      return { label: 'Bank Transfer', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    } else {
      return { label: method || 'N/A', color: 'bg-gray-50 text-gray-700 border-gray-200' };
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

  const parseAddress = (address: any) => {
    if (!address) return null;
    if (typeof address === 'object') return address;
    try {
      return JSON.parse(address);
    } catch (e) {
      return address;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadInvoice = () => {
    handlePrint();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Order ID Required</h2>
          <p className="text-sm text-slate-500 mb-6">Please provide an order ID to check the status.</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-brand text-white rounded-lg font-semibold hover:bg-brand/90 transition-all cursor-pointer"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-brand text-white rounded-lg font-semibold hover:bg-brand/90 transition-all cursor-pointer"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Red Banner - Hidden on Print */}
      <section className='py-3 bg-brand print:hidden'>
        <div className="container px-4 mx-auto">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/shop" className="flex items-center text-white/90 hover:text-white transition-colors text-xs md:text-sm font-medium">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Store
              </Link>
              <div className="h-5 w-px bg-white/20 hidden sm:block"></div>
              <h1 className="text-white font-bold text-sm md:text-base tracking-wide hidden sm:block">Order Status</h1>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
              <Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
              <span className="text-white/50">-</span>
              <span className="text-white">Order Status</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:hidden">
        {/* Order Info Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
              <Package className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{order.order_number}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                Placed on {formatDate(order.created_at)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-3 py-1 text-[11px] font-bold rounded-full border ${getStatusColor(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
            <span className={`px-3 py-1 text-[11px] font-bold rounded-full border ${getPaymentStatusColor(order.payment_status)}`}>
              {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
            </span>
            <button
              onClick={handleDownloadInvoice}
              className="px-3 py-1 text-[11px] font-bold rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              Invoice
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Order Items & Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30">
                <h3 className="text-sm font-bold text-slate-900">Order Items</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div key={item.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-slate-900">{item.product_name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(item.total)}</p>
                      <p className="text-[10px] text-slate-400">{formatCurrency(item.price)} each</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 bg-slate-50/30 border-t border-slate-100">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium text-slate-900">{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Shipping</span>
                    <span className="font-medium text-slate-900">{formatCurrency(order.shipping_cost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tax</span>
                    <span className="font-medium text-slate-900">{formatCurrency(order.tax)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span className="font-medium">-{formatCurrency(order.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-base font-bold text-slate-900">Total</span>
                    <span className="text-lg font-bold text-brand">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30">
                  <h3 className="text-sm font-bold text-slate-900">Order Notes</h3>
                </div>
                <div className="p-5">
                  <div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-600 leading-relaxed border border-slate-100">
                    {order.notes}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Customer & Shipping Info */}
          <div className="space-y-6">
            {/* Customer Details */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30">
                <h3 className="text-sm font-bold text-slate-900">Customer Details</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 shrink-0">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Name</p>
                    <p className="text-sm font-medium text-slate-900">{order.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 shrink-0">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Email</p>
                    <p className="text-sm font-medium text-slate-900 truncate">{order.customer_email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 shrink-0">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Payment Method</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPaymentMethodBadge(order.payment_method).color}`}>
                      {getPaymentMethodBadge(order.payment_method).label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30">
                <h3 className="text-sm font-bold text-slate-900">Shipping Address</h3>
              </div>
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 shrink-0">
                    <MapPin className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-sm text-slate-600 leading-relaxed">
                    {(() => {
                      const addr = parseAddress(order.shipping_address);
                      if (!addr) return 'No shipping address provided';
                      if (typeof addr === 'string') return addr;

                      return (
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900">{addr.firstName} {addr.lastName}</p>
                          <p>{addr.address}</p>
                          <p>{addr.apartment && `${addr.apartment}, `}{addr.city}, {addr.state} {addr.postalCode}</p>
                          <p>{addr.country}</p>
                          {addr.phone && <p className="text-xs text-slate-400 mt-1">Phone: {addr.phone}</p>}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Help & Support */}
            <div className="bg-indigo-50/30 rounded-xl border border-indigo-100 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Need Help?</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                If you have any questions regarding your order status or delivery, our team is here to help.
              </p>
              <Link
                href="/contact"
                className="w-full bg-white border border-indigo-200 text-indigo-700 py-2 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Contact Support
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-8 pt-8 border-t border-slate-200 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand/90 transition-colors cursor-pointer shadow-sm"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Invoice Layout for Print */}
      <div className="hidden print:block p-8 bg-white min-h-screen text-slate-900">
        <div className="flex justify-between items-start mb-8 border-b border-slate-200 pb-6">
          <div>
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={settings.company_name} className="h-12 object-contain mb-4" />
            ) : (
              <h1 className="text-2xl font-bold uppercase mb-4">{settings?.company_name || 'INVOICE'}</h1>
            )}
            <div className="text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-900">{settings?.company_name}</p>
              <p>{settings?.address}</p>
              <p>{settings?.city}{settings?.state ? `, ${settings?.state}` : ''}{settings?.postal_code ? ` ${settings?.postal_code}` : ''}</p>
              <p>{settings?.country}</p>
              {settings?.phone && <p>Phone: {settings?.phone}</p>}
              {settings?.email && <p>Email: {settings?.email}</p>}

            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold uppercase text-slate-900 mb-2">Invoice</h2>
            <div className="text-sm space-y-1">
              <p className="font-bold"># {order.order_number}</p>
              <p className="text-slate-500">Date: {formatDate(order.created_at)}</p>
              <div className="mt-2">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase border ${getPaymentStatusColor(order.payment_status)}`}>
                  Payment: {order.payment_status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-8">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Bill To / Ship To</h3>
            <div className="text-sm space-y-1">
              {(() => {
                const addr = parseAddress(order.shipping_address);
                if (!addr) return <p className="text-slate-500 italic">No address provided</p>;
                if (typeof addr === 'string') return <p>{addr}</p>;
                return (
                  <>
                    <p className="font-bold text-slate-900">{addr.firstName} {addr.lastName}</p>
                    <p>{addr.address}</p>
                    {addr.apartment && <p>{addr.apartment}</p>}
                    <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                    <p>{addr.country}</p>
                    {addr.phone && <p className="pt-1 text-slate-400">Phone: {addr.phone}</p>}
                  </>
                );
              })()}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Order Summary</h3>
            <div className="text-sm space-y-1">
              <p><span className="text-slate-400">Payment Method:</span> {getPaymentMethodBadge(order.payment_method).label}</p>
              <p><span className="text-slate-400">Order Status:</span> {order.status.toUpperCase()}</p>
              <p><span className="text-slate-400">Customer Email:</span> {order.customer_email}</p>
            </div>
          </div>
        </div>

        <table className="w-full mb-8">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-2 text-left text-xs font-bold uppercase text-slate-900">Description</th>
              <th className="py-2 text-center text-xs font-bold uppercase text-slate-900 w-20">Qty</th>
              <th className="py-2 text-right text-xs font-bold uppercase text-slate-900 w-32">Unit Price</th>
              <th className="py-2 text-right text-xs font-bold uppercase text-slate-900 w-32">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-4">
                  <p className="text-sm font-bold text-slate-900">{item.product_name}</p>
                </td>
                <td className="py-4 text-center text-sm">{item.quantity}</td>
                <td className="py-4 text-right text-sm">{formatCurrency(item.price)}</td>
                <td className="py-4 text-right text-sm font-bold">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Shipping</span>
              <span>{formatCurrency(order.shipping_cost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tax</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-slate-900 pt-2 mt-2">
              <span>Total</span>
              <span className="text-brand">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-20 text-center border-t border-slate-100 pt-8">
          <p className="text-xs text-slate-400">Thank you for your business!</p>
          <p className="text-[10px] text-slate-300 mt-1">{settings?.website}</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .print\:hidden { display: none !important; }
          .print\:block { display: block !important; }
          @page { margin: 1cm; size: auto; }
          main { padding: 0 !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  );
}
