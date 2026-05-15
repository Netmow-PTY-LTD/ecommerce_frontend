'use client';

import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  User, Mail, Phone, MapPin, Building2, Globe, Hash, Save,
  ShieldCheck, Camera, Loader2, CheckCircle2, ArrowLeft,
  Settings, CreditCard, Bell, LogOut, Package, ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export default function CustomerProfilePage() {
  const { customer, loading: authLoading, isAuthenticated, updateCustomer, logout } = useCustomerAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    customer_type: 'individual'
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        country: customer.country || '',
        postal_code: customer.postal_code || '',
        customer_type: customer.customer_type || 'individual'
      });
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append('image', file);

    setUploading(true);
    try {
      const response = await api.post(`/customers/me/profile-image`, uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status) {
        toast.success('Profile image updated successfully!');
        if (response.data.data.image_url) {
          updateCustomer({ image_url: response.data.data.image_url });
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put(`/customers/me`, formData);
      if (response.data.status) {
        toast.success('Profile updated successfully!');
        updateCustomer(formData as any);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-brand" />
      </div>
    );
  }

  if (!isAuthenticated || !customer) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-8">

            {/* Left Sidebar */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="h-40 bg-brand/5 border-b border-slate-100 flex items-center justify-center">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-md ring-1 ring-slate-100">
                      {customer.image_url && (
                        <AvatarImage
                          src={customer.image_url.startsWith('http') ? customer.image_url : `${process.env.NEXT_PUBLIC_API_URL}${customer.image_url}`}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-slate-50 text-slate-400 text-2xl font-bold uppercase">
                        {customer.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={handleImageClick}
                      disabled={uploading}
                      className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-brand text-white shadow-md flex items-center justify-center hover:scale-110 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                  </div>
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{formData.name || 'Customer'}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1 truncate">{formData.email}</p>

                  <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                      {formData.customer_type}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-green-50 text-[10px] font-bold text-green-600 uppercase tracking-tight flex items-center gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                    </span>
                  </div>
                </div>

                <nav className="border-t border-slate-100 p-2 space-y-1">
                  <Link href="/customer/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand rounded-lg transition-colors">
                    <ShoppingBag className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link href="/customer/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand rounded-lg transition-colors">
                    <Package className="w-4 h-4" /> My Orders
                  </Link>
                  <Link href="/customer/notifications" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand rounded-lg transition-colors">
                    <Bell className="w-4 h-4" /> Notifications
                  </Link>
                  <button type="button" onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-left">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </nav>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-3 text-brand">
                  <ShieldCheck className="h-5 w-5" />
                  <h4 className="text-sm font-bold uppercase tracking-wider">Account Security</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  We value your privacy. Your personal information is encrypted and stored securely in accordance with our data protection policies.
                </p>
              </div>
            </div>

            {/* Form Content */}
            <div className="md:col-span-4 space-y-6">

              {/* Profile Details */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                  <User className="h-4 w-4 text-brand" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Personal Details</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
                        placeholder="Your full name"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Account Type</label>
                      <select
                        name="customer_type"
                        value={formData.customer_type}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all appearance-none cursor-pointer"
                      >
                        <option value="individual">Individual</option>
                        <option value="company">Business/Company</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-400 cursor-not-allowed"
                        placeholder="Email (Cannot be changed)"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Contact Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
                        placeholder="+1 234 567 890"
                      />
                    </div>

                    {formData.customer_type === 'company' && (
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Company Name</label>
                        <input
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
                          placeholder="Acme Corporation Ltd."
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-brand" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Shipping Information</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Street Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
                        placeholder="House #123, Road #45, Area Name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
                        placeholder="New York"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">State / Region</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
                        placeholder="NY"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
                        placeholder="United States"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Postal / Zip Code</label>
                      <input
                        type="text"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
                        placeholder="10001"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-brand" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Security & Password</h3>
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate-500 font-medium mb-5">To change your password, provide your current password and a new one below.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Current Password</label>
                      <input
                        type="password"
                        name="oldPassword"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      const oldPass = (document.querySelector('input[name="oldPassword"]') as HTMLInputElement)?.value;
                      const newPass = (document.querySelector('input[name="newPassword"]') as HTMLInputElement)?.value;
                      if (!oldPass || !newPass) return toast.error('Fill both password fields');
                      try {
                        setLoading(true);
                        const response = await api.post('/customers/me/change-password', { oldPassword: oldPass, newPassword: newPass });
                        if (response.data.status) {
                          toast.success('Password updated!');
                          (document.querySelector('input[name="oldPassword"]') as HTMLInputElement).value = '';
                          (document.querySelector('input[name="newPassword"]') as HTMLInputElement).value = '';
                        }
                      } catch (error: any) {
                        toast.error(error.response?.data?.message || 'Failed to update password');
                      } finally { setLoading(false); }
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider h-9 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Update Password
                  </Button>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 bg-brand text-white text-xs font-bold rounded-xl shadow-lg shadow-brand/10 hover:bg-brand/90 transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Profile
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
