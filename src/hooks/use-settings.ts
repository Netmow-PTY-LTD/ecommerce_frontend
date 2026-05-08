import useSWR from 'swr';
import { fetcher } from '@/lib/api';

interface CompanySettings {
    company_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    website?: string;
    description?: string;
    logo_url?: string;
    currency?: string;
    tax_id?: string;
}

export function useSettings() {
    const { data, error, isLoading } = useSWR<{ data: CompanySettings }>(
        '/settings/company/profile',
        fetcher,
        {
            revalidateOnFocus: true,
            revalidateOnReconnect: false,
            dedupingInterval: 60000 // Cache for 1 minute
        }
    );

    return {
        settings: data?.data || {},
        isLoading,
        isError: error
    };
}

interface ShippingRules {
    flat_rate: number;
    free_shipping_threshold: number;
}

export function useShippingRules() {
    const { data, error, isLoading } = useSWR<{ data: ShippingRules }>(
        '/settings/shipping-rules',
        fetcher,
        {
            revalidateOnFocus: true,
            revalidateOnReconnect: false,
            dedupingInterval: 60000 // Cache for 1 minute
        }
    );

    return {
        shippingRules: data?.data || { flat_rate: 15, free_shipping_threshold: 100 },
        isLoading,
        isError: error
    };
}
