'use client';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';

export function useRevenue(start: string, end: string, granularity = 'daily') {
  const { data, error, isLoading } = useSWR(`/analytics/revenue?start=${start}&end=${end}&granularity=${granularity}`, fetcher);
  return { data: data?.data || [], isLoading, isError: error };
}

export function useTopProducts(limit = 10, period = '30d') {
  const { data, error, isLoading } = useSWR(`/analytics/top-products?limit=${limit}&period=${period}`, fetcher);
  return { products: data?.data || [], isLoading, isError: error };
}

export function useTopCustomers(limit = 10, period = '30d') {
  const { data, error, isLoading } = useSWR(`/analytics/top-customers?limit=${limit}&period=${period}`, fetcher);
  return { customers: data?.data || [], isLoading, isError: error };
}

export function useConversionFunnel(period = '30d') {
  const { data, error, isLoading } = useSWR(`/analytics/conversion-funnel?period=${period}`, fetcher);
  return { funnel: data?.data, isLoading, isError: error };
}

export function useRealTimeStats() {
  const { data, error, isLoading, mutate } = useSWR('/analytics/realtime', fetcher, { refreshInterval: 60000 });
  return { stats: data?.data, isLoading, isError: error, mutate };
}

export function useOrderStatusDistribution() {
  const { data, error, isLoading } = useSWR('/analytics/order-status-distribution', fetcher);
  return { distribution: data?.data || [], isLoading, isError: error };
}

export function useRevenueByCategory() {
  const { data, error, isLoading } = useSWR('/analytics/revenue-by-category', fetcher);
  return { categories: data?.data || [], isLoading, isError: error };
}
