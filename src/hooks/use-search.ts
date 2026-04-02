'use client';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import api from '@/lib/api';

export function useSearch(query: string, filters?: Record<string, string>, page = 1) {
  const params = new URLSearchParams({ q: query, page: String(page), limit: '12' });
  if (filters) Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });

  const { data, error, isLoading } = useSWR(
    query ? `/search?${params.toString()}` : null,
    fetcher
  );
  return { results: data?.data || [], pagination: data?.pagination, isLoading, isError: error };
}

export function useSearchSuggestions(prefix: string) {
  const { data, error } = useSWR(
    prefix.length >= 2 ? `/search/suggestions?q=${encodeURIComponent(prefix)}` : null,
    fetcher
  );
  return { suggestions: data?.data || [], isError: error };
}

export async function recordRecentlyViewed(productId: number) {
  try { await api.post('/search/recently-viewed', { product_id: productId, session_id: getSessionId() }); } catch {}
}

function getSessionId() {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('session_id');
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('session_id', id); }
  return id;
}
