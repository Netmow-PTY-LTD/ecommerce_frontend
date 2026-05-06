"use client";

import Link from 'next/link';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { useAdminContext } from '@/components/admin/admin-navbar-provider';
import { usePathname } from 'next/navigation';

export function Footer() {
    const pathname = usePathname();
    const { isAdmin } = useAdminContext();

    // Don't render footer on admin or customer dashboard routes
    const shouldHide = isAdmin || pathname?.startsWith('/admin') || pathname?.startsWith('/customer');
    if (shouldHide) {
        return null;
    }

    const { settings } = useSettingsContext();

    const getCurrencySymbol = (currency: string) => {
        const symbols: Record<string, string> = {
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
        return symbols[currency] || currency || '$';
    };

    return (
        <footer className="bg-background border-t border-border mt-auto py-12 md:py-16">
            <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold tracking-tight text-primary">
                            {settings.company_name || 'LuxeStore'}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {settings.description || 'Premium products for a premium lifestyle. We curate the best items for you.'}
                        </p>
                        {settings.currency && (
                            <p className="text-xs text-muted-foreground">
                                Prices in {getCurrencySymbol(settings.currency)}
                            </p>
                        )}
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Shop</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/shop" className="hover:text-primary transition-colors">All Products</Link></li>
                            <li><Link href="/categories" className="hover:text-primary transition-colors">Categories</Link></li>
                            <li><Link href="/new-arrivals" className="hover:text-primary transition-colors">New Arrivals</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Support</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                            <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
                            <li><Link href="/shipping" className="hover:text-primary transition-colors">Shipping & Returns</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Newsletter</h4>
                        <p className="text-sm text-muted-foreground mb-4">Subscribe to receive updates, access to exclusive deals, and more.</p>
                        <form className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                    <p>&copy; 2026 {settings.company_name || 'LuxeStore'}. All rights reserved.</p>
                    <div className="flex gap-4">
                        <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
