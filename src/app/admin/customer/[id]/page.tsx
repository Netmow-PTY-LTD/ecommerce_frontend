'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/admin-layout';

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  tax_id: string | null;
  credit_limit: number;
  outstanding_balance: number;
  customer_type: 'individual' | 'company';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  total: number;
  payment_status: string;
  created_at: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const { isAuthenticated, loading } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, router]);

  const fetchCustomer = async () => {
    try {
      setLoadingCustomer(true);
      const response = await api.get(`/customers/${id}`);
      setCustomer(response.data.data);
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(error.response?.data?.message || 'Failed to load customer');
    } finally {
      setLoadingCustomer(false);
    }
  };

  const fetchCustomerOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await api.get(`/sales/orders?customer_id=${id}&limit=5`);
      setOrders(response.data.data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomer();
      fetchCustomerOrders();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, id]);

  if (loading || loadingCustomer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
            {error || 'Customer not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      title={customer.name}
      subtitle="Customer details and management"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Action Button */}
        <div className="flex justify-end">
          <a
            href={`/admin/customer/${customer.id}/edit`}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Customer
          </a>
        </div>
        {/* Customer Info Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Customer Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Name</label>
                <p className="text-lg font-semibold text-slate-900">{customer.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Company</label>
                <p className="text-lg text-slate-900">{customer.company || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
                <p className="text-lg text-slate-900">{customer.email || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Phone</label>
                <p className="text-lg text-slate-900">{customer.phone || '-'}</p>
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-500 mb-1">Address</label>
                <p className="text-lg text-slate-900">
                  {customer.address || '-'}
                  {customer.city && `, ${customer.city}`}
                  {customer.state && `, ${customer.state}`}
                  {customer.postal_code && ` ${customer.postal_code}`}
                  {customer.country && `, ${customer.country}`}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Tax ID</label>
                <p className="text-lg text-slate-900">{customer.tax_id || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Customer Type</label>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  customer.customer_type === 'company'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {customer.customer_type === 'company' ? 'Business' : 'Individual'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Status</label>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  customer.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {customer.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Info Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Financial Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                <label className="block text-sm font-medium text-slate-600 mb-1">Credit Limit</label>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(customer.credit_limit || 0)}</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4">
                <label className="block text-sm font-medium text-slate-600 mb-1">Outstanding Balance</label>
                <p className={`text-2xl font-bold ${customer.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(customer.outstanding_balance || 0)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                <label className="block text-sm font-medium text-slate-600 mb-1">Available Credit</label>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency((customer.credit_limit || 0) - (customer.outstanding_balance || 0))}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
                <label className="block text-sm font-medium text-slate-600 mb-1">Created At</label>
                <p className="text-sm font-semibold text-slate-900">
                  {new Date(customer.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
            {orders.length > 0 && (
              <a
                href={`/admin/orders?customer_id=${customer.id}`}
                className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
              >
                View All Orders
              </a>
            )}
          </div>
          <div className="p-6">
            {loadingOrders ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-xl">
                <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm text-slate-500 mb-2">No orders found</p>
                <p className="text-xs text-slate-400">{`This customer hasn't placed any orders yet`}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Order #</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Payment</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{order.order_number}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'delivered'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.payment_status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {formatCurrency(order.total || 0)}
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={`/admin/order/${order.id}`}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
