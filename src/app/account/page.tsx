'use client';

import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShoppingBag, User, LogOut, Package, Heart, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function AccountPage() {
  const { customer, isAuthenticated, loading, logout } = useCustomerAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600 mt-2">Welcome back, {customer.name}!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
                  <p className="text-gray-600">{customer.email || customer.phone}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <User className="w-5 h-5" />
                  <span className="text-sm">
                    {customer.customer_type === 'company' ? 'Business Account' : 'Personal Account'}
                  </span>
                </div>
                {customer.company && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <ShoppingBag className="w-5 h-5" />
                    <span className="text-sm">{customer.company}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin className="w-5 h-5" />
                    <span className="text-sm">
                      {customer.address}
                      {customer.city && `, ${customer.city}`}
                      {customer.state && `, ${customer.state}`}
                      {customer.country && `, ${customer.country}`}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Account Menu */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Orders */}
              <Link href="/account/orders" className="group">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Package className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        My Orders
                      </h3>
                      <p className="text-sm text-gray-600">View your order history</p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Wishlist */}
              <Link href="/account/wishlist" className="group">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Heart className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
                        Wishlist
                      </h3>
                      <p className="text-sm text-gray-600">View saved items</p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Profile */}
              <Link href="/account/profile" className="group">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <User className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                        Profile Settings
                      </h3>
                      <p className="text-sm text-gray-600">Update your information</p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Addresses */}
              <Link href="/account/addresses" className="group">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <MapPin className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                        Addresses
                      </h3>
                      <p className="text-sm text-gray-600">Manage delivery addresses</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-indigo-600">Active</p>
                  <p className="text-sm text-gray-600">Status</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {customer.credit_limit ? `$${customer.credit_limit.toLocaleString()}` : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">Credit Limit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
