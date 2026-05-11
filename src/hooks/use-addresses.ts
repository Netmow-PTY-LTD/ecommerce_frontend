'use client';
import useSWR, { mutate } from 'swr';
import api from '@/lib/api';

export function useAddresses() {
  const { data, error, isLoading } = useSWR('/addresses', async (url) => {
    try {
      const res = await api.get(url);
      return res.data?.data || res.data || [];
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
      return [];
    }
  });
  return { addresses: data || [], isLoading, isError: error };
}

export async function createAddress(data: any) {
  const res = await api.post('/addresses', data);
  mutate('/addresses');
  return res.data;
}

export async function updateAddress(id: number, data: any) {
  const res = await api.put(`/addresses/${id}`, data);
  mutate('/addresses');
  return res.data;
}

export async function deleteAddress(id: number) {
  const res = await api.delete(`/addresses/${id}`);
  mutate('/addresses');
  return res.data;
}

export async function setDefaultAddress(id: number) {
  const res = await api.patch(`/addresses/${id}/default`);
  mutate('/addresses');
  return res.data;
}
