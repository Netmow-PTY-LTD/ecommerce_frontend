"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { getCurrencySymbol } from '@/contexts/CurrencyContext';
import { useAdminContext } from '@/components/admin/admin-navbar-provider';
import { usePathname } from 'next/navigation';
import { Newsletter } from '@/components/newsletter';

export function Footer() {
    const pathname = usePathname();
    const { isAdmin } = useAdminContext();

    // Don't render footer on admin or customer dashboard routes
    const shouldHide = isAdmin || pathname?.startsWith('/admin') || pathname?.startsWith('/customer');
    if (shouldHide) {
        return null;
    }

    const { settings } = useSettingsContext();

    return (
        <footer className="bg-background border-t border-border mt-auto pt-12 md:pt-16">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        {/* Logo / Company Name */}
                        <div className="mb-2">
                            {settings.logo_url ? (
                                <Image
                                    src={settings.logo_url.startsWith('http') ? settings.logo_url : `${process.env.NEXT_PUBLIC_API_URL}${settings.logo_url}`}
                                    alt={settings.company_name || 'Logo'}
                                    width={140}
                                    height={48}
                                    className="object-contain h-12 w-auto"
                                    unoptimized
                                />
                            ) : (
                                <h3 className="text-xl font-bold tracking-tight text-primary">
                                    {settings.company_name || 'LuxeStore'}
                                </h3>
                            )}
                        </div>
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
                            <li><Link href="/arrivals" className="hover:text-primary transition-colors">New Arrivals</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Support</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                            <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
                            <li><Link href="/track-order" className="hover:text-primary transition-colors">Track Order</Link></li>
                            <li><Link href="/shipping" className="hover:text-primary transition-colors">Shipping & Returns</Link></li>
                        </ul>
                    </div>

                    <Newsletter />
                </div>

                <div className="mt-12 py-4 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
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
