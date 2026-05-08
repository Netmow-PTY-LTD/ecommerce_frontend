'use client';

import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Package, ShoppingBag, Clock, CheckCircle, XCircle, 
  Truck, ArrowRight, FileText, Loader2, 
  Calendar, CreditCard, ChevronRight, Search
} from 'lucide-react';
import Link from 'next/link';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredOrders = orders.filter(order => 
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loadingOrders) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="h-6 w-6 text-indigo-600" />
          </div>
        </div>
        <p className="text-slate-500 font-bold text-sm animate-pulse uppercase tracking-widest">Loading orders...</p>
      </div>
    );
  }

  if (!isAuthenticated || !customer) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Order History</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Track and manage your recent and past purchases.</p>
        </div>
        <div className="relative group w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search order number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-[1.25rem] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-full shadow-sm"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-16 text-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No orders found</h3>
          <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">
            {searchTerm ? "We couldn't find any orders matching your search." : "You haven't placed any orders yet. Explore our latest collections and start shopping!"}
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white text-xs font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all uppercase tracking-widest"
          >
            {searchTerm ? "Clear Search" : "Start Shopping"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredOrders.map((order) => {
            const status = getStatusConfig(order.status);
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, scale: 1.005 }}
                className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group transition-all hover:shadow-2xl hover:shadow-indigo-500/5"
              >
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex flex-col md:flex-row md:items-center gap-8">
                      {/* Order Visual Preview */}
                      <div className="flex -space-x-6 overflow-hidden">
                        {(order.items || []).slice(0, 3).map((item, idx) => (
                          <div 
                            key={item.id} 
                            className="h-20 w-20 rounded-2xl bg-white border-2 border-slate-50 overflow-hidden shadow-sm flex-shrink-0 relative transition-transform group-hover:translate-x-1"
                            style={{ zIndex: 10 - idx }}
                          >
                            {item.thumb_url ? (
                              <img src={item.thumb_url} alt={item.product_name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-slate-50">
                                <Package className="h-8 w-8 text-slate-200" />
                              </div>
                            )}
                          </div>
                        ))}
                        {order.items && order.items.length > 3 && (
                          <div className="h-20 w-20 rounded-2xl bg-slate-900 border-2 border-white flex items-center justify-center text-white text-xs font-black shadow-sm relative z-0">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-2 py-1 rounded-md">Order ID</span>
                          <span className="text-lg font-black text-slate-900 tracking-tight">#{order.order_number}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-indigo-500" />
                            {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-indigo-500" />
                            {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Paid Online'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4">
                       <span className={cn(
                        "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border flex items-center gap-2.5 shadow-sm",
                        status.color
                      )}>
                        <status.icon className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                      <div className="text-2xl font-black text-slate-900 tracking-tighter">
                        {formatCurrency(order.total_amount)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-6 md:pt-0 border-t md:border-none border-slate-100">
                      <Link 
                        href={`/customer/orders/${order.id}`}
                        className="flex-1 md:flex-none px-8 py-4 bg-slate-900 hover:bg-indigo-600 rounded-2xl text-[10px] font-black text-white transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2.5 group/btn"
                      >
                        Track Order
                        <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
