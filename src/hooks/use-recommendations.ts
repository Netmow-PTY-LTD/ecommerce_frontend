'use client';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';

export function useAlsoBought(productId: number) {
  const { data, error, isLoading } = useSWR(productId ? `/recommendations/also-bought/${productId}` : null, fetcher);
  return { products: data?.data || [], isLoading, isError: error };
}

export function useSimilarProducts(productId: number) {
  const { data, error, isLoading } = useSWR(productId ? `/recommendations/similar/${productId}` : null, fetcher);
  return { products: data?.data || [], isLoading, isError: error };
}

export function usePersonalizedRecommendations(customerId?: number) {
  const { data, error, isLoading } = useSWR('/recommendations/personalized' + (customerId ? `?customer_id=${customerId}` : ''), fetcher);
  return { products: data?.data || [], isLoading, isError: error };
}

export function useTrendingProducts() {
  const { data, error, isLoading } = useSWR('/recommendations/trending', fetcher);
  return { products: data?.data || [], isLoading, isError: error };
}
