'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {/* No Navbar or Footer for admin routes */}
      {children}
      <Toaster position="bottom-right" richColors />
    </AuthProvider>
  );
}
