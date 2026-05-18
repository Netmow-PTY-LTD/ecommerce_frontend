'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Clock, Package, CheckCircle, XCircle, Truck, RotateCcw, DollarSign, Settings, ShieldCheck, AlertCircle } from 'lucide-react';

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
  orderId: string | string[];
}

const statusConfig: Record<string, {
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
  Icon: React.ElementType;
}> = {
  pending: {
    label: 'Order Placed',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
    Icon: Clock,
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
    Icon: ShieldCheck,
  },
  processing: {
    label: 'Processing',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    Icon: Settings,
  },
  shipped: {
    label: 'Shipped',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    dot: 'bg-violet-500',
    Icon: Package,
  },
  in_transit: {
    label: 'In Transit',
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    dot: 'bg-cyan-500',
    Icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    Icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    Icon: XCircle,
  },
  returned: {
    label: 'Returned',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
    Icon: RotateCcw,
  },
  refunded: {
    label: 'Refunded',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    dot: 'bg-yellow-500',
    Icon: DollarSign,
  },
};

const defaultConfig = {
  label: 'Updated',
  color: 'text-slate-700',
  bg: 'bg-slate-50',
  border: 'border-slate-200',
  dot: 'bg-slate-400',
  Icon: AlertCircle,
};

export default function CustomerOrderTimeline({ orderId }: OrderTimelineProps) {
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [orderId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sales/customer/orders/${orderId}/status-history`);
      setHistory(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch order timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
        <Clock className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-bold text-slate-900">Order Timeline</h3>
        {!loading && history.length > 0 && (
          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
            {history.length}
          </span>
        )}
      </div>

      <div className="px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-6">
            <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No timeline history yet</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-indigo-300 via-violet-300 to-emerald-300" />

            <div className="space-y-4">
              {history.map((item, index) => {
                const config = statusConfig[item.status] || defaultConfig;
                const { Icon } = config;
                const isFirst = index === 0;

                return (
                  <div key={item.id} className="relative flex gap-3.5">
                    {/* Dot */}
                    <div className={cn(
                      'relative z-10 h-6 w-6 rounded-full flex items-center justify-center shrink-0 border-2',
                      isFirst ? 'border-indigo-500 bg-indigo-500' : `border-slate-200 ${config.bg}`,
                    )}>
                      <Icon className={cn('h-3 w-3', isFirst ? 'text-white' : config.color)} />
                    </div>

                    {/* Content */}
                    <div className={cn(
                      'flex-1 rounded-xl border px-4 py-3 mb-0.5',
                      config.bg,
                      config.border,
                    )}>
                      <div className="flex items-center justify-between flex-wrap gap-1.5 mb-1">
                        <span className={cn('text-xs font-bold uppercase tracking-wide', config.color)}>
                          {config.label}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      {item.status_date && (
                        <p className="text-[11px] text-slate-500 mb-1">
                          Effective: {formatDateOnly(item.status_date)}
                        </p>
                      )}

                      {item.previous_status && statusConfig[item.previous_status] && (
                        <p className="text-[11px] text-slate-400 mb-1">
                          Changed from{' '}
                          <span className={cn('font-semibold', statusConfig[item.previous_status].color)}>
                            {statusConfig[item.previous_status].label}
                          </span>
                        </p>
                      )}

                      {item.notes && (
                        <p className="text-xs text-slate-600 mt-1.5 pt-1.5 border-t border-white/70">
                          {item.notes}
                        </p>
                      )}
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
