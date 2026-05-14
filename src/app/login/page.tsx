'use client';

import { useState, useEffect, Suspense } from 'react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye, EyeOff, ShoppingBag, Mail, Lock, ArrowRight,
  ShieldCheck, Truck, RefreshCcw, Loader2
} from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import Image from 'next/image';


function CustomerLoginPageContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, loading, isAuthenticated: isCustomerAuthenticated } = useCustomerAuth();
  const { isAuthenticated: isAdminAuthenticated, user } = useAuth();
  const { settings, isLoading: settingsLoading } = useSettings();
  const router = useRouter();


  const isAuthenticated = isCustomerAuthenticated || isAdminAuthenticated;

  useEffect(() => {
    // Pre-fill email from query params
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (isAdminAuthenticated && user?.role?.name === 'Superadmin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/customer/dashboard');
      }
    }
  }, [loading, isAuthenticated, isAdminAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand/10 border-t-brand"></div>
      </div>
    );
  }


  if (isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            {settingsLoading ? (
              <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
            ) : settings.logo_url ? (
              <Image
                src={settings.logo_url}
                alt={settings.company_name || 'Store Logo'}
                width={120}
                height={40}
                className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
                priority
              />
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-lg shadow-brand/20 transition-transform group-hover:scale-105">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900 tracking-tight">
                  {settings.company_name || 'YourStore'}
                </span>
              </>
            )}
          </Link>
        </div>


        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-2">Sign in to your account to continue shopping</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-xs">!</span>
              </div>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-brand hover:opacity-80 font-medium">

                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl text-white font-bold text-sm bg-brand hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand/10"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

        </div>

        {/* Features */}
        <div className="mt-10 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-white flex items-center justify-center mb-2 shadow-sm border border-slate-100">
              <ShieldCheck className="h-5 w-5 text-slate-600" />
            </div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Secure</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-white flex items-center justify-center mb-2 shadow-sm border border-slate-100">
              <Truck className="h-5 w-5 text-slate-600" />
            </div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fast Delivery</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-white flex items-center justify-center mb-2 shadow-sm border border-slate-100">
              <RefreshCcw className="h-5 w-5 text-slate-600" />
            </div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Returns</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 flex items-center justify-center gap-2 transition-colors">
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to store
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand/10 border-t-brand"></div>
      </div>
    }>

      <CustomerLoginPageContent />
    </Suspense>
  );
}
