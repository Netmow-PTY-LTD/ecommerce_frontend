'use client';

import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Package, Clock, CheckCircle, XCircle,
  Truck, ArrowLeft, FileText, Loader2,
  CreditCard, MapPin, Phone,
  Printer, HelpCircle, ChevronRight, Tag,
  ShoppingBag, ReceiptText, BadgeCheck
} from 'lucide-react';
import Link from 'next/link';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { toast } from 'sonner';

interface OrderItem {
  id: number;
  product_id: number;
  product_name?: string;
  product_sku?: string;
  product?: {
    name: string;
    sku: string;
    image_url?: string;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
  line_total: number;
  thumb_url: string;
}

interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  subtotal: number;
  net_amount?: number;
  tax_amount: number;
  shipping_cost?: number;
  discount_amount?: number;
  total_amount: number;
  total_payable_amount?: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'confirmed';
  payment_status: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  shipping_address?: string | any;
  billing_address?: string | any;
  notes?: string;
}

export default function OrderDetailsPage() {
  const { customer, loading: authLoading, isAuthenticated } = useCustomerAuth();
  const { settings } = useSettingsContext();
  const router = useRouter();
  const { id } = useParams();
  const { formatCurrency } = useCurrency();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryingPayment, setRetryingPayment] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && customer && id) {
      fetchOrderDetails();
    }
  }, [isAuthenticated, customer, id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sales/customer/orders/${id}`);
      if (response.data && response.data.data) {
        setOrder(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!order) return;

    try {
      setRetryingPayment(true);
      const response = await api.post('/payments/customer/retry-payment', {
        order_id: order.id
      });

      if (response.data?.data?.url) {
        toast.info('Redirecting to payment...');
        window.location.href = response.data.data.url;
      } else {
        throw new Error('Failed to create payment session');
      }
    } catch (error: any) {
      console.error('Retry payment error:', error);
      toast.error(error.response?.data?.message || 'Failed to retry payment. Please try again.');
    } finally {
      setRetryingPayment(false);
    }
  };

  const canRetryPayment = order &&
    (order.payment_status === 'unpaid' || order.payment_status === 'failed' || order.payment_status === 'pending') &&
    (order.payment_method === 'online' || order.payment_method === 'stripe') &&
    order.status !== 'cancelled' &&
    order.status !== 'delivered';

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', label: 'Pending' };
      case 'confirmed':
        return { color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', dot: 'bg-indigo-500', label: 'Confirmed' };
      case 'processing':
        return { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500', label: 'Processing' };
      case 'shipped':
        return { color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500', label: 'Shipped' };
      case 'delivered':
        return { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Delivered' };
      case 'cancelled':
        return { color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500', label: 'Cancelled' };
      default:
        return { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400', label: status };
    }
  };

  const parseAddress = (address: any) => {
    if (!address) return null;
    if (typeof address === 'string') {
      try {
        return JSON.parse(address);
      } catch (e) {
        return address;
      }
    }
    return address;
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Loading order details...</p>
      </div>
    );
  }

  if (!order) return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center h-16 w-16 bg-slate-100 rounded-full mb-4">
        <ShoppingBag className="h-7 w-7 text-slate-400" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">Order not found</h2>
      <p className="text-slate-500 text-sm mt-1">This order may have been removed or doesn&apos;t exist.</p>
      <Link href="/customer/orders" className="mt-5 inline-flex items-center gap-2 text-indigo-600 hover:underline text-sm font-medium">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>
    </div>
  );

  const status = getStatusConfig(order.status);
  const shippingAddr = parseAddress(order.shipping_address);

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/customer/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
        <Link
          href={`/customer/orders/${id}/invoice`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
        >
          <Printer className="h-4 w-4" /> View Invoice
        </Link>
      </div>

      {/* Order Header */}
      <div className="bg-white border border-slate-200 rounded-xl px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
            <ReceiptText className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Order #{order.order_number}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed on {new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border w-fit self-start sm:self-auto", status.bg, status.color, status.border)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
          {status.label}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* LEFT COLUMN — 2/3 width */}
        <div className="lg:col-span-2 space-y-5">

          {/* Shipping + Payment in a 2-col row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Shipping Address */}
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-5">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> Shipping Address
              </h3>
              {shippingAddr ? (
                <div className="text-sm text-slate-600 space-y-0.5">
                  <p className="font-semibold text-slate-900">{shippingAddr.firstName} {shippingAddr.lastName}</p>
                  <p>{shippingAddr.address}{shippingAddr.apartment ? `, ${shippingAddr.apartment}` : ''}</p>
                  <p>{shippingAddr.city}, {shippingAddr.state} {shippingAddr.postalCode}</p>
                  <p>{shippingAddr.country}</p>
                  {shippingAddr.phone && (
                    <p className="pt-1.5 flex items-center gap-1.5 text-slate-400 text-xs">
                      <Phone className="h-3 w-3" /> {shippingAddr.phone}
                    </p>
                  )}
                </div>
              ) : <p className="text-sm text-slate-400">N/A</p>}
            </div>

            {/* Payment */}
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-5">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <CreditCard className="h-3 w-3" /> Payment
              </h3>
              <p className="text-sm font-semibold text-slate-900 capitalize mb-2">{order.payment_method.replace('_', ' ')}</p>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              )}>
                {order.payment_status}
              </span>
              {canRetryPayment && (
                <button
                  onClick={handleRetryPayment}
                  disabled={retryingPayment}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl transition-all uppercase tracking-wide"
                >
                  {retryingPayment ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-3.5 w-3.5" />
                      Pay Now
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">Order Items</h3>
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">{order.items?.length ?? 0}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {order.items?.map((item) => (
                <div key={item.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="h-14 w-14 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                    {item.thumb_url || item.product?.image_url ? (
                      <img
                        src={item.thumb_url || item.product?.image_url}
                        alt={item.product_name || item.product?.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-300">
                        <Package className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 truncate">{item.product?.name || item.product_name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      SKU: {item.product?.sku || item.product_sku}
                      <span className="mx-1.5 text-slate-200">|</span>
                      Qty: <span className="font-semibold text-slate-600">{item.quantity}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(item.total_price)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formatCurrency(item.unit_price)} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-5 py-4 text-sm text-amber-800">
              <span className="font-bold">Note:</span> {order.notes}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — 1/3 width, sticky */}
        <div className="space-y-5 lg:sticky lg:top-6">

          {/* Order Summary */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">Order Summary</h3>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-800 font-medium">{formatCurrency(order.net_amount ?? order.subtotal ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Shipping</span>
                <span className="text-slate-800 font-medium">{formatCurrency(order.shipping_cost ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1"><Tag className="h-3 w-3" /> Discount</span>
                <span className="text-rose-600 font-medium">-{formatCurrency(order.discount_amount ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax</span>
                <span className="text-slate-800 font-medium">{formatCurrency(order.tax_amount)}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-900">Total</span>
                <span className="text-base font-bold text-indigo-600">{formatCurrency(order.total_payable_amount ?? order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                <HelpCircle className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Need help?</p>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Contact us at <span className="text-indigo-600">{settings.email || 'support'}</span> for any assistance with your order.
            </p>
            <a
              href={`mailto:${settings.email || ''}`}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Contact Support <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
