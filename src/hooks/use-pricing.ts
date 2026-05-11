'use client';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import api from '@/lib/api';

export function useActiveFlashSales() {
  const { data, error, isLoading } = useSWR('/pricing/public/flash-sales', fetcher);
  return { flashSales: data?.data || [], isLoading, isError: error };
}

export function useActiveCoupons() {
  const { data, error, isLoading } = useSWR('/pricing/public/active-coupons', (url) => {
    // Get token from localStorage to check if user is logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('customer_token') : null;
    return api.get(url, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }).then(res => res.data);
  });
  return { coupons: data?.data || [], isLoading, isError: error };
}

export function useFlashSale(slug: string) {
  // Check if slug is a number (ID) or actual slug string
  const isNumeric = /^\d+$/.test(slug);
  const endpoint = isNumeric
    ? `/pricing/public/flash-sales-by-id/${slug}`
    : `/pricing/public/flash-sales/${slug}`;

  const { data, error, isLoading } = useSWR(slug ? endpoint : null, fetcher);
  return { flashSale: data?.data, isLoading, isError: error };
}

export function useProductFlashSalePrice(productId: number | undefined) {
  const { data, error, isLoading } = useSWR(
    productId ? `/pricing/public/flash-sale-price/${productId}` : null,
    fetcher
  );
  return {
    flashSalePrice: data?.data?.sale_price || null,
    flashSale: data?.data?.flash_sale || null,
    isLoading,
    isError: error
  };
}

export async function validateCoupon(
  code: string,
  cartTotal: number,
  customerId?: number,
  cartItems?: { product_id: number; quantity: number; unit_price: number }[]
) {
  const payload: any = { code, cart_total: cartTotal, customer_id: customerId };
  if (cartItems) payload.cart_items = cartItems;
  const res = await api.post('/pricing/coupons/validate', payload);
  return res.data;
}

export async function getProductTierPricing(productId: number) {
  const res = await api.get(`/pricing/product/${productId}/tiers`);
  return res.data;
}
