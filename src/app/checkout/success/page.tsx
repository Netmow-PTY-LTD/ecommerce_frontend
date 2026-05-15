"use client";

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Home, ShoppingBag, ArrowRight, ArrowLeft, MapPin, CreditCard, Mail, ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';

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
  total: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed';
  items: OrderItem[];
  notes: string;
  created_at: string;
  shipping_address: string;
}

function CheckoutSuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const processingStarted = useRef(false);

  const parseShippingAddress = (addressStr: string) => {
    if (!addressStr) return 'Details provided during checkout';
    try {
      // Check if it's a JSON string
      if (addressStr.startsWith('{')) {
        const addr = JSON.parse(addressStr);
        return (
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-900">{addr.first_name} {addr.last_name}</p>
            <p>{addr.address_line_1}</p>
            {addr.address_line_2 && <p>{addr.address_line_2}</p>}
            <p>{addr.city}, {addr.state} {addr.zip_code}</p>
            <p>{addr.country}</p>
            {addr.phone && <p className="text-xs mt-1 text-slate-400 font-medium">Tel: {addr.phone}</p>}
          </div>
        );
      }
      return addressStr;
    } catch (e) {
      return addressStr;
    }
  };

  useEffect(() => {
    const loadOrderDetails = async () => {
      try {
        const lastOrderId = localStorage.getItem('lastOrderId');
        const lastOrderNumber = localStorage.getItem('lastOrderNumber');
        const sessionId = searchParams.get('session_id');

        if (!sessionId && !lastOrderId) {
          if (!order && !orderNumber) {
            setTimeout(() => {
              if (!processingStarted.current) {
                setHasError(true);
                setIsLoading(false);
                setShowLoader(false);
              }
            }, 1500);
          }
          return;
        }

        if (processingStarted.current) return;
        processingStarted.current = true;

        let orderId: string | null = null;

        if (!sessionId && lastOrderId && lastOrderNumber) {
          setOrderNumber(lastOrderNumber);
          orderId = lastOrderId;
          localStorage.removeItem('lastOrderId');
          localStorage.removeItem('lastOrderNumber');
          setShowLoader(false);
        }

        if (sessionId) {
          try {
            const response = await api.post('/sales/public/verify-payment', {
              session_id: sessionId
            }, { skipAuthRedirect: true } as any);

            if (response.data?.data?.order_number) {
              setOrderNumber(response.data.data.order_number);
              orderId = String(response.data.data.id);
              setShowLoader(false);
            } else {
              throw new Error('Order verification failed');
            }
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
            setHasError(true);
            setIsLoading(false);
            setShowLoader(false);
            return;
          }
        }

        if (orderId) {
          try {
            let data: any = null;
            try {
              const orderResponse = await api.get(`/sales/public/orders/${orderId}`, { skipAuthRedirect: true } as any);
              data = orderResponse.data?.data || orderResponse.data;
            } catch (publicErr: any) {
              const orderResponse = await api.get(`/sales/customer/orders/${orderId}`, { skipAuthRedirect: true } as any);
              data = orderResponse.data?.data || orderResponse.data;
            }

            if (data && data.id) {
              const itemsSubtotal = data.items?.reduce((sum: number, item: any) => {
                return sum + parseFloat(item.line_total || item.total_price || 0);
              }, 0) || 0;

              const transformedOrder: Order = {
                id: data.id,
                order_number: data.order_number,
                customer_name: [data.customer?.first_name, data.customer?.last_name].filter(Boolean).join(' ') || data.customer_name || 'Customer',
                customer_email: data.customer_email || data.customer?.email || '',
                status: data.status,
                subtotal: itemsSubtotal,
                tax: parseFloat(data.tax_amount || 0),
                shipping_cost: parseFloat(data.shipping_cost || 0),
                total: parseFloat(data.total_payable_amount || data.total_amount || 0),
                payment_method: data.payment_method || 'N/A',
                payment_status: data.payment_status || 'pending',
                items: data.items?.map((item: any) => ({
                  id: item.id,
                  product_name: item.product?.name || item.product_name || 'Product',
                  quantity: item.quantity,
                  price: parseFloat(item.unit_price || item.price || 0),
                  total: parseFloat(item.line_total || item.total_price || 0),
                })) || [],
                notes: data.notes || '',
                created_at: data.created_at || new Date().toISOString(),
                shipping_address: data.shipping_address || '',
              };

              setOrder(transformedOrder);
            }
          } catch (orderError: any) {
            console.warn('Could not fetch order details', orderError);
          }
        }

        setIsLoading(false);
        setShowLoader(false);
      } catch (error: any) {
        console.error('Error on success page:', error);
        setShowLoader(false);
        setHasError(true);
        setIsLoading(false);
      }
    };

    loadOrderDetails();
  }, [searchParams]);

  if (showLoader) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-slate-900">Confirming your order...</h2>
          <p className="text-slate-500 mt-2">Please stay on this page while we process your request.</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-slate-50">
        <section className='py-3 bg-brand'>
          <div className="container px-4 mx-auto">
            <div className="flex items-center gap-4">
              <Link href="/shop" className="flex items-center text-white/90 hover:text-white transition-colors text-xs md:text-sm font-medium">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Store
              </Link>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-xl mx-auto text-center bg-white p-12 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Order Session Expired</h1>
            <p className="text-slate-500 mb-8 leading-relaxed">
              We couldn't retrieve your order details. This usually happens if the page is refreshed or accessed directly. Please check your email or dashboard for order confirmation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/shop" className="w-full sm:w-auto">
                <Button className="w-full bg-brand hover:bg-brand/90 font-bold px-8">Continue Shopping</Button>
              </Link>
              <Link href="/customer/orders" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full font-bold px-8">View My Orders</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Red Banner */}
      <section className='py-3 bg-brand'>
        <div className="container px-4 mx-auto">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/shop" className="flex items-center text-white/90 hover:text-white transition-colors text-xs md:text-sm font-medium">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Store
              </Link>
              <div className="h-5 w-px bg-white/20 hidden sm:block"></div>
              <h1 className="text-white font-bold text-sm md:text-base tracking-wide hidden sm:block">Order Confirmed</h1>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
              <Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
              <span className="text-white/50">-</span>
              <span className="text-white">Success</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Success Message Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100"
          >
            <CheckCircle className="w-10 h-10 text-green-500" />
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Thank you for your order!</h1>
          <p className="text-slate-600 max-w-lg mx-auto">
            Your order has been placed successfully and is being processed. We've sent a confirmation email to <span className="font-semibold text-slate-900">{order?.customer_email || 'your email'}</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Order Details Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Order Summary</h2>
                <span className="text-xs font-bold text-brand uppercase tracking-wider">#{orderNumber}</span>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {order?.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1 pr-4">
                        <p className="font-medium text-slate-800 line-clamp-1">{item.product_name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Quantity: {item.quantity}</p>
                      </div>
                      <span className="font-bold text-slate-900">{formatCurrency(item.total)}</span>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Subtotal</span>
                      <span>{formatCurrency(order?.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Shipping</span>
                      <span>{formatCurrency(order?.shipping_cost || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-2">
                      <span>Total Paid</span>
                      <span className="text-brand text-base">{formatCurrency(order?.total || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Info Card for Guest */}
            <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-6">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <ClipboardCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-blue-900">Track Your Order</h3>
                  <p className="text-xs text-blue-700/80 mt-1 leading-relaxed">
                    Save your order number <span className="font-bold">#{orderNumber}</span> to track your order status on our tracking page.
                  </p>
                  <Link href="/track-order" className="inline-flex items-center text-xs font-bold text-blue-600 mt-3 hover:text-blue-700 transition-colors">
                    Go to Track Order <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-900">Delivery Information</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 shrink-0">
                    <MapPin className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Shipping Address</p>
                    <div className="text-sm text-slate-600 mt-1 leading-relaxed">
                      {parseShippingAddress(order?.shipping_address || '')}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 shrink-0">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Payment Method</p>
                    <p className="text-sm font-bold text-slate-900 mt-1 uppercase">
                      {order?.payment_method || 'N/A'}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-[10px] text-green-600 font-bold uppercase tracking-wide">
                        {order?.payment_status === 'paid' ? 'Verified' : 'Processing'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-3">
              <Link href={order ? `/order-status?id=${order.order_number}` : `/track-order`} className="w-full">
                <Button className="w-full bg-brand hover:bg-brand/90 text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2">
                  <Package className="w-4 h-4" /> View Live Status
                </Button>
              </Link>
              <Link href="/shop" className="w-full">
                <Button variant="outline" className="w-full border-slate-200 text-slate-600 font-bold h-12 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50">
                  <ShoppingBag className="w-4 h-4" /> Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mb-4"></div>
        <p className="text-slate-500 font-medium">Loading confirmation details...</p>
      </div>
    }>
      <CheckoutSuccessPageContent />
    </Suspense>
  );
}

