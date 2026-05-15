'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Package, DollarSign, ShoppingCart, AlertTriangle, MessageSquare, Tag } from 'lucide-react';
import { useNotificationContext } from '@/contexts/notification-context';

interface NotificationBellProps {
  userType?: 'admin' | 'customer';
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'order': return Package;
    case 'payment': return DollarSign;
    case 'stock': return ShoppingCart;
    case 'system': return AlertTriangle;
    case 'chat': return MessageSquare;
    case 'promo': return Tag;
    default: return Bell;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-blue-500';
    case 'low': return 'bg-gray-400';
    default: return 'bg-blue-500';
  }
};

export function NotificationBell({ userType = 'admin' }: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, isConnected } = useNotificationContext();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    await markAsRead(notification.id);
    // Navigate based on notification type
    if (notification.data?.orderId) {
      window.location.href = userType === 'admin' ? `/admin/orders/${notification.data.orderId}` : `/customer/orders/${notification.data.orderId}`;
    }
    setIsOpen(false);
  };

  // API now returns only unread notifications, so no frontend filtering needed
  const unreadNotifications = notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title={isConnected ? 'Connected' : 'Disconnected'}
      >
        <Bell size={20} className={isConnected ? 'text-green-500' : 'text-gray-400'} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Notifications</span>
              {isConnected && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {unreadNotifications.length === 0 ? (
              <div
                onClick={() => {
                  const notificationsPath = userType === 'admin' ? '/admin/notifications' : '/customer/notifications';
                  router.push(notificationsPath);
                }}
                className="flex flex-col items-center justify-center py-12 text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Bell size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No unread notifications</p>
                <p className="text-xs text-blue-600 hover:underline mt-1">View notification history</p>
              </div>
            ) : (
              unreadNotifications.map((notification: any) => {
                const Icon = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="px-4 py-3 border-b last:border-0 cursor-pointer transition-colors bg-blue-50 hover:bg-blue-100"
                  >
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-full ${getPriorityColor(notification.priority)} text-white flex-shrink-0`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notification.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {unreadNotifications.length > 0 && (
            <div className="px-4 py-2 border-t bg-gray-50">
              <button
                onClick={() => {
                  const notificationsPath = userType === 'admin' ? '/admin/notifications' : '/customer/notifications';
                  router.push(notificationsPath);
                }}
                className="text-xs text-gray-600 hover:text-gray-900 w-full text-center font-medium hover:underline"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
