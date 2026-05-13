'use client';

import { useState, Suspense } from 'react';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

function AdminResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!token) {
      toast.error('Invalid or missing token');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      toast.success('Admin password reset successfully');
    } catch (error: any) {
      console.error('Admin reset password failed:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200 border border-slate-100 text-center space-y-6">
        <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Access Restored</h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            Your admin account password has been updated. You can now access the dashboard.
          </p>
        </div>
        <div className="pt-4">
          <Link href="/admin/login">
            <Button className="w-full h-12 rounded-xl bg-brand hover:bg-brand/90 font-bold text-sm shadow-lg shadow-brand/10 transition-all flex items-center justify-center gap-2">
              Login to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200 border border-slate-100 text-center space-y-6">
        <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <Lock className="h-10 w-10 text-red-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Link Expired</h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            This security link is no longer valid. For security reasons, reset links expire after one hour.
          </p>
        </div>
        <div className="pt-4">
          <Link href="/admin/forgot-password">
            <Button className="w-full h-12 rounded-xl bg-brand hover:bg-brand/90 font-bold text-sm shadow-lg shadow-brand/10 transition-all">
              Request New Link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200 border border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reset Admin Password</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">New Security Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-brand transition-all" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-12 pr-12 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                placeholder="••••••••"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm New Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-brand transition-all" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-12 pl-12 pr-12 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 rounded-xl bg-brand hover:bg-brand/90 font-bold text-sm shadow-lg shadow-brand/10 transition-all"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Update Admin Account'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full">
        <Suspense fallback={
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200 border border-slate-100 flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-10 w-10 animate-spin text-brand" />
          </div>
        }>
          <AdminResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
