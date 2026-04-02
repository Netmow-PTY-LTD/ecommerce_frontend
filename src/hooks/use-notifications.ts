'use client';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';

export function useNotifications(page = 1, limit = 20) {
  const { data, error, isLoading, mutate } = useSWR(
    `/notifications?page=${page}&limit=${limit}`,
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
  const { data, error, isLoading, mutate } = useSWR(
    '/notifications/unread-count',
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
