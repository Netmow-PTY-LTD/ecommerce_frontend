'use client';

import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShoppingBag, Heart, User, MapPin, LogOut, Package, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useCartStore, useWishlistStore } from '@/lib/store';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/lib/api';

export default function CustomerDashboard() {
  const { customer, loading, isAuthenticated, logout } = useCustomerAuth();
  const router = useRouter();
  const { items } = useCartStore();
  const wishlistItems = useWishlistStore((state) => state.items);
  const { formatCurrency } = useCurrency();
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalSpent: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && customer) {
      fetchOrderStats();
    }
  }, [isAuthenticated, customer]);

  const fetchOrderStats = async () => {
    try {
      setLoadingStats(true);
      const response = await api.get('/sales/customer/orders');
      if (response.data && response.data.data) {
        const orders = response.data.data;
        const totalOrders = orders.length;
        const pendingOrders = orders.filter((o: any) => o.status === 'pending' || o.status === 'processing').length;
        const deliveredOrders = orders.filter((o: any) => o.status === 'delivered').length;
        const totalSpent = orders
          .filter((o: any) => o.status !== 'cancelled')
          .reduce((sum: number, o: any) => sum + parseFloat(o.total_amount || 0), 0);

        setOrderStats({
          totalOrders,
          pendingOrders,
          deliveredOrders,
          totalSpent
        });
      }
    } catch (error) {
      console.error('Failed to fetch order stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !customer) {
    return null;
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
              <p className="text-gray-600">Welcome back, {customer.name}!</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <ShoppingBag className="h-5 w-5" />
                <span>Continue Shopping</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Account Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-2">
              <Link
                href="/customer/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-50 text-indigo-700 font-medium"
              >
                <User className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/customer/orders"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
              >
                <Package className="h-5 w-5" />
                <span>My Orders</span>
              </Link>
              <Link
                href="/wishlist"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
              >
                <Heart className="h-5 w-5" />
                <span>Wishlist</span>
                {items.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {items.length}
                  </span>
                )}
              </Link>
              <Link
                href="/customer/addresses"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
              >
                <MapPin className="h-5 w-5" />
                <span>Addresses</span>
              </Link>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Account Overview */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Account Overview</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Orders */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-4">
                    <Package className="h-8 w-8 text-blue-600" />
                    <span className="text-3xl font-bold text-gray-900">
                      {loadingStats ? '...' : orderStats.totalOrders}
                    </span>
                  </div>
                  <p className="text-gray-600 font-medium">Total Orders</p>
                  <Link href="/customer/orders" className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block">
                    View Orders →
                  </Link>
                </div>

                {/* Wishlist Items */}
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-100">
                  <div className="flex items-center justify-between mb-4">
                    <Heart className="h-8 w-8 text-pink-600" />
                    <span className="text-3xl font-bold text-gray-900">{wishlistItems.length}</span>
                  </div>
                  <p className="text-gray-600 font-medium">Wishlist Items</p>
                  <Link href="/wishlist" className="text-sm text-pink-600 hover:text-pink-700 mt-2 inline-block">
                    View Wishlist →
                  </Link>
                </div>

                {/* Total Spent */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <div className="flex items-center justify-between mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <span className="text-xl font-bold text-green-700">
                      {loadingStats ? '...' : formatCurrency(orderStats.totalSpent)}
                    </span>
                  </div>
                  <p className="text-gray-600 font-medium">Total Spent</p>
                  <p className="text-sm text-green-600 mt-2">
                    {orderStats.totalOrders} {orderStats.totalOrders === 1 ? 'order' : 'orders'} placed
                  </p>
                </div>
              </div>

              {/* Additional Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {/* Pending Orders */}
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-100">
                  <div className="flex items-center justify-between mb-4">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <span className="text-3xl font-bold text-gray-900">
                      {loadingStats ? '...' : orderStats.pendingOrders}
                    </span>
                  </div>
                  <p className="text-gray-600 font-medium">Pending Orders</p>
                  <p className="text-sm text-yellow-600 mt-2">
                    {orderStats.pendingOrders > 0 ? 'Being processed' : 'No pending orders'}
                  </p>
                </div>

                {/* Delivered Orders */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100">
                  <div className="flex items-center justify-between mb-4">
                    <CheckCircle className="h-8 w-8 text-purple-600" />
                    <span className="text-3xl font-bold text-gray-900">
                      {loadingStats ? '...' : orderStats.deliveredOrders}
                    </span>
                  </div>
                  <p className="text-gray-600 font-medium">Delivered Orders</p>
                  <p className="text-sm text-purple-600 mt-2">
                    {orderStats.deliveredOrders > 0 ? 'Successfully delivered' : 'No deliveries yet'}
                  </p>
                </div>

                {/* Account Status */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <div className="flex items-center justify-between mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <span className="text-lg font-bold text-green-700">Active</span>
                  </div>
                  <p className="text-gray-600 font-medium">Account Status</p>
                  <p className="text-sm text-green-600 mt-2">
                    {customer.customer_type === 'individual' ? 'Individual' : 'Business'} Account
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900 font-medium mt-1">{customer.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900 font-medium mt-1">{customer.email || 'Not provided'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900 font-medium mt-1">{customer.phone || 'Not provided'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Customer Type</label>
                  <p className="text-gray-900 font-medium mt-1 capitalize">{customer.customer_type}</p>
                </div>

                {(customer.address || customer.city || customer.state) && (
                  <>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-gray-900 font-medium mt-1">
                        {customer.address && `${customer.address}, `}
                        {customer.city && `${customer.city}, `}
                        {customer.state && customer.state}
                        {customer.postal_code && ` ${customer.postal_code}`}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 pt-6 border-t">
                <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>

              {loadingStats ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your orders...</p>
                </div>
              ) : orderStats.totalOrders > 0 ? (
                <div className="space-y-4">
                  {/* Show recent orders - would need to pass order data here */}
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-indigo-400 mb-3" />
                    <p className="text-gray-600 mb-2">You have {orderStats.totalOrders} {orderStats.totalOrders === 1 ? 'order' : 'orders'}</p>
                    <Link
                      href="/customer/orders"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      <Package className="h-5 w-5" />
                      View All Orders
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-2">No recent activity</p>
                  <p className="text-gray-400 text-sm mb-6">Start shopping to see your orders here</p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Start Shopping
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-sm p-8 text-white">
              <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/"
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors"
                >
                  <ShoppingBag className="h-6 w-6" />
                  <span className="font-medium">Shop Now</span>
                </Link>
                <Link
                  href="/wishlist"
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors"
                >
                  <Heart className="h-6 w-6" />
                  <span className="font-medium">View Wishlist</span>
                </Link>
                <Link
                  href="/customer/orders"
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors"
                >
                  <Package className="h-6 w-6" />
                  <span className="font-medium">Track Orders</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
