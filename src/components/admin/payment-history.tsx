'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Payment {
  id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  invoice?: {
    id: number;
    invoice_number: string;
  };
}

interface PaymentHistoryProps {
  orderId: string;
  orderTotal: number;
  onRefresh?: () => void;
}

const paymentMethods: Record<string, string> = {
  cod: 'Cash on Delivery',
  online: 'Online Payment',
  stripe: 'Stripe/Card',
  bank_transfer: 'Bank Transfer',
  other: 'Other'
};

const statusConfig: Record<string, { label: string; color: string }> = {
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 border-green-300' },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800 border-red-300' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800 border-gray-300' }
};

export default function PaymentHistory({ orderId, orderTotal, onRefresh }: PaymentHistoryProps) {
  const { formatCurrency } = useCurrency();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [orderId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const url = `/sales/orders/${orderId}/payments`;
      console.log('Fetching payments from:', url);
      console.log('Full URL would be:', process.env.NEXT_PUBLIC_API_URL + url);
      const response = await api.get(url);
      console.log('Payment response:', response.data);
      setPayments(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to fetch payments:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate payment summary
  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

  const remainingBalance = orderTotal - totalPaid;
  const paymentStatus = remainingBalance <= 0 ? 'paid' : totalPaid > 0 ? 'partially_paid' : 'unpaid';

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Payment History
        </h3>
      </div>

      <div className="p-6">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-sm text-slate-600">Loading payment history...</p>
          </div>
        )}

        {/* Payment Summary */}
        {!loading && (
          <div className="space-y-3 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Total Paid</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Remaining</p>
                <p className="text-2xl font-bold text-orange-700">{formatCurrency(Math.max(0, remainingBalance))}</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Order Total</p>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(orderTotal)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Status Badge */}
        {!loading && (
          <div className="mb-6">
            <span className={`px-4 py-2 text-sm font-bold rounded-full border-2 ${
              paymentStatus === 'paid' ? 'bg-green-100 text-green-800 border-green-300' :
              paymentStatus === 'partially_paid' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
              'bg-red-100 text-red-800 border-red-300'
            }`}>
              {paymentStatus === 'paid' ? 'Fully Paid' :
               paymentStatus === 'partially_paid' ? 'Partially Paid' :
               'Unpaid'}
            </span>
          </div>
        )}

        {/* Payments List */}
        {!loading && payments.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p className="mt-2 text-sm text-slate-600">No payments recorded yet</p>
          </div>
        ) : !loading && payments.length > 0 && (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200 hover:border-purple-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                      <span className={`px-2 sm:px-3 py-1 text-xs font-bold rounded-full border-2 ${statusConfig[payment.status]?.color || 'bg-gray-100'}`}>
                        {statusConfig[payment.status]?.label || payment.status}
                      </span>
                      <span className="text-xs text-slate-500">
                        {paymentMethods[payment.payment_method] || payment.payment_method}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-base sm:text-lg font-bold text-slate-900">{formatCurrency(parseFloat(payment.amount.toString()))}</p>
                      {payment.reference_number && (
                        <p className="text-xs text-slate-600 truncate">
                          <span className="font-semibold">Ref:</span> {payment.reference_number}
                        </p>
                      )}
                      {payment.invoice && (
                        <p className="text-xs text-slate-600 truncate">
                          <span className="font-semibold">Invoice:</span> {payment.invoice.invoice_number}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right sm:text-right">
                    <p className="text-xs text-slate-500">{formatDate(payment.payment_date)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
