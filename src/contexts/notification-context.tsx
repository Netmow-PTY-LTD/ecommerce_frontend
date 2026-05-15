'use client';
import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { initSocket } from '@/lib/socket';
import useSWR from 'swr';
import api from '@/lib/api';

export interface AppNotification {
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

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isConnected: boolean;
  userType?: 'admin' | 'customer';
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children, token }: { children: ReactNode; token?: string }) {
  const [isConnected, setIsConnected] = useState(false);

  // Detect user type from token synchronously (no state/useEffect needed)
  const userType = useMemo<'admin' | 'customer'>(() => {
    if (!token) {
      return 'admin';
    }
    try {
      // Simple JWT decode to check user type
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const detectedType = payload.type === 'customer' ? 'customer' : 'admin';
        return detectedType;
      }
    } catch (err) {
      console.error('Error decoding token:', err);
    }
    return 'admin';
  }, [token]);

  // Use different endpoints based on user type
  const notificationsEndpoint = userType === 'customer' ? '/notifications/customer/' : '/notifications';
  const unreadCountEndpoint = userType === 'customer' ? '/notifications/customer/unread-count' : '/notifications/unread-count';

  // Use SWR conditionally - only fetch when token exists
  // Fetch all notifications - filtering is handled client-side by the notification page
  const { data: notificationsData, mutate } = useSWR(
    token ? `${notificationsEndpoint}?page=1&limit=50` : null,
    async (url: string) => {
      const response = await api.get(url);
      return response.data;
    },
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      shouldRetryOnError: true,
      onError: (err) => {
        console.error('❌ Error fetching notifications:', err);
      }
    }
  );

  const { data: unreadData, mutate: mutateCount } = useSWR(
    token ? unreadCountEndpoint : null,
    async (url: string) => {
      const response = await api.get(url);
      return response.data;
    },
    {
      refreshInterval: token ? 10000 : 0, // Refresh every 10 seconds
      onError: (err) => {
        console.error('❌ Error fetching unread count:', err);
      }
    }
  );

  // Handle different possible response structures
  // API returns only unread notifications, so we can use them directly
  const notifications = notificationsData?.data || notificationsData || [];
  const count = unreadData?.data?.count || 0;

  useEffect(() => {
    if (!token) return;

    const socket = initSocket(token);

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('notification:new', (notification: AppNotification) => {
      mutate();
      mutateCount();

      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id.toString()
        });
      }
    });

    socket.on('notification:unread_count', () => {
      mutateCount();
    });

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('notification:new');
      socket.off('notification:unread_count');
    };
  }, [token, mutate, mutateCount]);

  const markAsRead = async (id: number) => {
    const endpoint = userType === 'customer' ? `/notifications/customer/${id}/read` : `/notifications/${id}/read`;
    await api.put(endpoint);
    mutate();
    mutateCount();
  };

  const markAllAsRead = async () => {
    const endpoint = userType === 'customer' ? '/notifications/customer/read-all' : '/notifications/read-all';
    await api.put(endpoint);
    mutate();
    mutateCount();
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications: notifications || [],
        unreadCount: count || 0,
        markAsRead,
        markAllAsRead,
        isConnected,
        userType
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
}
