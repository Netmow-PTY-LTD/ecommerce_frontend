'use client';

import CustomerLayout from '@/components/customer/customer-layout';
import { usePathname } from 'next/navigation';
import { NotificationProvider } from '@/contexts/notification-context';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

function CustomerNotificationWrapper({ children }: { children: React.ReactNode }) {
  const { token } = useCustomerAuth();

  return (
    <NotificationProvider token={token || undefined}>
      {children}
    </NotificationProvider>
  );
}

export default function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Helper to get title from pathname
  const getTitle = (path: string) => {
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/orders')) return 'My Orders';
    if (path.includes('/wishlist')) return 'Wishlist';
    if (path.includes('/notifications')) return 'Notifications';
    if (path.includes('/profile')) return 'Profile Settings';
    return 'Account';
  };

  const getSubtitle = (path: string) => {
    if (path.includes('/dashboard')) return 'Welcome back! Here is your account overview.';
    if (path.includes('/orders')) return 'View and track your previous orders.';
    if (path.includes('/wishlist')) return 'Your saved items for later.';
    if (path.includes('/notifications')) return 'Stay updated with your notifications.';
    if (path.includes('/profile')) return 'Update your personal information.';
    return '';
  };

  return (
    <CustomerNotificationWrapper>
      <CustomerLayout
      // title={getTitle(pathname)}
      // subtitle={getSubtitle(pathname)}
      >
        {children}
      </CustomerLayout>
    </CustomerNotificationWrapper>
  );
}
