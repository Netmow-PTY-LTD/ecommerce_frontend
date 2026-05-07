'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/admin-layout';
import { ShieldCheck, Loader2, Save, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AdminProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      });
      toast.success('Password updated successfully');
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="My Profile" subtitle="Manage your account settings and security">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
              <p className="text-slate-500">{user?.email}</p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {user?.role?.name || 'Administrator'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-bold text-slate-900">Security</h3>
            <p className="text-sm text-slate-500 mt-1">
              Update your password to keep your account secure. We recommend using a strong password that you don't use elsewhere.
            </p>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwords.oldPassword}
                    onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl transition-all shadow-lg shadow-indigo-100"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
