'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initSocket, getSocket } from '@/lib/socket';
import { useNotifications, useUnreadCount } from '@/hooks/use-notifications';
import api from '@/lib/api';

interface Notification {
  id: number;
  type: string;
  event_type: string;
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children, token }: { children: ReactNode; token?: string }) {
  const [isConnected, setIsConnected] = useState(false);
  const { notifications, mutate, isLoading } = useNotifications(1, 50);
  const { count, mutate: mutateCount } = useUnreadCount();

  useEffect(() => {
    if (!token) return;

    const socket = initSocket(token);

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('notification:new', (notification: Notification) => {
      console.log('New notification received:', notification);
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

    socket.on('notification:unread_count', (data: { count: number }) => {
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
    await api.put(`/notifications/${id}/read`);
    mutate();
    mutateCount();
  };

  const markAllAsRead = async () => {
    await api.put('/notifications/read-all');
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
        isConnected
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
