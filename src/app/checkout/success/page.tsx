"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Home, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';

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

    useEffect(() => {
        const loadOrderDetails = async () => {
            try {
                console.log('🔍 Success page loaded');
                console.log('URL params:', Object.fromEntries(searchParams));

                // Check localStorage
                const lastOrderId = localStorage.getItem('lastOrderId');
                const lastOrderNumber = localStorage.getItem('lastOrderNumber');
                console.log('📦 localStorage:', { lastOrderId, lastOrderNumber });

                // Check if this is a COD order (no session_id)
                const sessionId = searchParams.get('session_id');
                console.log('💳 Session ID:', sessionId);

                if (!sessionId && !lastOrderId) {
                    console.log('❌ No session_id and no lastOrderId');
                    setTimeout(() => {
                        setHasError(true);
                        setIsLoading(false);
                        setShowLoader(false);
                    }, 1500);
                    return;
                }

                let orderId: string | null = null;

                // For COD orders, we already have the order created
                if (!sessionId && lastOrderId && lastOrderNumber) {
                    console.log('✅ COD Order:', { lastOrderId, lastOrderNumber });
                    setOrderNumber(lastOrderNumber);
                    orderId = lastOrderId;
                    localStorage.removeItem('lastOrderId');
                    localStorage.removeItem('lastOrderNumber');
                    setShowLoader(false);
                }

                // For online payments, process the order from session
                if (sessionId) {
                    console.log('💳 Processing online payment order');
                    const pendingOrderStr = localStorage.getItem('pendingOrder');
                    if (!pendingOrderStr) {
                        toast.error('Order details not found');
                        setTimeout(() => {
                            setHasError(true);
                            setIsLoading(false);
                            setShowLoader(false);
                        }, 1500);
                        return;
                    }

                    const pendingOrder = JSON.parse(pendingOrderStr);

                    // Create order in database
                    const response = await api.post('/sales/public/checkout-order', {
                        stripe_session_id: sessionId,
                        payment_method: pendingOrder.payment_method,
                        customer_email: pendingOrder.customer_email,
                        customer_phone: pendingOrder.customer_phone,
                        shipping_address: pendingOrder.shipping_address,
                        items: pendingOrder.items,
                        subtotal: pendingOrder.subtotal,
                        shipping_cost: pendingOrder.shipping_cost,
                        tax_amount: pendingOrder.tax_amount,
                        total_amount: pendingOrder.total_amount
                    });

                    if (response.data?.data?.order_number) {
                        setOrderNumber(response.data.data.order_number);
                        orderId = String(response.data.data.id);
                        localStorage.removeItem('pendingOrder');
                        setShowLoader(false);
                    } else {
                        const fallbackOrderNumber = `ORD-${Date.now().toString().slice(-8)}`;
                        setOrderNumber(fallbackOrderNumber);
                        localStorage.removeItem('pendingOrder');
                        setShowLoader(false);
                    }
                }

                // Fetch full order details — try public endpoint first, fall back to customer endpoint
                if (orderId) {
                    try {
                        let data: any = null;

                        try {
                            // Public endpoint — works for guests
                            const orderResponse = await api.get(`/sales/public/orders/${orderId}`);
                            data = orderResponse.data?.data || orderResponse.data;
                        } catch (publicErr: any) {
                            console.warn('Public order endpoint failed, trying customer endpoint...', publicErr?.response?.status);
                            // Fallback: customer auth endpoint (works for logged-in users)
                            const orderResponse = await api.get(`/sales/customer/orders/${orderId}`);
                            data = orderResponse.data?.data || orderResponse.data;
                        }

                        if (data && data.id) {
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
                            toast.success(`Order #${data.order_number} confirmed!`);
                        }
                    } catch (orderError: any) {
                        console.warn('Could not fetch order details (non-fatal):', orderError?.response?.status, orderError?.message);
                        // Non-fatal — we still have the order number, show success anyway
                    }
                }

                setIsLoading(false);
                setShowLoader(false);
            } catch (error: any) {
                console.error('❌ Error on success page:', error);
                setShowLoader(false);
                setHasError(true);
                localStorage.removeItem('pendingOrder');
                localStorage.removeItem('lastOrderId');
                localStorage.removeItem('lastOrderNumber');
                toast.error('Order confirmed but failed to load details');
                setIsLoading(false);
            }
        };

        loadOrderDetails();
    }, [searchParams]);


    // Show loading state while fetching order details
    if (showLoader) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-2xl w-full text-center"
                >
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 px-12 py-16">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-6"></div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Processing Your Order...</h2>
                        <p className="text-slate-600">Please wait while we confirm your order details.</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Show error state if no order found
    if (hasError) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-2xl w-full"
                >
                    <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-8">
                        {/* Info Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-24 h-24 mx-auto bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center"
                        >
                            <Package className="h-12 w-12 text-amber-600 dark:text-amber-400" />
                        </motion.div>

                        {/* Message */}
                        <div className="space-y-3">
                            <h1 className="text-3xl font-bold">No Order Found</h1>
                            <p className="text-lg text-muted-foreground">
                                We couldn't find any order information. You may have reached this page directly without completing a purchase.
                            </p>
                        </div>

                        {/* Explanation */}
                        <div className="bg-secondary/30 rounded-xl p-6 text-left">
                            <p className="text-sm text-muted-foreground">
                                This page is shown after successfully completing an order. To place an order, please visit our shop and go through the checkout process.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Link href="/shop">
                                <Button size="lg" className="w-full sm:w-auto">
                                    <ShoppingBag className="h-4 w-4 mr-2" />
                                    Browse Products
                                </Button>
                            </Link>
                            <Link href="/cart">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                                    View Cart
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="max-w-2xl w-full"
            >
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-12 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6"
                        >
                            <CheckCircle className="h-12 w-12 text-green-600" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-3">Order Confirmed!</h1>
                        {orderNumber && (
                            <p className="text-lg text-slate-700 mb-4">
                                Order #{orderNumber}
                            </p>
                        )}
                        <p className="text-slate-600 mb-8">
                            Thank you for your purchase. Your order has been placed successfully.
                        </p>

                        {/* Action Buttons — always visible regardless of whether order details loaded */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            {order ? (
                                <Link href={`/order-status?id=${order.id}`}>
                                    <Button size="lg" className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                                        <Package className="h-4 w-4 mr-2" />
                                        View Order Status
                                    </Button>
                                </Link>
                            ) : (
                                <Link href="/customer/dashboard">
                                    <Button size="lg" className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                                        <Package className="h-4 w-4 mr-2" />
                                        View My Orders
                                    </Button>
                                </Link>
                            )}
                            <Link href="/shop">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                                    <Home className="h-4 w-4 mr-2" />
                                    Continue Shopping
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Order Details — only shown when details were successfully fetched */}
                    {order && (
                        <div className="px-8 py-6 border-t border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Order Summary</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-slate-600">
                                    <span>Order Number</span>
                                    <span className="font-medium text-slate-900">#{order.order_number}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Status</span>
                                    <span className="capitalize font-medium text-slate-900">{order.status}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Payment Method</span>
                                    <span className="uppercase font-medium text-slate-900">{order.payment_method}</span>
                                </div>
                                {order.items?.length > 0 && (
                                    <>
                                        <div className="border-t border-slate-100 pt-3 mt-3">
                                            <p className="font-medium text-slate-700 mb-2">Items</p>
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-slate-600 py-1">
                                                    <span>{item.product_name} × {item.quantity}</span>
                                                    <span className="font-medium">{formatCurrency(item.total)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border-t border-slate-100 pt-2 flex justify-between font-semibold text-slate-900">
                                            <span>Total</span>
                                            <span>{formatCurrency(order.total)}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}


// Wrapper component with Suspense boundary
export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <CheckoutSuccessPageContent />
        </Suspense>
    );
}

