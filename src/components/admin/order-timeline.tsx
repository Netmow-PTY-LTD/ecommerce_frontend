'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface StatusHistoryItem {
  id: number;
  order_id: number;
  status: string;
  status_date: string | null;
  notes: string | null;
  created_at: string;
  previous_status: string | null;
}

interface OrderTimelineProps {
  orderId: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: '⏳'
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: '✓'
  },
  processing: {
    label: 'Processing',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: '⚙️'
  },
  shipped: {
    label: 'Shipped',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: '📦'
  },
  in_transit: {
    label: 'In Transit',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    icon: '🚚'
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: '✅'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: '❌'
  },
  returned: {
    label: 'Returned',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: '↩️'
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: '💰'
  }
};

export default function OrderTimeline({ orderId }: OrderTimelineProps) {
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [orderId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sales/orders/${orderId}/status-history`);
      setHistory(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch status history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Order Timeline</h3>
        </div>
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Order Timeline
        </h3>
      </div>

      <div className="p-6">
        {history.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-2 text-sm text-slate-600">No timeline history available</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-400 via-blue-400 to-purple-400"></div>

            {/* Timeline items */}
            <div className="space-y-6">
              {history.map((item, index) => {
                const config = statusConfig[item.status] || statusConfig.pending;
                const isLast = index === history.length - 1;

                return (
                  <div key={item.id} className="relative pl-10">
                    {/* Timeline dot */}
                    <div className={`absolute left-0 w-8 h-8 rounded-full border-4 ${config.color} bg-white shadow-lg z-10 flex items-center justify-center text-sm`}>
                      {config.icon}
                    </div>

                    {/* Timeline content */}
                    <div className={`bg-slate-50 rounded-xl p-4 border border-slate-200 ${!isLast ? 'mb-2' : ''}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${config.color}`}>
                              {config.label}
                            </span>
                            {item.previous_status && (
                              <>
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusConfig[item.previous_status]?.color || 'bg-gray-100'}`}>
                                  From: {statusConfig[item.previous_status]?.label || item.previous_status}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-slate-600">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDate(item.created_at)}
                        </div>

                        {item.status_date && (
                          <div className="flex items-center text-xs text-slate-600">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Status Date: {formatDateOnly(item.status_date)}
                          </div>
                        )}

                        {item.notes && (
                          <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-700 flex items-start">
                              <svg className="w-3 h-3 mr-1 mt-0.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              {item.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
