'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  customer_type: 'individual' | 'company';
  status: 'active' | 'inactive';
  thumb_url: string | null;
  role?: {
    id: number;
    name: string;
    display_name: string;
  };
}

interface CustomerAuthContextType {
  customer: Customer | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateCustomer: (data: Partial<Customer>) => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if customer is logged in on mount
    const storedToken = localStorage.getItem('customer_token');
    const storedCustomer = localStorage.getItem('customer_data');

    if (storedToken && storedCustomer) {
      setToken(storedToken);
      setCustomer(JSON.parse(storedCustomer));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // For now, we'll authenticate customers by email/password
      // This endpoint might need to be created in the backend
      const response = await api.post('/customers/login', { email, password });
      const { customer, token } = response.data.data;

      setCustomer(customer);
      setToken(token);
      localStorage.setItem('customer_token', token);
      localStorage.setItem('customer_data', JSON.stringify(customer));

      // Redirect to customer dashboard
      router.push('/customer/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    setCustomer(null);
    setToken(null);
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_data');
    router.push('/login');
  };

  const updateCustomer = (data: Partial<Customer>) => {
    if (customer) {
      const updatedCustomer = { ...customer, ...data };
      setCustomer(updatedCustomer);
      localStorage.setItem('customer_data', JSON.stringify(updatedCustomer));
    }
  };

  const value = {
    customer,
    token,
    login,
    logout,
    updateCustomer,
    loading,
    isAuthenticated: !!customer && !!token,
  };

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
