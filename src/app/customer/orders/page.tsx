'use client';

import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Package, ShoppingBag, Clock, CheckCircle, XCircle, 
  Truck, ArrowRight, FileText, Eye, Loader2, 
  Calendar, CreditCard, ChevronRight, Search
} from 'lucide-react';
import Link from 'next/link';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  line_total: number;
  thumb_url: string;
}

interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export default function CustomerOrders() {
  const { customer, loading: authLoading, isAuthenticated } = useCustomerAuth();
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && customer) {
      fetchOrders();
    }
  }, [isAuthenticated, customer]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await api.get('/sales/customer/orders');
      if (response.data && response.data.data) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          color: 'bg-amber-50 text-amber-700 border-amber-100', 
          icon: Clock,
          label: 'Pending'
        };
      case 'processing':
        return { 
          color: 'bg-indigo-50 text-indigo-700 border-indigo-100', 
          icon: Package,
          label: 'Processing'
        };
      case 'shipped':
        return { 
          color: 'bg-blue-50 text-blue-700 border-blue-100', 
          icon: Truck,
          label: 'Shipped'
        };
      case 'delivered':
        return { 
          color: 'bg-emerald-50 text-emerald-700 border-emerald-100', 
          icon: CheckCircle,
          label: 'Delivered'
        };
      case 'cancelled':
        return { 
          color: 'bg-rose-50 text-rose-700 border-rose-100', 
          icon: XCircle,
          label: 'Cancelled'
        };
      default:
        return { 
          color: 'bg-slate-50 text-slate-700 border-slate-100', 
          icon: FileText,
          label: status
        };
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  if (authLoading || loadingOrders) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated || !customer) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search/Filter Bar Placeholder */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Order History</h2>
          <p className="text-sm text-slate-500 font-medium">Track and manage your recent and past purchases.</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search order number..."
            className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-full md:w-64"
          />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-16 text-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No orders found</h3>
          <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">You haven't placed any orders yet. Explore our latest collections and start shopping!</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white text-xs font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all uppercase tracking-widest"
          >
            Start Shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orders.map((order) => {
            const status = getStatusConfig(order.status);
            return (
              <motion.div
                key={order.id}
                whileHover={{ y: -2 }}
                className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden group transition-all hover:shadow-xl hover:shadow-slate-200/50"
              >
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      {/* Order Visual Preview */}
                      <div className="flex -space-x-4 overflow-hidden">
                        {(order.items || []).slice(0, 3).map((item, idx) => (
                          <div 
                            key={item.id} 
                            className="h-16 w-16 rounded-2xl bg-slate-50 border-2 border-white overflow-hidden shadow-sm flex-shrink-0 z-[idx]"
                          >
                            {item.thumb_url ? (
                              <img src={item.thumb_url} alt={item.product_name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-slate-300" />
                              </div>
                            )}
                          </div>
                        ))}
                        {order.items && order.items.length > 3 && (
                          <div className="h-16 w-16 rounded-2xl bg-indigo-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm z-0">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Order ID</span>
                          <span className="text-sm font-bold text-slate-900">#{order.order_number}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5" />
                            {order.payment_method === 'cod' ? 'Cash' : 'Online'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2">
                       <span className={cn(
                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2",
                        status.color
                      )}>
                        <status.icon className="h-3 w-3" />
                        {status.label}
                      </span>
                      <div className="text-xl font-black text-slate-900 tracking-tight">
                        {formatCurrency(order.total_amount)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-none">
                      <button 
                        onClick={() => handleViewOrder(order)}
                        className="flex-1 md:flex-none px-6 py-3 bg-slate-50 hover:bg-indigo-600 rounded-2xl text-xs font-black text-slate-600 hover:text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer group/btn"
                      >
                        Details
                        <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modern Order Details Modal */}
      <AnimatePresence>
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOrderModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative h-32 bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white">
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Order Details</h3>
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">Order ID: #{selectedOrder.order_number}</p>
                  </div>
                  <button 
                    onClick={() => setShowOrderModal(false)}
                    className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 h-full w-48 bg-white/10 skew-x-[-20deg] translate-x-12" />
              </div>

              {/* Modal Body */}
              <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-sm font-bold text-indigo-600 capitalize">{selectedOrder.status}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                    <p className="text-sm font-bold text-slate-700">
                      {new Date(selectedOrder.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Method</p>
                    <p className="text-sm font-bold text-slate-700 capitalize">{selectedOrder.payment_method}</p>
                  </div>
                </div>

                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Items Ordered</h4>
                <div className="space-y-4 mb-8">
                  {(selectedOrder.items || []).map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                      <div className="h-16 w-16 rounded-xl bg-white border border-slate-100 overflow-hidden flex-shrink-0">
                        {item.thumb_url ? (
                          <img src={item.thumb_url} alt={item.product_name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{item.product_name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(item.unit_price)}</p>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">{formatCurrency(item.total_price)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-900 rounded-3xl p-6 text-white">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span className="text-white">{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <span>Shipping</span>
                      <span className="text-white">{selectedOrder.shipping_cost === 0 ? 'FREE' : formatCurrency(selectedOrder.shipping_cost)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <span>Tax</span>
                      <span className="text-white">{formatCurrency(selectedOrder.tax_amount)}</span>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                      <span className="text-sm font-black uppercase tracking-[0.2em]">Total</span>
                      <span className="text-2xl font-black text-indigo-400">{formatCurrency(selectedOrder.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 pt-0 flex justify-end gap-3">
                <button 
                  onClick={() => setShowOrderModal(false)}
                  className="px-8 py-3 rounded-2xl text-[10px] font-black text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all uppercase tracking-widest cursor-pointer"
                >
                  Close
                </button>
                <Link
                  href="/shop"
                  className="px-8 py-3 rounded-2xl text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all uppercase tracking-widest cursor-pointer"
                >
                  Buy More
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
