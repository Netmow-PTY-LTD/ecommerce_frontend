'use client';

import { ReactNode } from 'react';
import { useAdminContext } from './admin-navbar-provider';

interface MainWrapperProps {
  children: ReactNode;
}

export default function MainWrapper({ children }: MainWrapperProps) {
  const { isAdmin } = useAdminContext();

  return (
    <main className={`flex-1 w-full ${isAdmin ? '' : 'pt-16'}`}>
      {children}
    </main>
  );
}
