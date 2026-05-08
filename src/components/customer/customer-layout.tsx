'use client';

import { ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Heart,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Bell,
  Search,
  Menu,
  MapPin,
  User,
  ShoppingBag
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface CustomerLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  defaultSidebarCollapsed?: boolean;
}

const navigation = [
  { name: 'Dashboard', href: '/customer/dashboard', icon: LayoutDashboard },
  { name: 'My Orders', href: '/customer/orders', icon: Package },
  { name: 'Wishlist', href: '/wishlist', icon: Heart },
  { name: 'Profile Settings', href: '/customer/profile', icon: User },
];

export default function CustomerLayout({
  children,
  title,
  subtitle,
  defaultSidebarCollapsed = false
}: CustomerLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { customer, logout } = useCustomerAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(defaultSidebarCollapsed);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'C';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'flex flex-col transition-all duration-300 ease-in-out bg-white border-r border-slate-200 overflow-hidden print:hidden',
          sidebarCollapsed ? 'w-20' : 'w-64',
          'hidden lg:flex'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
          <div className={cn(
            'flex items-center gap-2 overflow-hidden transition-all duration-300',
            sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          )}>
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 whitespace-nowrap tracking-tight">Account</span>
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors shrink-0"
          >
            {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                isActive(item.href)
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-50'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                sidebarCollapsed && 'justify-center px-0'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5 shrink-0',
                isActive(item.href) ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
              )} />
              <span className={cn(
                'whitespace-nowrap transition-all duration-300',
                sidebarCollapsed ? 'hidden' : 'block'
              )}>
                {item.name}
              </span>
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100">
          <div className={cn(
            'flex items-center gap-3 transition-all duration-300',
            sidebarCollapsed ? 'justify-center' : 'justify-start'
          )}>
            <Avatar className="h-10 w-10 shrink-0 border-2 border-slate-50 shadow-sm">
              {customer?.image_url && (
                <AvatarImage
                  src={customer.image_url.startsWith('http') ? customer.image_url : `${process.env.NEXT_PUBLIC_API_URL}${customer.image_url}`}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-indigo-600 text-white text-xs font-bold">
                {getInitials(customer?.name)}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{customer?.name}</p>
                <p className="text-xs text-slate-500 truncate">{customer?.email}</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 z-30 print:hidden">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
              {subtitle && <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search (Placeholder like Admin) */}
            <div className="hidden md:flex relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Search your orders..."
                className="pl-10 pr-4 py-2 w-64 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <Link href="/" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <ShoppingBag className="h-5 w-5" />
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-xl p-0 overflow-hidden border border-slate-100">
                  <Avatar className="h-10 w-10 rounded-xl">
                    {customer?.image_url && (
                      <AvatarImage
                        src={customer.image_url.startsWith('http') ? customer.image_url : `${process.env.NEXT_PUBLIC_API_URL}${customer.image_url}`}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-slate-100 text-slate-700 text-sm font-bold">
                      {getInitials(customer?.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-200">
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex flex-col">
                    <p className="text-sm font-bold text-slate-900">{customer?.name}</p>
                    <p className="text-xs text-slate-500 font-normal">{customer?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={() => router.push('/customer/profile')} className="rounded-xl p-2 cursor-pointer">
                  <User className="h-4 w-4 mr-2 text-slate-400" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/customer/orders')} className="rounded-xl p-2 cursor-pointer">
                  <Package className="h-4 w-4 mr-2 text-slate-400" />
                  Orders
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl p-2 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scroll-smooth">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-72 h-full bg-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
              <span className="font-bold text-xl text-slate-900">Account</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <ChevronLeft className="h-6 w-6 text-slate-500" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all',
                    isActive(item.href) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="p-6 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
