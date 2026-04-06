'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
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
} from 'lucide-react';

const methodIcons: Record<string, any> = {
  cod: Banknote,
  cash: Banknote,
  online: Wallet,
  stripe: CreditCard,
  card: CreditCard,
  other: CreditCard,
};

export default function PaymentsAnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/admin/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) fetchAll();
  }, [isAuthenticated]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [methodsRes, statusesRes] = await Promise.all([
        api.get('/analytics/payment-methods'),
        api.get('/analytics/payment-statuses'),
      ]);
      setPaymentMethods(methodsRes.data?.data || []);
      setPaymentStatuses(statusesRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch payment analytics:', err);
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

  const totalPaymentAmount = paymentMethods.reduce((sum, m) => sum + Number(m.total || 0), 0);
  const totalPaymentCount = paymentMethods.reduce((sum, m) => sum + Number(m.count || 0), 0);

  return (
    <AdminLayout title="Payment Analytics" subtitle="Payment method distribution and payment status overview">
      <div className="w-full">
        {/* Controls */}
        <div className="flex justify-end mb-6">
          <button onClick={fetchAll} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Payment Volume</p>
                <p className="text-2xl font-bold text-green-600">${Number(totalPaymentAmount).toFixed(2)}</p>
              </div>
              <div className="bg-green-600 p-3 rounded-xl text-white"><DollarSign size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Transactions</p>
                <p className="text-2xl font-bold text-slate-900">{totalPaymentCount}</p>
              </div>
              <div className="bg-blue-600 p-3 rounded-xl text-white"><CreditCard size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Payment Methods</p>
                <p className="text-2xl font-bold text-indigo-600">{paymentMethods.length}</p>
              </div>
              <div className="bg-indigo-600 p-3 rounded-xl text-white"><Wallet size={20} /></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Methods */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Methods</h3>
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
            ) : paymentMethods.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No payment data</p>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((m) => {
                  const Icon = methodIcons[(m.payment_method || '').toLowerCase()] || CreditCard;
                  const pct = totalPaymentAmount > 0 ? ((Number(m.total) / totalPaymentAmount) * 100).toFixed(1) : 0;
                  return (
                    <div key={m.payment_method} className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                          <Icon size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 capitalize">{m.payment_method || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{m.count} transactions</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">${Number(m.total).toFixed(2)}</p>
                          <p className="text-xs text-slate-500">{pct}%</p>
                        </div>
                      </div>
                      <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Statuses */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Status</h3>
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
            ) : paymentStatuses.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No data</p>
            ) : (
              <div className="space-y-3">
                {paymentStatuses.map((s) => {
                  const status = s.payment_status || '';
                  const colorMap: Record<string, { bg: string; text: string; icon: any }> = {
                    paid: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
                    pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
                    unpaid: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
                    failed: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
                    refunded: { bg: 'bg-slate-100', text: 'text-slate-600', icon: RefreshCw },
                  };
                  const styling = colorMap[status] || { bg: 'bg-slate-100', text: 'text-slate-600', icon: CreditCard };
                  const Icon = styling.icon;
                  const pct = totalPaymentAmount > 0 ? ((Number(s.total) / totalPaymentAmount) * 100).toFixed(1) : 0;
                  return (
                    <div key={status} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
                      <div className={`p-2 rounded-lg ${styling.bg} ${styling.text}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900 capitalize">{status}</p>
                        <p className="text-xs text-slate-500">{s.count} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">${Number(s.total).toFixed(2)}</p>
                        <p className="text-xs text-slate-500">{pct}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
