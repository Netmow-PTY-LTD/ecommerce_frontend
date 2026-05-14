'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LayoutDashboard, ShoppingCart, Users, Package, Settings, LogOut, Menu, FileText, ExternalLink, Store } from 'lucide-react';
import { useState } from 'react';
import { NotificationBell } from '@/components/notifications';
import Link from 'next/link';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

export default function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Pages', href: '/admin/pages', icon: FileText },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const getInitials = (name: string | undefined) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        {/* Mobile menu button */}
        <div className="md:hidden mr-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand to-brand/90 flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="hidden md:inline-block font-bold text-xl">Admin Panel</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 mx-8">
          {/* Visit Store Link */}
          <Link href="/">
            <Button variant="ghost" className="text-brand hover:text-brand/80 gap-2">
              <Store className="h-4 w-4" />
              Visit Store
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>

          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.name}
                variant="ghost"
                className="text-slate-600 hover:text-slate-900"
                onClick={() => router.push(item.href)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.name}
              </Button>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <NotificationBell userType="admin" />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-brand to-brand/90 text-white">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || 'Admin User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || 'admin@example.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Page Title Bar */}
      <div className="border-b bg-muted/40">
        <div className="px-8 py-4">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="px-4 py-4 space-y-2">
            {/* Visit Store Link */}
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-brand hover:text-brand/80 gap-2">
                <Store className="h-4 w-4" />
                Visit Store
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            </Link>

            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    router.push(item.href);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

