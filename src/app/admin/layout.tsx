'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import { NotificationProvider } from '@/contexts/notification-context';
import { ToastContainer } from '@/components/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { initSocket, disconnectSocket } from '@/lib/socket';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      initSocket(token);
    }
    return () => {
      if (!isAuthenticated) {
        disconnectSocket();
      }
    };
  }, [isAuthenticated, token]);

  return <>{children}</>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
        <ToastContainer />
        <Toaster position="bottom-right" richColors />
      </NotificationProvider>
    </AuthProvider>
  );
}
