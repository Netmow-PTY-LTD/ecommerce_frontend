'use client';
import useSWR from 'swr';
import api from '@/lib/api';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

export function useAddresses() {
  const { isAuthenticated } = useCustomerAuth();

  const { data, error, isLoading, mutate } = useSWR(
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

  const createAddress = async (addressData: any) => {
    const res = await api.post('/addresses', addressData);
    // Force revalidation to get the updated list
    await mutate();
    return res.data;
  };

  const updateAddress = async (id: number, addressData: any) => {
    const res = await api.put(`/addresses/${id}`, addressData);
    await mutate();
    return res.data;
  };

  const deleteAddress = async (id: number) => {
    const res = await api.delete(`/addresses/${id}`);
    await mutate();
    return res.data;
  };

  const setDefaultAddress = async (id: number) => {
    const res = await api.patch(`/addresses/${id}/default`);
    await mutate();
    return res.data;
  };

  return {
    addresses: data || [],
    isLoading,
    isError: error,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
  };
}

// Re-export functions for standalone use (for components that don't need the hook)
// These use global SWR mutate to trigger revalidation
import { mutate as globalMutate } from 'swr';

export async function createAddress(addressData: any) {
  const res = await api.post('/addresses', addressData);
  globalMutate('/addresses');
  return res.data;
}

export async function updateAddress(id: number, addressData: any) {
  const res = await api.put(`/addresses/${id}`, addressData);
  globalMutate('/addresses');
  return res.data;
}

export async function deleteAddress(id: number) {
  const res = await api.delete(`/addresses/${id}`);
  globalMutate('/addresses');
  return res.data;
}

export async function setDefaultAddress(id: number) {
  const res = await api.patch(`/addresses/${id}/default`);
  globalMutate('/addresses');
  return res.data;
}
