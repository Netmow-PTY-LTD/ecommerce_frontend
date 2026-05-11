'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import AdminLayout from '@/components/admin/admin-layout';
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Banknote,
  Wallet,
  TrendingUp,
  AlertCircle,
  ArrowDown,
} from 'lucide-react';

interface PaymentSummary {
  total_orders: number;
  total_order_amount: number;
  fully_paid: number;
  partially_paid: number;
  unpaid: number;
  total_collected: number;
  collection_rate: number;
}

interface PaymentTransaction {
  order_id: number;
  order_number: string;
  order_date: string;
  order_total: number;
  payment_status: string;
  payment_method: string;
  amount_paid: number;
  balance_due: number;
  payment_count: number;
  payment_details: Array<{
    method: string;
    status: string;
    amount: number;
  }>;
}

const methodIcons: Record<string, any> = {
  cod: Banknote,
  cash: Banknote,
  online: Wallet,
  stripe: CreditCard,
  card: CreditCard,
  other: CreditCard,
};

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  paid: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
  partially_paid: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  unpaid: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  pending: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
};

export default function PaymentsAnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { formatCurrency } = useCurrency();

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/admin/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) fetchAll();
  }, [isAuthenticated, startDate, endDate]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/payments/reconciliation', {
        params: { start_date: startDate, end_date: endDate }
      });

      setPaymentSummary(res.data?.data?.summary);
      setTransactions(res.data?.data?.transactions || []);
    } catch (err) {
      console.error('Failed to fetch payment reconciliation:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Reconciliation</h1>
            <p className="text-slate-500 mt-1 text-sm">Track payments, collections, and outstanding balances</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl shadow-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={fetchAll}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">Total Orders</p>
              <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                <CreditCard size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {paymentSummary?.total_orders || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {formatCurrency(paymentSummary?.total_order_amount || 0)} total value
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">Collected</p>
              <div className="bg-green-100 p-2 rounded-xl text-green-600">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(paymentSummary?.total_collected || 0)}
            </p>
            <p className="text-sm font-medium text-green-600 mt-1">
              {paymentSummary?.collection_rate.toFixed(1) || 0}% collection rate
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">Pending</p>
              <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                <Clock size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {formatCurrency(paymentSummary?.partially_paid || 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Partially paid</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600">Outstanding</p>
              <div className="bg-red-100 p-2 rounded-xl text-red-600">
                <XCircle size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(paymentSummary?.unpaid || 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Unpaid orders</p>
          </div>
        </div>

        {/* Collection Health */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Collection Health</p>
              <p className="text-3xl font-bold">{paymentSummary?.collection_rate.toFixed(1) || 0}%</p>
              <p className="text-sm opacity-80 mt-1">
                {formatCurrency(paymentSummary?.total_collected || 0)} of {formatCurrency(paymentSummary?.total_order_amount || 0)} collected
              </p>
            </div>
            <div className="p-4 bg-white/20 rounded-2xl">
              <TrendingUp size={48} />
            </div>
          </div>
        </div>

        {/* Payment Status Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-xl text-green-600">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Fully Paid</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(paymentSummary?.fully_paid || 0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Partially Paid</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(paymentSummary?.partially_paid || 0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-xl text-red-600">
                <XCircle size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Unpaid</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(paymentSummary?.unpaid || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Transaction Details</h3>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No transaction data</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Order Total</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Amount Paid</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Balance Due</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Payments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {transactions.map((txn) => {
                    const statusStyle = statusColors[txn.payment_status] || statusColors.pending;
                    const StatusIcon = statusStyle.icon;
                    const hasBalance = txn.balance_due > 0;

                    return (
                      <tr key={txn.order_id} className={`hover:bg-slate-50 ${hasBalance ? 'bg-red-50/50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <a
                              href={`/admin/orders/${txn.order_id}`}
                              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                            >
                              {txn.order_number}
                            </a>
                            {hasBalance && (
                              <AlertCircle size={14} className="text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {new Date(txn.order_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 text-right">
                          {formatCurrency(Number(txn.order_total))}
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600 font-medium text-right">
                          {formatCurrency(Number(txn.amount_paid))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={`font-semibold ${hasBalance ? 'text-red-600' : 'text-slate-500'}`}>
                            {formatCurrency(Number(txn.balance_due))}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                            <StatusIcon size={12} />
                            {txn.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {txn.payment_count > 0 ? (
                            <div className="flex flex-col gap-1">
                              {txn.payment_details.map((payment, idx) => {
                                const Icon = methodIcons[payment.method] || CreditCard;
                                return (
                                  <div key={idx} className="flex items-center gap-2 text-xs">
                                    <Icon size={12} className="text-slate-400" />
                                    <span className="text-slate-600 capitalize">{payment.method}</span>
                                    <span className={`font-medium ${payment.status === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>
                                      {formatCurrency(Number(payment.amount))}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">No payments</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
