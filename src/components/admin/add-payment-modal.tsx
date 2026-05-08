'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderTotal: number;
  onSuccess: () => void;
}

interface Payment {
  id: number;
  amount: number;
  status: string;
  payment_date: string;
}

export default function AddPaymentModal({ isOpen, onClose, orderId, orderTotal, onSuccess }: AddPaymentModalProps) {
  const { formatCurrency } = useCurrency();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'pending' | 'completed'>('completed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Fetch existing payments when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPayments();
    }
  }, [isOpen, orderId]);

  const fetchPayments = async () => {
    try {
      setLoadingPayments(true);
      const response = await api.get(`/sales/orders/${orderId}/payments`);
      setPayments(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Calculate payment totals
  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

  const remainingBalance = orderTotal - totalPaid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const paymentAmount = parseFloat(amount);

    if (paymentAmount > remainingBalance && remainingBalance > 0) {
      setError(`Payment amount cannot exceed remaining balance (${formatCurrency(remainingBalance)})`);
      return;
    }

    if (paymentAmount > orderTotal) {
      setError(`Payment amount cannot exceed order total (${formatCurrency(orderTotal)})`);
      return;
    }

    try {
      setIsSubmitting(true);

      await api.post('/sales/orders/payments', {
        order_id: orderId,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        payment_date: paymentDate,
        status: status
      });

      // Reset form
      setAmount('');
      setPaymentMethod('cod');
      setReferenceNumber('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setStatus('completed');

      // Call success callback
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create payment:', err);
      setError(err.response?.data?.message || 'Failed to create payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-slate-200 rounded-t-2xl">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Payment
          </h3>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Payment Status Summary */}
          {!loadingPayments && (
            <div className="space-y-2 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-green-600 uppercase">Total Paid</p>
                  <p className="text-lg font-bold text-green-700">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-orange-600 uppercase">Remaining</p>
                  <p className="text-lg font-bold text-orange-700">{formatCurrency(Math.max(0, remainingBalance))}</p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-semibold text-blue-600 uppercase">Order Total</p>
                  <p className="text-lg font-bold text-blue-900">{formatCurrency(orderTotal)}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                      {Math.round((totalPaid / orderTotal) * 100)}% Paid
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                  <div
                    style={{ width: `${Math.min((totalPaid / orderTotal) * 100, 100)}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                  ></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Amount */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="amount" className="block text-sm font-semibold text-slate-700">
                Payment Amount <span className="text-red-500">*</span>
              </label>
              {remainingBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(remainingBalance.toString())}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg transition-colors"
                >
                  Pay Full Remaining ({formatCurrency(remainingBalance)})
                </button>
              )}
            </div>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0.01"
              max={orderTotal}
              placeholder="Enter amount"
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-semibold text-slate-700 mb-2">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
              required
            >
              <option value="cod">Cash on Delivery</option>
              <option value="online">Online Payment</option>
              <option value="stripe">Stripe/Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Payment Date */}
          <div>
            <label htmlFor="paymentDate" className="block text-sm font-semibold text-slate-700 mb-2">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="paymentDate"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
              required
            />
          </div>

          {/* Reference Number */}
          <div>
            <label htmlFor="referenceNumber" className="block text-sm font-semibold text-slate-700 mb-2">
              Reference Number <span className="text-xs font-normal text-slate-500">(optional)</span>
            </label>
            <input
              type="text"
              id="referenceNumber"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., CHK123456, TXN789012"
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-semibold text-slate-700 mb-2">
              Payment Status <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'pending' | 'completed')}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
              required
            >
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Modal Footer */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                'Add Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
