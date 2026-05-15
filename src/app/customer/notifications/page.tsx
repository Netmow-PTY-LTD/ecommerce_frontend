'use client';

import { useEffect, useState } from 'react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useRouter } from 'next/navigation';
import { useNotificationContext, AppNotification } from '@/contexts/notification-context';
import { formatDistanceToNow } from 'date-fns';
import {
  Package,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  MessageSquare,
  Tag,
  Check,
  CheckCheck,
  Filter,
  RefreshCw,
  ShoppingBag,
  Search,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import CustomerLayout from '@/components/customer/customer-layout';

interface Notification {
  id: number;
  type: string;
  event_type: string;
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'order': return Package;
    case 'payment': return DollarSign;
    case 'stock': return ShoppingCart;
    case 'system': return AlertTriangle;
    case 'chat': return MessageSquare;
    case 'promo': return Tag;
    default: return AlertTriangle;
  }
};

const getPriorityColor = (priority: string, isRead: boolean) => {
  if (isRead) return 'bg-gray-50';

  switch (priority) {
    case 'critical': return 'bg-red-50';
    case 'high': return 'bg-orange-50';
    case 'medium': return 'bg-blue-50';
    case 'low': return 'bg-gray-50';
    default: return 'bg-gray-50';
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-700';
    case 'high': return 'bg-orange-100 text-orange-700';
    case 'medium': return 'bg-blue-100 text-blue-700';
    case 'low': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const typeLabels: Record<string, string> = {
  order: 'Orders',
  payment: 'Payments',
  stock: 'Stock',
  system: 'System',
  chat: 'Support',
  promo: 'Promotions'
};

export default function CustomerNotificationsPage() {
  const { customer, isAuthenticated, loading } = useCustomerAuth();
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isConnected } = useNotificationContext();

  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    if (notification.data?.orderId) {
      router.push(`/customer/orders?order=${notification.data.orderId}`);
    } else if (notification.data?.productId && notification.data?.slug) {
      router.push(`/product/${notification.data.slug}`);
    } else if (notification.event_type === 'abandoned_cart') {
      router.push('/cart');
    }
  };

  const filteredNotifications = notifications.filter((n: AppNotification) => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (filterRead === 'read' && !n.is_read) return false;
    if (filterRead === 'unread' && n.is_read) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        n.title.toLowerCase().includes(searchLower) ||
        n.message.toLowerCase().includes(searchLower) ||
        (n.data?.orderNumber && n.data.orderNumber.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterRead, searchTerm]);

  const stats = {
    total: filteredNotifications.length,
    unread: notifications.filter((n: Notification) => !n.is_read).length,
    orders: notifications.filter((n: Notification) => n.type === 'order').length,
    promos: notifications.filter((n: Notification) => n.type === 'promo').length
  };

  if (loading) {
    return (
     
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
     
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (

    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
          isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        )}>
          <div className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-green-500' : 'bg-red-500')} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-8"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Type: {filterType === 'all' ? 'All' : typeLabels[filterType]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setFilterType('all')}>All Types</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('order')}>Orders</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('payment')}>Payments</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('stock')}>Stock</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('chat')}>Support</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('promo')}>Promotions</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {filterRead === 'all' ? 'All' : filterRead === 'read' ? 'Read' : 'Unread'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setFilterRead('all')}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRead('unread')}>Unread</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRead('read')}>Read</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Tag className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.promos}</p>
              <p className="text-xs text-slate-500">Promos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <RefreshCw className={cn('h-5 w-5 text-slate-600', refreshing && 'animate-spin')} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Refresh</p>
              <p className="text-xs text-slate-500">Updates</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Type: {filterType === 'all' ? 'All' : typeLabels[filterType]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setFilterType('all')}>All Types</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('order')}>Orders</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('payment')}>Payments</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('stock')}>Stock</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('chat')}>Support</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('promo')}>Promotions</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {filterRead === 'all' ? 'All' : filterRead === 'read' ? 'Read' : 'Unread'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setFilterRead('all')}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRead('unread')}>Unread</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRead('read')}>Read</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <ShoppingBag className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No notifications yet</p>
              <p className="text-sm mt-1">We'll notify you about important updates</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {paginatedNotifications.map((notification: Notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        'p-4 cursor-pointer transition-all hover:bg-slate-50',
                        getPriorityColor(notification.priority, notification.is_read),
                        !notification.is_read && 'border-l-4 border-l-indigo-500'
                      )}
                    >
                      <div className="flex gap-4">
                        <div className={cn(
                          'p-2.5 rounded-full flex-shrink-0',
                          notification.is_read ? 'bg-slate-200 text-slate-500' : getPriorityBadge(notification.priority)
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                'text-sm font-semibold truncate',
                                notification.is_read ? 'text-slate-600' : 'text-slate-900'
                              )}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] uppercase font-semibold text-slate-500">
                                  {typeLabels[notification.type] || notification.type}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-[10px] text-slate-400">
                                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {!notification.is_read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-white transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="h-4 w-4 text-slate-400 hover:text-green-600" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-white transition-colors"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4 text-slate-400 hover:text-green-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t">
                  <p className="text-sm text-slate-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/customer/orders')}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all"
          >
            <Package className="h-5 w-5 text-indigo-600" />
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900">My Orders</p>
              <p className="text-xs text-slate-500">Track your orders</p>
            </div>
          </button>
          <button
            onClick={() => router.push('/cart')}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all"
          >
            <ShoppingCart className="h-5 w-5 text-indigo-600" />
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900">Cart</p>
              <p className="text-xs text-slate-500">Continue shopping</p>
            </div>
          </button>
          <button
            onClick={() => router.push('/customer/profile')}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all"
          >
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900">Profile</p>
              <p className="text-xs text-slate-500">Update settings</p>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => router.push('/customer/orders')}
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
        >
          <Package className="h-5 w-5 text-indigo-600" />
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-900">My Orders</p>
            <p className="text-xs text-slate-500">Track your orders</p>
          </div>
        </button>
        <button
          onClick={() => router.push('/cart')}
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
        >
          <ShoppingCart className="h-5 w-5 text-indigo-600" />
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-900">Cart</p>
            <p className="text-xs text-slate-500">Continue shopping</p>
          </div>
        </button>
        <button
          onClick={() => router.push('/customer/profile')}
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
        >
          <MessageSquare className="h-5 w-5 text-indigo-600" />
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-900">Profile</p>
            <p className="text-xs text-slate-500">Update settings</p>
          </div>
        </button>
      </div>
    </div>

  );
}