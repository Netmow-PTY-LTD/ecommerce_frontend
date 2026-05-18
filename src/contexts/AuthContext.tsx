'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  status: 'active' | 'inactive';
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  role?: {
    id: number;
    name: string;
    display_name: string;
    permissions: string[];
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserContext: (updates: Partial<User>) => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on mount
    const storedToken = localStorage.getItem('admin_token');
    const storedUser = localStorage.getItem('admin_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Attempting login for:', email);
      }
      
      const response = await api.post('/auth/login', { email, password });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Login response received:', response.data);
      }
      
      // Handle various API response structures
      const responseData = response.data.data || response.data;
      const user = responseData.user || responseData.data?.user;
      const token = responseData.token || responseData.access_token || responseData.data?.token;

      if (!token) {
        console.error('[Auth] Token missing in response:', responseData);
        throw new Error('Login response did not include an authentication token');
      }

      // Explicitly set in state and localStorage
      setUser(user);
      setToken(token);
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));

      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Admin token set in localStorage:', token.substring(0, 10) + '...');
      }

      // Redirect to admin dashboard
      router.push('/admin/dashboard');
    } catch (error: any) {
      console.error('[Auth] Login error details:', error);
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/admin/login');
  };

  const updateUserContext = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('admin_user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    updateUserContext,
    loading,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
