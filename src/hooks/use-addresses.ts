'use client';
import useSWR, { mutate } from 'swr';
import api from '@/lib/api';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

export function useAddresses() {
  const { isAuthenticated } = useCustomerAuth();

  const { data, error, isLoading } = useSWR(
    isAuthenticated ? '/addresses' : null,
    async (url) => {
      try {
        const res = await api.get(url);
        return res.data?.data || res.data || [];
      } catch (err) {
        console.error('Failed to fetch addresses:', err);
        return [];
      }
    }
  );
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
