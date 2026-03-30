"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useSettings } from '@/hooks/use-settings';

interface SettingsContextType {
    settings: {
        company_name?: string;
        logo_url?: string;
        currency?: string;
        email?: string;
        phone?: string;
        address?: string;
        city?: string;
        state?: string;
        country?: string;
        postal_code?: string;
        website?: string;
        description?: string;
        tax_id?: string;
    };
    isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
    settings: {},
    isLoading: true
});

export function SettingsProvider({ children }: { children: ReactNode }) {
    const { settings, isLoading } = useSettings();

    return (
        <SettingsContext.Provider value={{ settings, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettingsContext() {
    const context = useContext(SettingsContext);
    return context;
}
