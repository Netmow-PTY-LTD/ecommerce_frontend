'use client';
import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications, useUnreadCount } from '@/hooks/use-notifications';
import api from '@/lib/api';

interface NotificationBellProps {
  userType?: 'admin' | 'customer';
}

export function NotificationBell({ userType = 'admin' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { count, mutate: mutateCount } = useUnreadCount();
  const { notifications, mutate } = useNotifications(1, 10);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    mutate(); mutateCount();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 hover:bg-gray-100 rounded-lg">
        <Bell size={20} />
        {count > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold">{count > 99 ? '99+' : count}</span>}
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold text-sm">Notifications</span>
            {count > 0 && <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700">Mark all read</button>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No notifications</p>
            ) : notifications.map((n: any) => (
              <div key={n.id} className={`px-4 py-3 border-b last:border-0 ${!n.is_read ? 'bg-blue-50' : ''} hover:bg-gray-50`}>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
