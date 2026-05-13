import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { ApiResponse, Product, Category, Pagination } from '@/types';

export function useCategories(page = 1, limit = 100) {
    const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        with_counts: '1',
        include_counts: '1'
    });

    const { data, error, isLoading } = useSWR<ApiResponse<Category[]>>(
        `/ecommerce/categories?${query.toString()}`,
        fetcher
    );

    return {
        categories: data?.data || [],
        pagination: data?.pagination,
        isLoading,
        isError: error,
    };
}

export function useCategory(idOrSlug: string) {
    const { data, error, isLoading } = useSWR<ApiResponse<Category>>(
        idOrSlug ? `/ecommerce/categories/${idOrSlug}` : null,
        fetcher
    );

    return {
        category: data?.data,
        isLoading,
        isError: error,
    };
}

export function useProducts(page = 1, limit = 10, options?: { category_id?: number; category_slug?: string; sort?: string; search?: string; in_stock?: boolean; min_price?: number; max_price?: number }) {
    const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    if (options?.category_id) {
        query.append('category_id', options.category_id.toString());
    }

    if (options?.category_slug) {
        query.append('category_slug', options.category_slug);
    }

    if (options?.sort) {
        query.append('sort', options.sort);
    }

    if (options?.search) {
        query.append('search', options.search);
    }

    if (options?.in_stock) {
        query.append('in_stock', 'true');
    }

    if (options?.min_price !== undefined) {
        query.append('min_price', options.min_price.toString());
    }

    if (options?.max_price !== undefined) {
        query.append('max_price', options.max_price.toString());
    }

    const { data, error, isLoading } = useSWR<ApiResponse<Product[]>>(
        `/ecommerce/products?${query.toString()}`,
        fetcher
    );

    return {
        products: data?.data || [],
        pagination: data?.pagination,
        isLoading,
        isError: error,
    };
}

export function useProduct(id: string) {
    const { data, error, isLoading } = useSWR<ApiResponse<Product>>(
        id ? `/ecommerce/products/${id}` : null,
        fetcher
    );

    return {
        product: data?.data,
        isLoading,
        isError: error,
    };
}
