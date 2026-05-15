import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { ApiResponse, ArrivalProduct } from '@/types';

export function useArrivals(page = 1, limit = 12) {
    const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    const { data, error, isLoading } = useSWR<ApiResponse<ArrivalProduct[]>>(
        `/ecommerce/arrivals?${query.toString()}`,
        fetcher
    );

    return {
        arrivals: data?.data || [],
        pagination: data?.pagination,
        isLoading,
        isError: error,
    };
}

export function useFeaturedArrivals(limit = 10) {
    const query = new URLSearchParams({
        limit: limit.toString(),
    });

    const { data, error, isLoading } = useSWR<ApiResponse<ArrivalProduct[]>>(
        `/ecommerce/arrivals/featured?${query.toString()}`,
        fetcher
    );

    return {
        arrivals: data?.data || [],
        isLoading,
        isError: error,
    };
}
