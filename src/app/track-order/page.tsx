'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, Mail, Calendar, ArrowRight, ArrowLeft, ExternalLink, Hash } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import Link from 'next/link';

interface Order {
    id: number;
    order_number: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    payment_status: 'pending' | 'paid' | 'failed';
    payment_method: string;
    total_amount: number;
    created_at: string;
    customer_email: string;
    customer_name: string | null;
}

type SearchType = 'email' | 'orderNumber';

export default function TrackOrderPage() {
    const router = useRouter();
    const { formatCurrency } = useCurrency();
    const [searchType, setSearchType] = useState<SearchType>('orderNumber');
    const [email, setEmail] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (searchType === 'email') {
            if (!email.trim()) {
                toast.error('Please enter your email address');
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                toast.error('Please enter a valid email address');
                return;
            }
        } else {
            if (!orderNumber.trim()) {
                toast.error('Please enter your order number');
                return;
            }
        }

        setLoading(true);
        try {
            if (searchType === 'email') {
                const response = await api.post('/sales/public/lookup-orders', { email });
                const data = response.data?.data || response.data || [];
                setOrders(data);
                setSearched(true);

                if (data.length === 0) {
                    toast.info('No orders found for this email address');
                } else {
                    toast.success(`Found ${data.length} order${data.length > 1 ? 's' : ''}`);
                }
                setLoading(false);
            } else {
                // Search by order number - redirect directly to order status page
                toast.success('Looking up your order...');
                setTimeout(() => {
                    router.push(`/order-status?id=${encodeURIComponent(orderNumber)}`);
                }, 500);
                // Keep loading true as we are redirecting
            }
        } catch (error: any) {
            console.error('Error looking up orders:', error);
            toast.error(error.response?.data?.message || 'Failed to lookup orders');
            setOrders([]);
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
        });
    };

    return (
        <div className="min-h-screen bg-slate-50">
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
                            <h1 className="text-white font-bold text-sm md:text-base tracking-wide hidden sm:block">Track Your Order</h1>
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
                            <Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
                            <span className="text-white/50">-</span>
                            <span className="text-white">Track Order</span>
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search Section */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
                    <div className="px-6 py-8">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Package className="w-6 h-6 text-slate-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-1">Find Your Orders</h2>
                            <p className="text-sm text-slate-500">
                                Search by email or order number to track your orders
                            </p>
                        </div>

                        {/* Search Type Toggle */}
                        <div className="flex justify-center mb-6">
                            <div className="bg-slate-100 rounded-lg p-1 inline-flex">
                                <button
                                    type="button"
                                    onClick={() => setSearchType('orderNumber')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${searchType === 'orderNumber'
                                        ? 'bg-brand text-white shadow-sm'
                                        : 'text-slate-500 hover:text-brand'
                                        }`}
                                >
                                    Order Number
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSearchType('email')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${searchType === 'email'
                                        ? 'bg-brand text-white shadow-sm'
                                        : 'text-slate-500 hover:text-brand'
                                        }`}
                                >
                                    Email Address
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSearch} className="max-w-md mx-auto">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative flex-1">
                                    {searchType === 'email' ? (
                                        <>
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Email address"
                                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-brand focus:border-brand text-sm transition-all"
                                                disabled={loading}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input
                                                type="text"
                                                value={orderNumber}
                                                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                                                placeholder="Order number"
                                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-brand focus:border-brand text-sm transition-all uppercase"
                                                disabled={loading}
                                            />
                                        </>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-brand hover:bg-brand/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                            Searching...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4" />
                                            Search
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Helper Text */}
                        <div className="mt-4 text-center text-sm text-slate-500">
                            {searchType === 'orderNumber' ? (
                                <p>Enter your order number exactly as shown in your order confirmation</p>
                            ) : (
                                <p>Enter the email address you used during checkout</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Results Section - Only for email search */}
                {searched && searchType === 'email' && (
                    <div className="space-y-4">
                        {orders.length > 0 ? (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        Your Orders ({orders.length})
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        Showing orders for {email}
                                    </p>
                                </div>

                                {orders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                                    >
                                        <div className="p-4">
                                            {/* Order Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                                <div>
                                                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                        {order.order_number}
                                                        <a
                                                            href={`/order-status?id=${encodeURIComponent(order.order_number)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-slate-400 hover:text-slate-600"
                                                            title="View in new tab"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                    </h4>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(order.created_at)}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusColor(order.status)}`}>
                                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPaymentStatusColor(order.payment_status)}`}>
                                                        {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPaymentMethodBadge(order.payment_method).color}`}>
                                                        {getPaymentMethodBadge(order.payment_method).label}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Order Details */}
                                            <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-50">
                                                <div>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Total Amount</p>
                                                    <p className="text-base font-bold text-slate-900">
                                                        {formatCurrency(order.total_amount)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Payment Method</p>
                                                    <p className="text-base font-medium text-slate-900">
                                                        {getPaymentMethodBadge(order.payment_method).label}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-50">
                                                <Link
                                                    href={`/order-status?id=${encodeURIComponent(order.order_number)}`}
                                                    className="flex-1 bg-brand hover:bg-brand/90 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                                >
                                                    View Order Details
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Package className="w-6 h-6 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">No Orders Found</h3>
                                <p className="text-sm text-slate-500 mb-6">
                                    We couldn't find any orders associated with this email address.
                                </p>
                                <div className="mt-6 pt-6 border-t border-slate-50">
                                    <Link
                                        href="/shop"
                                        className="inline-block px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors cursor-pointer"
                                    >
                                        Continue Shopping
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Help Section */}
                {searched && searchType === 'email' && orders.length > 0 && (
                    <div className="mt-6 bg-slate-100/50 rounded-lg border border-slate-200 p-4">
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">Need Help?</h3>
                        <p className="text-xs text-slate-500">
                            If you have any questions about your orders, please contact our customer support team.
                        </p>
                        <Link
                            href="/contact"
                            className="inline-block mt-2 text-xs font-medium text-brand hover:underline cursor-pointer"
                        >
                            Contact Support →
                        </Link>
                    </div>
                )}

                {/* Quick Tips Section */}
                <div className="mt-6 bg-indigo-50/30 rounded-lg border border-indigo-100 p-4">
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">💡 Quick Tips</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-xs">
                        <div>
                            <h4 className="font-medium text-slate-900 mb-0.5">By Order Number</h4>
                            <p className="text-slate-500">Fastest way - takes you directly to your order details</p>
                        </div>
                        <div>
                            <h4 className="font-medium text-slate-900 mb-0.5">By Email Address</h4>
                            <p className="text-slate-500">View all orders placed with your email address</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
