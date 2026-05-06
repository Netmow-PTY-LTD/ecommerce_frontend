'use client';

import CustomerLayout from '@/components/customer/customer-layout';
import { usePathname } from 'next/navigation';

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
    if (path.includes('/addresses')) return 'Addresses';
    if (path.includes('/profile')) return 'Profile Settings';
    return 'Account';
  };

  const getSubtitle = (path: string) => {
    if (path.includes('/dashboard')) return 'Welcome back! Here is your account overview.';
    if (path.includes('/orders')) return 'View and track your previous orders.';
    if (path.includes('/wishlist')) return 'Your saved items for later.';
    if (path.includes('/addresses')) return 'Manage your delivery locations.';
    if (path.includes('/profile')) return 'Update your personal information.';
    return '';
  };

  return (
    <CustomerLayout 
      title={getTitle(pathname)} 
      subtitle={getSubtitle(pathname)}
    >
      {children}
    </CustomerLayout>
  );
}
