"use client";

import Link from 'next/link';
import { ShoppingCart, Menu, X, Search, Heart, GitCompare, Building2, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCartStore, useWishlistStore, useCompareStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { SearchModal } from '@/components/search-modal';
import { useSettings } from '@/hooks/use-settings';
import Image from 'next/image';
import { useAdminContext } from '@/components/admin/admin-navbar-provider';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { LoginModal } from '@/components/auth/login-modal';

export function Navbar() {
    const pathname = usePathname();
    const { isAdmin: isAdminRoute } = useAdminContext();
    const { isAuthenticated: isCustomerAuthenticated, customer, logout: customerLogout } = useCustomerAuth();
    const { isAuthenticated: isAdminAuthenticated, user, logout: adminLogout } = useAuth();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const cartItems = useCartStore((state) => state.items);
    const wishlistItems = useWishlistStore((state) => state.items);
    const compareItems = useCompareStore((state) => state.items);
    const router = useRouter();
    const { settings } = useSettings();

    const isAuthenticated = isCustomerAuthenticated || isAdminAuthenticated;
    const currentUser = customer || user;

    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const wishlistCount = wishlistItems.length;
    const compareCount = compareItems.length;

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Don't render navbar on admin or customer dashboard routes
    const shouldHide = isAdminRoute || pathname?.startsWith('/admin') || pathname?.startsWith('/customer');
    if (shouldHide) {
        return null;
    }

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

    const getInitials = (name: string | undefined) => {
        if (!name) return '';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getDashboardLink = () => {
        const role = user?.role || customer?.role;
        if (role) {
            if (role.name === 'Superadmin') return '/admin/dashboard';
            if (role.name === 'Admin') return '/customer/dashboard';
        }
        return '/customer/dashboard';
    };

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/shop', label: 'Shop' },
        { href: '/categories', label: 'Categories' },
    ];

    return (
        <header
            className={cn(
                'fixed top-0 w-full z-50 transition-all duration-300 border-b border-transparent bg-white'
            )}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="flex items-center gap-3">
                            {settings.logo_url ? (
                                <Image
                                    src={settings.logo_url}
                                    alt={settings.company_name || 'LuxeStore'}
                                    width={40}
                                    height={40}
                                    className="rounded-lg"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-white" />
                                </div>
                            )}
                            <span className="font-bold text-2xl tracking-tighter text-primary hidden sm:inline">
                                {settings.company_name || 'LuxeStore'}
                            </span>
                        </Link>
                        {settings.currency && (
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full hidden lg:inline-block">
                                {getCurrencySymbol(settings.currency)}
                            </span>
                        )}
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'text-sm font-medium transition-colors hover:text-primary',
                                    pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
                            <Search className="h-5 w-5" />
                        </Button>
                        <Link href="/wishlist">
                            <Button variant="ghost" size="icon" className="relative">
                                <Heart className="h-5 w-5" />
                                {mounted && wishlistCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in zoom-in">
                                        {wishlistCount}
                                    </span>
                                )}
                            </Button>
                        </Link>
                        <Link href="/compare">
                            <Button variant="ghost" size="icon" className="relative">
                                <GitCompare className="h-5 w-5" />
                                {mounted && compareCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in zoom-in">
                                        {compareCount}
                                    </span>
                                )}
                            </Button>
                        </Link>
                        <Link href="/cart">
                            <Button variant="ghost" size="icon" className="relative">
                                <ShoppingCart className="h-5 w-5" />
                                {mounted && cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in zoom-in">
                                        {cartCount}
                                    </span>
                                )}
                            </Button>
                        </Link>
                        <div onClick={() => !isAuthenticated && setIsLoginModalOpen(true)} className="cursor-pointer">
                            <Link href={isAuthenticated ? getDashboardLink() : "#"} onClick={(e) => !isAuthenticated && e.preventDefault()}>
                                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full border border-transparent hover:border-slate-200 transition-all overflow-hidden p-0">
                                    {isAuthenticated && currentUser ? (
                                        <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                            {getInitials(currentUser.name)}
                                        </div>
                                    ) : (
                                        <User className="h-5 w-5" />
                                    )}
                                    {isAuthenticated && (
                                        <span className="absolute bottom-0.5 right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-green-500 border-2 border-background" />
                                    )}
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center space-x-2">
                        <Link href="/wishlist">
                            <Button variant="ghost" size="icon" className="relative">
                                <Heart className="h-5 w-5" />
                                {mounted && wishlistCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                        {wishlistCount}
                                    </span>
                                )}
                            </Button>
                        </Link>
                        <Link href="/compare">
                            <Button variant="ghost" size="icon" className="relative">
                                <GitCompare className="h-5 w-5" />
                                {mounted && compareCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                        {compareCount}
                                    </span>
                                )}
                            </Button>
                        </Link>
                        <Link href="/cart">
                            <Button variant="ghost" size="icon" className="relative">
                                <ShoppingCart className="h-5 w-5" />
                                {mounted && cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                        {cartCount}
                                    </span>
                                )}
                            </Button>
                        </Link>
                        <div onClick={() => !isAuthenticated && setIsLoginModalOpen(true)} className="cursor-pointer">
                            <Link href={isAuthenticated ? getDashboardLink() : "#"} onClick={(e) => !isAuthenticated && e.preventDefault()}>
                                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full border border-transparent hover:border-slate-200 transition-all overflow-hidden p-0">
                                    {isAuthenticated && currentUser ? (
                                        <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                            {getInitials(currentUser.name)}
                                        </div>
                                    ) : (
                                        <User className="h-5 w-5" />
                                    )}
                                    {isAuthenticated && (
                                        <span className="absolute bottom-0.5 right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-green-500 border-2 border-background" />
                                    )}
                                </Button>
                            </Link>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-background border-b border-border animate-in slide-in-from-top-4">
                    <div className="px-4 py-4 space-y-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={cn(
                                    'block px-3 py-2 rounded-md text-base font-medium transition-colors hover:bg-accent',
                                    pathname === link.href ? 'text-primary bg-accent/50' : 'text-muted-foreground'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="pt-4 mt-4 border-t border-border space-y-2">
                            <div
                                onClick={() => {
                                    if (!isAuthenticated) {
                                        setIsMenuOpen(false);
                                        setIsLoginModalOpen(true);
                                    } else {
                                        setIsMenuOpen(false);
                                        router.push(getDashboardLink());
                                    }
                                }}
                                className='block'
                            >
                                <Button variant="outline" className="w-full justify-start gap-2 rounded-xl overflow-hidden">
                                    {isAuthenticated && currentUser ? (
                                        <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                                            {getInitials(currentUser.name)}
                                        </div>
                                    ) : (
                                        <User className="h-4 w-4" />
                                    )}
                                    {isAuthenticated ? `${currentUser?.name || 'My Account'}` : 'Sign In'}
                                </Button>
                            </div>
                            <Link href="/wishlist" onClick={() => setIsMenuOpen(false)} className='block'>
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <Heart className="h-4 w-4" /> Wishlist
                                    {wishlistCount > 0 && (
                                        <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                            {wishlistCount}
                                        </span>
                                    )}
                                </Button>
                            </Link>
                            <Link href="/compare" onClick={() => setIsMenuOpen(false)} className='block'>
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <GitCompare className="h-4 w-4" /> Compare
                                    {compareCount > 0 && (
                                        <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                            {compareCount}
                                        </span>
                                    )}
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2"
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    setIsSearchOpen(true);
                                }}
                            >
                                <Search className="h-4 w-4" /> Search
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Modal */}
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            {/* Login Modal */}
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </header>
    );
}
