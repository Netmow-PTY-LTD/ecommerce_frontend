'use client';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { usePathname } from 'next/navigation';

// Helper function to determine user type based on current route
const getUserType = (pathname: string): 'admin' | 'customer' => {
  if (pathname?.startsWith('/admin')) {
    return 'admin';
  }
  // Default to customer for public routes and customer routes
  return 'customer';
};

export function useNotifications(page = 1, limit = 20) {
  const pathname = usePathname();
  const userType = getUserType(pathname);

  const endpoint = userType === 'customer'
    ? `/notifications/customer/?page=${page}&limit=${limit}`
    : `/notifications?page=${page}&limit=${limit}`;

  const { data, error, isLoading, mutate } = useSWR(
    endpoint,
    fetcher
  );
  return {
    notifications: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate
  };
}

export function useUnreadCount() {
  const pathname = usePathname();
  const userType = getUserType(pathname);

  const endpoint = userType === 'customer'
    ? '/notifications/customer/unread-count'
    : '/notifications/unread-count';

  const { data, error, isLoading, mutate } = useSWR(
    endpoint,
    fetcher,
    { refreshInterval: 30000 }
  );
  return {
    count: data?.data?.count || 0,
    isLoading,
    isError: error,
    mutate
  };
}
