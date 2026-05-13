"use client";

import Link from 'next/link';
import { ShoppingCart, Menu, X, Search, Heart, GitCompare, Building2, User, Phone, Loader2, ShoppingBag } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
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
import { useCurrency, getCurrencySymbol } from '@/contexts/CurrencyContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Navbar() {
    const pathname = usePathname();
    const { isAdmin: isAdminRoute } = useAdminContext();
    const { isAuthenticated: isCustomerAuthenticated, customer, logout: customerLogout } = useCustomerAuth();
    const { isAuthenticated: isAdminAuthenticated, user, logout: adminLogout } = useAuth();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const cartItems = useCartStore((state) => state.items);
    const wishlistItems = useWishlistStore((state) => state.items);
    const compareItems = useCompareStore((state) => state.items);
    const router = useRouter();
    const { settings, isLoading } = useSettings();
    const { formatCurrency } = useCurrency();
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
            setShowDropdown(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const searchProducts = async () => {
            if (searchQuery.trim().length >= 2) {
                setIsSearching(true);
                setShowDropdown(true);
                try {
                    const response = await api.get(`/ecommerce/products?search=${encodeURIComponent(searchQuery)}&limit=6`);
                    setSearchResults(response.data.data || []);
                } catch (error) {
                    console.error('Search error:', error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowDropdown(false);
            }
        };

        const timeoutId = setTimeout(searchProducts, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

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
        { href: '/contact', label: 'Contact' },
    ];

    return (
        <header
            className={cn(
                'sticky top-0 w-full z-50 transition-all duration-300 border-b border-transparent bg-white shadow-sm'
            )}
        >
            {/* Top Bar */}
            <div className="bg-white border-b border-slate-50 hidden md:block">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-slate-500">
                    <div className="flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'transition-all duration-200 hover:text-brand',
                                    pathname === link.href ? 'text-brand' : 'text-slate-500'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
                            <Phone className="h-3 w-3 text-brand" />
                            <span className="normal-case font-semibold text-slate-600">Need help? Call Us: <span className="text-brand font-bold">{settings.phone || '+123 456 789'}</span></span>
                        </div>
                        <div className="flex items-center gap-4 pl-1">
                            {isCustomerAuthenticated || isAdminAuthenticated ? (
                                <Link href={`/${currentUser?.role?.name === 'Superadmin' ? 'admin' : 'customer'}/orders`} className="hover:text-brand transition-colors">Track Order</Link>
                            ) : (
                                <Link href="/login" className="hover:text-brand transition-colors">Track Order</Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20 py-4">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="flex items-center gap-3">
                            {isLoading ? (
                                <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg hidden sm:block" />
                            ) : settings.logo_url ? (
                                <Image
                                    src={settings.logo_url}
                                    alt={settings.company_name || 'LuxeStore'}
                                    width={100}
                                    height={100}
                                    className="rounded-lg w-20 h-auto"
                                    priority
                                />
                            ) : (
                                <span className="font-bold text-2xl tracking-tighter text-primary hidden sm:inline">
                                    {settings?.company_name || 'LuxeStore'}
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* Search Bar (Desktop) */}
                    <div className="hidden md:flex flex-1 max-w-xl mx-8 relative" ref={searchRef}>
                        <form onSubmit={handleSearchSubmit} className="relative w-full group">
                            <input
                                type="text"
                                placeholder="Search For items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.trim().length >= 2 && setShowDropdown(true)}
                                className="w-full h-11 pl-4 pr-14 rounded-lg border-2 border-brand focus:outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
                            />
                            <button
                                type="submit"
                                className="absolute right-0 top-0 h-full w-12 bg-brand flex items-center justify-center rounded-r-[6px] text-white hover:opacity-90 transition-all duration-200 active:scale-95"
                            >
                                {isSearching ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Search className="h-5 w-5 stroke-[2.5px]" />
                                )}
                            </button>
                        </form>

                        {/* Live Results Dropdown */}
                        {showDropdown && (
                            <div className="absolute top-full left-0 right-0 bg-white mt-2 rounded-xl shadow-2xl border border-slate-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                {isSearching ? (
                                    <div className="p-8 flex flex-col items-center justify-center gap-3">
                                        <Loader2 className="h-8 w-8 text-brand animate-spin" />
                                        <p className="text-xs text-slate-500 font-medium tracking-wide">Searching products...</p>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="p-2">
                                        <div className="grid grid-cols-1 gap-1">
                                            {searchResults.map((product) => (
                                                <Link
                                                    key={product.id}
                                                    href={`/product/${product.slug || product.id}`}
                                                    onClick={() => setShowDropdown(false)}
                                                    className="flex items-center gap-4 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                                                >
                                                    <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                                                        <Image
                                                            src={product.image_url || product.thumb_url || '/placeholder.png'}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                            unoptimized
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] uppercase tracking-wider font-bold text-brand mb-0.5">
                                                            {product.category?.name || 'Category'}
                                                        </p>
                                                        <h4 className="text-sm font-bold text-slate-800 truncate leading-tight group-hover:text-brand transition-colors">
                                                            {product.name}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-sm font-black text-slate-900">
                                                                {formatCurrency(product.sale_price || product.price)}
                                                            </span>
                                                            {(product.sale_price && product.price > product.sale_price) && (
                                                                <span className="text-xs text-slate-400 line-through">
                                                                    {formatCurrency(product.price)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                        <div className="mt-2 p-2 border-t border-slate-50">
                                            <Link
                                                href={`/shop?search=${encodeURIComponent(searchQuery)}`}
                                                onClick={() => setShowDropdown(false)}
                                                className="block w-full py-2 text-center text-xs font-bold text-slate-500 hover:text-brand transition-colors uppercase tracking-widest"
                                            >
                                                View All Results →
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center">
                                        <ShoppingBag className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                        <p className="text-sm font-bold text-slate-600">No products found</p>
                                        <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="hidden md:flex items-center space-x-4">
                        {/* Actions for Desktop - Search is handled by the expanded bar */}
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
                                        <Avatar className="w-full h-full rounded-full">
                                            {(currentUser as any).image_url && (
                                                <AvatarImage
                                                    src={(currentUser as any).image_url.startsWith('http') ? (currentUser as any).image_url : `${process.env.NEXT_PUBLIC_API_URL}${(currentUser as any).image_url}`}
                                                    className="object-cover"
                                                />
                                            )}
                                            <AvatarFallback className="bg-indigo-600 text-white text-xs font-bold">
                                                {getInitials(currentUser.name)}
                                            </AvatarFallback>
                                        </Avatar>
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
                    <div className="md:hidden flex items-center space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
                            <Search className="h-5 w-5" />
                        </Button>
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
                                        <Avatar className="w-full h-full rounded-full">
                                            {(currentUser as any).image_url && (
                                                <AvatarImage
                                                    src={(currentUser as any).image_url.startsWith('http') ? (currentUser as any).image_url : `${process.env.NEXT_PUBLIC_API_URL}${(currentUser as any).image_url}`}
                                                    className="object-cover"
                                                />
                                            )}
                                            <AvatarFallback className="bg-indigo-600 text-white text-xs font-bold">
                                                {getInitials(currentUser.name)}
                                            </AvatarFallback>
                                        </Avatar>
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
                                <Button variant="outline" className="w-full justify-start gap-2 rounded-xl overflow-hidden p-2">
                                    {isAuthenticated && currentUser ? (
                                        <Avatar className="h-6 w-6 rounded-lg overflow-hidden">
                                            {(currentUser as any).image_url && (
                                                <AvatarImage
                                                    src={(currentUser as any).image_url.startsWith('http') ? (currentUser as any).image_url : `${process.env.NEXT_PUBLIC_API_URL}${(currentUser as any).image_url}`}
                                                    className="object-cover"
                                                />
                                            )}
                                            <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-bold">
                                                {getInitials(currentUser.name)}
                                            </AvatarFallback>
                                        </Avatar>
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
