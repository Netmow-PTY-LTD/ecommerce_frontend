'use client';

import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShoppingBag, User, Package, Heart, MapPin, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function AccountPage() {
  const { customer, isAuthenticated, loading, logout } = useCustomerAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new customer dashboard
    if (!loading && isAuthenticated && customer) {
      router.replace('/customer/dashboard');
    }
  }, [isAuthenticated, loading, customer, router]);

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
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600 mt-2">Welcome back, {customer.name}!</p>
        </div>

        {/* Loading Message - Will redirect automatically */}
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-6"></div>
          <p className="text-gray-600 mb-2">Redirecting to your dashboard...</p>
          <p className="text-sm text-gray-500">Click here if not redirected:</p>
          <Link
            href="/customer/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
