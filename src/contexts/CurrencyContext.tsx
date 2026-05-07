"use client";

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useSettingsContext } from './SettingsContext';

interface CurrencyContextType {
    formatCurrency: (amount: number) => string;
    currency: string;
    currencySymbol: string;
}

const CurrencyContext = createContext<CurrencyContextType>({
    formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
    currency: 'USD',
    currencySymbol: '$'
});

export const currencySymbols: Record<string, string> = {
    // Major Currencies
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    INR: '₹',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'Fr',
    HKD: 'HK$',
    SGD: 'S$',
    NZD: 'NZ$',
    KRW: '₩',
    ZAR: 'R',
    BRL: 'R$',
    MXN: '$',

    // European Currencies
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    PLN: 'zł',
    CZK: 'Kč',
    HUF: 'Ft',
    RON: 'lei',
    BGN: 'лв',
    HRK: 'kn',
    RUB: '₽',
    TRY: '₺',

    // Middle Eastern Currencies
    ILS: '₪',
    SAR: '﷼',
    AED: 'د.إ',
    QAR: '﷼',
    KWD: 'د.ك',
    BHD: 'BD',
    OMR: '﷼',
    JOD: 'د.ا',
    LBP: 'ل.ل',

    // Asian Currencies
    THB: '฿',
    MYR: 'RM',
    IDR: 'Rp',
    PHP: '₱',
    VND: '₫',
    PKR: '₨',
    BDT: '৳',
    LKR: 'Rs',
    NPR: '₨',
    MMK: 'K',

    // Americas Currencies
    ARS: '$',
    CLP: '$',
    COP: '$',
    PEN: 'S/.',
    BOB: 'Bs.',
    UYU: '$',
    PYG: '₲',
    CRC: '₡',
    DOP: '$',
    CUP: '$',

    // African Currencies
    EGP: 'E£',
    NGN: '₦',
    KES: 'Sh',
    GHS: '₵',
    ETB: 'Br',
    TZS: 'TSh',
    UGX: 'Sh',
    XOF: 'CFA',
    XAF: 'FCFA',

    // Oceanian Currencies
    FJD: '$',
    PGK: 'K',
    WST: 'WS$',
    VUV: 'Vt',
    TOP: 'T$'
};

export const getCurrencySymbol = (currency: string) => {
    return currencySymbols[currency] || currency || '$';
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const { settings } = useSettingsContext();
    const currency = settings.currency || 'USD';
    const currencySymbol = currencySymbols[currency] || currency || '$';

    const formatCurrency = (amount: number) => {
        const symbol = currencySymbols[currency] || currency || '$';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount).replace(currency, symbol);
    };

    const value = useMemo(() => ({
        formatCurrency,
        currency,
        currencySymbol
    }), [currency, currencySymbol]);

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    return context;
}
