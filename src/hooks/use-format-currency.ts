import { useCallback } from 'react';
import { useSettingsContext } from '@/contexts/SettingsContext';

export function useFormatCurrency() {
    const { settings } = useSettingsContext();

    const formatCurrency = useCallback((amount: number) => {
        const currency = settings.currency || 'USD';

        const currencySymbols: Record<string, string> = {
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

        const symbol = currencySymbols[currency] || currency || '$';

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount).replace(currency, symbol);
    }, [settings.currency]);

    return { formatCurrency, currency: settings.currency || 'USD' };
}
