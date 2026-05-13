'use client';

import { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success('Admin password reset link sent');
    } catch (error: any) {
      console.error('Admin forgot password failed:', error);
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl shadow-slate-200 border border-slate-100 text-center space-y-6">
          <div className="h-20 w-20 bg-brand/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-brand" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email Sent</h1>
            <p className="text-slate-500 font-medium">
              We've sent a secure reset link to your staff email <span className="font-bold text-slate-900">{email}</span>.
            </p>
          </div>
          <div className="pt-4">
            <Link href="/admin/login">
              <Button className="w-full h-12 rounded-xl bg-brand hover:bg-brand/90 font-bold text-sm shadow-lg shadow-brand/10 transition-all">
                Back to Admin Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200 border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <Link href="/admin/login" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-brand uppercase tracking-widest transition-all mb-8">
              <ArrowLeft className="h-4 w-4" />
              Admin Login
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-brand" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Recovery</h1>
            </div>
            
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
              Enter your official staff email address to receive a secure password reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Staff Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-brand transition-all" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                    placeholder="admin@company.com"
                    required
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
                  'Send Reset Instructions'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
