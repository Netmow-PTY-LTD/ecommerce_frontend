'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

interface AdminContextType {
  isAdmin: boolean;
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
});

export function useAdminContext() {
  return useContext(AdminContext);
}

interface AdminNavbarProviderProps {
  children: ReactNode;
}

export default function AdminNavbarProvider({ children }: AdminNavbarProviderProps) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if current path starts with /admin
    const isAdminRoute = pathname?.startsWith('/admin') || false;
    setIsAdmin(isAdminRoute);

    // Add or remove admin class from body
    if (isAdminRoute) {
      document.body.classList.add('admin-route');
    } else {
      document.body.classList.remove('admin-route');
    }
  }, [pathname]);

  return (
    <AdminContext.Provider value={{ isAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}
