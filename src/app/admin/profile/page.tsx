'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/admin-layout';
import { ShieldCheck, Loader2, Save, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function AdminProfilePage() {
  const { user, updateUserContext } = useAuth();
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: ''
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || '',
        postal_code: user.postal_code || ''
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoadingProfile(true);
    try {
      const res = await api.put(`/users/update/${user.id}`, profileForm);
      toast.success('Profile updated successfully');
      // Assume API returns updated user data or we use the form data to update context
      const updatedUser = res.data?.data || profileForm;
      updateUserContext(updatedUser);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setShowPasswordModal(true);
  };

  const confirmPasswordChange = async () => {
    setLoadingPassword(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      });
      toast.success('Password updated successfully');
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <AdminLayout title="My Profile" subtitle="Manage your account settings and security">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-brand flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
              <p className="text-slate-500">{user?.email}</p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand">
                {user?.role?.name || 'Administrator'}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Info Update Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-bold text-slate-900">Profile Information</h3>
            <p className="text-sm text-slate-500 mt-1">
              Update your personal details and contact information.
            </p>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm"
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Phone</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Address</label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm"
                      placeholder="123 Main St"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">City</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm"
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">State / Province</label>
                    <input
                      type="text"
                      value={profileForm.state}
                      onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm"
                      placeholder="State"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Country</label>
                    <input
                      type="text"
                      value={profileForm.country}
                      onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm"
                      placeholder="Country"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Postal Code</label>
                    <input
                      type="text"
                      value={profileForm.postal_code}
                      onChange={(e) => setProfileForm({ ...profileForm, postal_code: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm"
                      placeholder="12345"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={loadingProfile}
                    className="bg-brand hover:bg-brand/90 text-white font-bold px-6 py-2 rounded-xl transition-all shadow-lg shadow-brand/10"
                  >
                    {loadingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
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
                  <div className="relative">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      required
                      value={passwords.oldPassword}
                      onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                      className="w-full px-4 py-2 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        className="w-full px-4 py-2 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={loadingPassword}
                    className="bg-brand hover:bg-brand/90 text-white font-bold px-6 py-2 rounded-xl transition-all shadow-lg shadow-brand/10"
                  >
                    {loadingPassword ? (
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

      <ConfirmationModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={confirmPasswordChange}
        title="Change Password?"
        description="Are you sure you want to change your password? You will need to use the new password the next time you log in."
        confirmText="Change Password"
        cancelText="Cancel"
        isLoading={loadingPassword}
        variant="warning"
      />
    </AdminLayout>
  );
}
