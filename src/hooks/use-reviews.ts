'use client';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import api from '@/lib/api';

export function useProductReviews(productId: number, page = 1, sort = 'newest') {
  const { data, error, isLoading, mutate } = useSWR(
    productId ? `/reviews/product/${productId}?page=${page}&sort=${sort}` : null,
    fetcher
  );
  return { reviews: data?.data || [], pagination: data?.pagination, isLoading, isError: error, mutate };
}

export function useReviewSummary(productId: number) {
  const { data, error, isLoading } = useSWR(
    productId ? `/reviews/product/${productId}/summary` : null,
    fetcher
  );
  return { summary: data?.data, isLoading, isError: error };
}

export async function createReview(data: { product_id: number; rating: number; title?: string; body?: string; images?: string[] }) {
  const res = await api.post('/reviews', data);
  return res.data;
}
