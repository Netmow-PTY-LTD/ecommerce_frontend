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
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 3600000 // Cache for 1 hour
        }
    );

    return {
        settings: data?.data || {},
        isLoading,
        isError: error
    };
}
