'use client';

import { ReactNode } from 'react';
import AdminHeader from './admin-header';
import AdminFooter from './admin-footer';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader title={title} subtitle={subtitle} />
      <main className="flex-1 bg-muted/30">
        {children}
      </main>
      <AdminFooter />
    </div>
  );
}
