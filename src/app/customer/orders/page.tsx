'use client';

import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Package, ShoppingBag, Clock, CheckCircle, XCircle,
  Truck, ArrowRight, FileText, Loader2,
  Calendar, CreditCard, ChevronRight, Search,
  ChevronLeft, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import Link from 'next/link';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

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
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPage: 0
  });

  const statuses = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && customer) {
      fetchOrders();
    }
  }, [isAuthenticated, customer, currentPage, selectedStatus]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      if (selectedStatus && selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      if (searchTerm) {
        // Search is handled client-side or we could add params.append('search', searchTerm)
      }
      const response = await api.get(`/sales/customer/orders?${params}`);
      if (response.data && response.data.data) {
        setOrders(response.data.data);
        if (response.data.pagination) {
          setPagination({
            total: response.data.pagination.total,
            page: parseInt(response.data.pagination.page),
            limit: parseInt(response.data.pagination.limit),
            totalPage: response.data.pagination.totalPage
          });
        }
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
        return { color: 'bg-amber-50 text-amber-700 border-amber-100', label: 'Pending' };
      case 'processing':
        return { color: 'bg-indigo-50 text-indigo-700 border-indigo-100', label: 'Processing' };
      case 'shipped':
        return { color: 'bg-blue-50 text-blue-700 border-blue-100', label: 'Shipped' };
      case 'delivered':
        return { color: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Delivered' };
      case 'cancelled':
        return { color: 'bg-rose-50 text-rose-700 border-rose-100', label: 'Cancelled' };
      default:
        return { color: 'bg-slate-50 text-slate-700 border-slate-100', label: status };
    }
  };

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPage) {
      setCurrentPage(page);
    }
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="h-6 w-6 text-indigo-600" />
          </div>
        </div>
        <p className="text-slate-500 font-bold text-sm animate-pulse uppercase tracking-widest">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !customer) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Order History</h2>
          <p className="text-sm text-slate-500 mt-0.5">Track and manage your past purchases.</p>
        </div>
        <div className="relative group w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search order number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-full shadow-sm"
          />
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {statuses.map((status) => (
          <button
            key={status.id}
            onClick={() => handleStatusChange(status.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer",
              selectedStatus === status.id
                ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            {status.label}
          </button>
        ))}
      </div>

      {loadingOrders ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
           <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Fetching orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No orders found</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            {selectedStatus !== 'all' 
              ? `You don't have any orders with "${selectedStatus}" status.`
              : searchTerm ? "We couldn't find any orders matching your search." : "You haven't placed any orders yet."}
          </p>
          {selectedStatus !== 'all' ? (
            <Button
              onClick={() => handleStatusChange('all')}
              variant="outline"
              className="rounded-xl px-6"
            >
              Show All Orders
            </Button>
          ) : (
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all uppercase tracking-wider"
            >
              {searchTerm ? "Clear Search" : "Start Shopping"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order) => {
              const status = getStatusConfig(order.status);
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group transition-all hover:border-slate-200 hover:shadow-md"
                >
                  <div className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-slate-900 tracking-tight">#{order.order_number}</span>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                            status.color
                          )}>
                            {status.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5">
                            {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span>
                            {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span className="text-slate-900 font-bold">
                            {order.items?.length || 0} {order.items?.length === 1 ? 'Item' : 'Items'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8 border-t md:border-none border-slate-50 pt-3 md:pt-0">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Amount</span>
                          <div className="text-xl font-bold text-slate-900 tracking-tight">
                            {formatCurrency(order.total_amount)}
                          </div>
                        </div>
                        <Link 
                          href={`/customer/orders/${order.id}`}
                          className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 rounded-xl text-[11px] font-bold text-white transition-all flex items-center justify-center gap-2 group/btn"
                        >
                          Details
                          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2 py-4 border-t border-slate-100">
            <div className="text-xs font-medium text-slate-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(1)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(pagination.totalPage, 3) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page === 1) {
                    pageNum = i + 1;
                  } else if (pagination.page === pagination.totalPage) {
                    pageNum = pagination.totalPage - 2 + i;
                  } else {
                    pageNum = pagination.page - 1 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0 text-xs font-bold"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={pagination.page === pagination.totalPage}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={pagination.page === pagination.totalPage}
                onClick={() => handlePageChange(pagination.totalPage)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
