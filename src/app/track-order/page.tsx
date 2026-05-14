'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, Mail, Calendar, DollarSign, CreditCard, ArrowRight, ExternalLink, Hash } from 'lucide-react';
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
            } else {
                // Search by order number - redirect directly to order status page
                // The order-status page will handle the lookup
                toast.success('Looking up your order...');
                setTimeout(() => {
                    router.push(`/order-status?id=${orderNumber}`);
                }, 500);
            }
        } catch (error: any) {
            console.error('Error looking up orders:', error);
            toast.error(error.response?.data?.message || 'Failed to lookup orders');
            setOrders([]);
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
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {/* Header */}
            <nav className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center text-slate-600 hover:text-indigo-600 transition-colors font-medium">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7 7M5 10v10a2 2 0 002 2h2a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2h2" />
                                </svg>
                                Back to Store
                            </Link>
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">Track Your Order</h1>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Search Section */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-8 border-b border-slate-200">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Package className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Find Your Orders</h2>
                            <p className="text-slate-600">
                                Search by email or order number to track your orders
                            </p>
                        </div>

                        {/* Search Type Toggle */}
                        <div className="flex justify-center mb-6">
                            <div className="bg-white rounded-lg p-1 shadow-sm border border-slate-200 inline-flex">
                                <button
                                    type="button"
                                    onClick={() => setSearchType('orderNumber')}
                                    className={`px-6 py-2 rounded-md font-medium transition-all ${
                                        searchType === 'orderNumber'
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-slate-600 hover:text-indigo-600'
                                    }`}
                                >
                                    <Hash className="w-4 h-4 inline mr-2" />
                                    Order Number
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSearchType('email')}
                                    className={`px-6 py-2 rounded-md font-medium transition-all ${
                                        searchType === 'email'
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-slate-600 hover:text-indigo-600'
                                    }`}
                                >
                                    <Mail className="w-4 h-4 inline mr-2" />
                                    Email Address
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSearch} className="max-w-lg mx-auto">
                            <div className="relative">
                                {searchType === 'email' ? (
                                    <>
                                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email address"
                                            className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg transition-all"
                                            disabled={loading}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            value={orderNumber}
                                            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                                            placeholder="Enter your order number (e.g., ORD-1234567890-123)"
                                            className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg transition-all uppercase"
                                            disabled={loading}
                                        />
                                    </>
                                )}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                                        className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow"
                                    >
                                        <div className="p-6">
                                            {/* Order Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                                <div>
                                                    <h4 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                                        {order.order_number}
                                                        <a
                                                            href={`/order-status?id=${order.order_number}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-indigo-600 hover:text-indigo-700"
                                                            title="View in new tab"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    </h4>
                                                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(order.created_at)}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${getStatusColor(order.status)}`}>
                                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                    </span>
                                                    <span className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${getPaymentStatusColor(order.payment_status)}`}>
                                                        {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                                                    </span>
                                                    <span className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${getPaymentMethodBadge(order.payment_method).color}`}>
                                                        {getPaymentMethodBadge(order.payment_method).label}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Order Details */}
                                            <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-100">
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Amount</p>
                                                    <p className="text-lg font-bold text-slate-900 flex items-center gap-1">
                                                        <DollarSign className="w-4 h-4" />
                                                        {formatCurrency(order.total_amount)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Payment Method</p>
                                                    <p className="text-lg font-medium text-slate-900 flex items-center gap-1">
                                                        <CreditCard className="w-4 h-4" />
                                                        {getPaymentMethodBadge(order.payment_method).label}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                                                <Link
                                                    href={`/order-status?id=${order.order_number}`}
                                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Package className="w-4 h-4" />
                                                    View Order Details
                                                    <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Package className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No Orders Found</h3>
                                <p className="text-slate-600 mb-6">
                                    We couldn't find any orders associated with this email address.
                                </p>
                                <div className="space-y-2 text-sm text-slate-500">
                                    <p>Please check:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>The email address is spelled correctly</li>
                                        <li>You're using the same email from your order</li>
                                        <li>Your order was successfully placed</li>
                                    </ul>
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-100">
                                    <Link
                                        href="/shop"
                                        className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
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
                    <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
                        <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
                        <p className="text-sm text-blue-700">
                            If you have any questions about your orders, please contact our customer support team.
                        </p>
                        <Link
                            href="/"
                            className="inline-block mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            Contact Support →
                        </Link>
                    </div>
                )}

                {/* Quick Tips Section */}
                <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
                    <h3 className="font-semibold text-purple-900 mb-3">💡 Quick Tips</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-purple-700">
                        <div>
                            <h4 className="font-medium mb-1">By Order Number (Recommended)</h4>
                            <p className="text-purple-600">Fastest way - takes you directly to your order details</p>
                        </div>
                        <div>
                            <h4 className="font-medium mb-1">By Email Address</h4>
                            <p className="text-purple-600">View all orders placed with your email address</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
