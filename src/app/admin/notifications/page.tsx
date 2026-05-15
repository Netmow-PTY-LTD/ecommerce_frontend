'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useNotificationContext, AppNotification } from '@/contexts/notification-context';
import api from '@/lib/api';
import AdminLayout from '@/components/admin/admin-layout';
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
  Trash2,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
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

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPage: number;
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
  if (isRead) return 'bg-gray-50 border-gray-200';

  switch (priority) {
    case 'critical': return 'bg-red-50 border-red-200';
    case 'high': return 'bg-orange-50 border-orange-200';
    case 'medium': return 'bg-blue-50 border-blue-200';
    case 'low': return 'bg-gray-50 border-gray-200';
    default: return 'bg-gray-50 border-gray-200';
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-500 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-blue-500 text-white';
    case 'low': return 'bg-gray-400 text-white';
    default: return 'bg-gray-400 text-white';
  }
};

const typeLabels: Record<string, string> = {
  order: 'Orders',
  payment: 'Payments',
  stock: 'Stock',
  system: 'System',
  chat: 'Chat & Reviews',
  promo: 'Promotions'
};

export default function AdminNotificationsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { unreadCount, markAsRead, markAllAsRead } = useNotificationContext();

  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPage: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, router]);

  const fetchNotifications = async (page = 1) => {
    try {
      setLoadingNotifications(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (filterType !== 'all') params.append('type', filterType);
      if (filterRead === 'read') params.append('is_read', 'true');
      if (filterRead === 'unread') params.append('is_read', 'false');
      if (appliedSearch) params.append('search', appliedSearch);

      const response = await api.get(`/notifications?${params}`);
      const data = response.data;

      setNotifications(data.data || []);
      setPagination({
        total: data.total || 0,
        page: data.page || 1,
        limit: data.limit || 10,
        totalPage: data.totalPage || 0,
      });
      setCurrentPage(data.page || 1);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setPagination({
        total: 0,
        page: 1,
        limit: 10,
        totalPage: 0,
      });
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(currentPage);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications(1);
  }, [filterType, filterRead, appliedSearch]);

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id);
    fetchNotifications(currentPage);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    fetchNotifications(currentPage);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications(currentPage);
    setRefreshing(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setAppliedSearch('');
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate based on notification data
    if (notification.data?.orderId) {
      router.push(`/admin/orders/${notification.data.orderId}`);
    } else if (notification.data?.productId) {
      router.push(`/admin/products`);
    } else if (notification.event_type === 'new_review') {
      router.push(`/admin/reviews`);
    } else if (notification.event_type === 'new_chat_message') {
      router.push(`/admin/chat/chats`);
    }
  };

  const stats = {
    total: pagination.total,
    unread: unreadCount,
    critical: notifications.filter((n: AppNotification) => n.priority === 'critical').length,
    high: notifications.filter((n: AppNotification) => n.priority === 'high').length
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="w-full space-y-6">

        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Notifications</h1>
          <p className="text-slate-600 text-sm">You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Notifications</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
                <p className="text-xs text-gray-500">Unread</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.critical}</p>
                <p className="text-xs text-gray-500">Critical</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <form onSubmit={handleSearch} className="relative flex-1 sm:flex-none min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search notifications..."
                className="pl-10 h-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
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
                <DropdownMenuItem onClick={() => setFilterType('system')}>System</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('chat')}>Chat & Reviews</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('promo')}>Promotions</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Status: {filterRead === 'all' ? 'All' : filterRead === 'read' ? 'Read' : 'Unread'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setFilterRead('all')}>All Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRead('unread')}>Unread Only</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRead('read')}>Read Only</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {(appliedSearch || filterType !== 'all' || filterRead !== 'all') && (
              <Button onClick={handleClearSearch} variant="ghost" size="sm">
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button onClick={handleMarkAllAsRead} variant="outline" size="sm" className="gap-2">
                <CheckCheck className="h-4 w-4" />
                Mark All Read
              </Button>
            )}
            <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loadingNotifications ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No notifications found</p>
              <p className="text-sm mt-1">Try changing your filters</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {notifications.map((notification: AppNotification) => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        'p-4 cursor-pointer transition-all hover:bg-gray-50',
                        getPriorityColor(notification.priority, notification.is_read)
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'p-2.5 rounded-full flex-shrink-0',
                          notification.is_read ? 'bg-gray-200 text-gray-500' : getPriorityBadge(notification.priority)
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                'text-sm font-semibold truncate',
                                notification.is_read ? 'text-gray-600' : 'text-gray-900'
                              )}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] uppercase font-semibold text-gray-500">
                                  {typeLabels[notification.type] || notification.type}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="text-[10px] text-gray-400">
                                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </span>
                                {notification.priority !== 'low' && (
                                  <>
                                    <span className="text-gray-300">•</span>
                                    <span className={cn(
                                      'text-[10px] font-semibold uppercase',
                                      notification.priority === 'critical' && 'text-red-600',
                                      notification.priority === 'high' && 'text-orange-600',
                                      notification.priority === 'medium' && 'text-blue-600'
                                    )}>
                                      {notification.priority}
                                    </span>
                                  </>
                                )}
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
                                  <Check className="h-4 w-4 text-gray-400 hover:text-green-600" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPage > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} notifications
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchNotifications(1)}
                      disabled={currentPage === 1 || loadingNotifications}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchNotifications(currentPage - 1)}
                      disabled={currentPage === 1 || loadingNotifications}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {pagination.totalPage > 0 && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(pagination.totalPage, 5) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPage <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= pagination.totalPage - 2) {
                            pageNum = pagination.totalPage - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? 'default' : 'outline'}
                              size="sm"
                              disabled={loadingNotifications}
                              className="h-8 w-8 p-0"
                              onClick={() => fetchNotifications(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchNotifications(currentPage + 1)}
                      disabled={currentPage === pagination.totalPage || loadingNotifications}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchNotifications(pagination.totalPage)}
                      disabled={currentPage === pagination.totalPage || loadingNotifications}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
