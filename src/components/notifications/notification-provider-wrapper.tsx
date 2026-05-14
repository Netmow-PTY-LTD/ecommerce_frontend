'use client';

import { ReactNode, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { NotificationProvider } from '@/contexts/notification-context';
import { usePathname } from 'next/navigation';

export function NotificationProviderWrapper({ children }: { children: ReactNode }) {
  const { token: adminToken } = useAuth();
  const { token: customerToken } = useCustomerAuth();
  const pathname = usePathname();

  // Determine which token to use based on the current route
  // Admin routes (/admin/*) should use admin token
  // Customer routes (/account/*, /customer/*) should use customer token
  // Public routes (/, /shop, etc.) prefer customer token, fall back to admin token
  const token = useMemo(() => {
    const isAdminRoute = pathname?.startsWith('/admin');
    const isCustomerRoute = pathname?.startsWith('/account') || pathname?.startsWith('/customer');

    if (isAdminRoute) {
      return adminToken || undefined;
    } else if (isCustomerRoute) {
      return customerToken || undefined;
    } else {
      // Public routes - prefer customer token for customers, admin token for admins
      return (customerToken || adminToken) || undefined;
    }
  }, [adminToken, customerToken, pathname]);

  return (
    <NotificationProvider token={token}>
      {children}
    </NotificationProvider>
  );
}
