import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { ApiResponse, ArrivalProduct, Pagination } from '@/types';

export function useAdminArrivals() {
    const [arrivals, setArrivals] = useState<ArrivalProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<Pagination | null>(null);

    const fetchArrivals = useCallback(async (page = 1, limit = 10, filters?: { status?: string; featured?: string; search?: string }) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (filters?.status) params.append('status', filters.status);
            if (filters?.featured) params.append('featured', filters.featured);
            if (filters?.search) params.append('search', filters.search);

            const response = await api.get<ApiResponse<ArrivalProduct[]>>(`/arrivals?${params.toString()}`);
            setArrivals(response.data.data || []);
            setPagination(response.data.pagination || null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch arrivals');
        } finally {
            setLoading(false);
        }
    }, []);

    const getArrivalById = useCallback(async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<ApiResponse<ArrivalProduct>>(`/arrivals/${id}`);
            return response.data.data;
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch arrival');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createArrival = useCallback(async (data: Partial<ArrivalProduct>) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post<ApiResponse<ArrivalProduct>>('/arrivals', data);
            return response.data.data;
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create arrival');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateArrival = useCallback(async (id: number, data: Partial<ArrivalProduct>) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.put<ApiResponse<ArrivalProduct>>(`/arrivals/${id}`, data);
            return response.data.data;
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update arrival');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteArrival = useCallback(async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/arrivals/${id}`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete arrival');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const reorderArrivals = useCallback(async (orders: { id: number; sort_order: number }[]) => {
        setLoading(true);
        setError(null);
        try {
            await api.put('/arrivals/reorder', { orders });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reorder arrivals');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<ApiResponse<{ total: number; active: number; featured: number }>>('/arrivals/stats');
            return response.data.data;
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch stats');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        arrivals,
        loading,
        error,
        pagination,
        fetchArrivals,
        getArrivalById,
        createArrival,
        updateArrival,
        deleteArrival,
        reorderArrivals,
        getStats,
    };
}
