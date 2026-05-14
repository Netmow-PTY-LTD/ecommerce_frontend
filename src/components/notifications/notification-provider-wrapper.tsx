'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { NotificationProvider } from '@/contexts/notification-context';

export function NotificationProviderWrapper({ children }: { children: ReactNode }) {
  const { token: adminToken } = useAuth();
  const { token: customerToken } = useCustomerAuth();

  // Use admin token if available, otherwise use customer token
  const token = adminToken || customerToken || undefined;

  return (
    <NotificationProvider token={token}>
      {children}
    </NotificationProvider>
  );
}
