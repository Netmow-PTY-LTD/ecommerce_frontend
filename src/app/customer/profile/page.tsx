'use client';

import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useState, useEffect, useRef } from 'react';
import {
  User, Mail, Phone, MapPin, Building2, Globe, Hash, Save,
  ShieldCheck, ArrowLeft, Camera, Loader2, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AddressList } from '@/components/address/address-list';
import { useAddresses } from '@/hooks/use-addresses';

export default function CustomerProfilePage() {
  const { customer, loading: authLoading, isAuthenticated, updateCustomer } = useCustomerAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addresses, isLoading: loadingAddresses } = useAddresses();
  const [addressesKey, setAddressesKey] = useState(0); // Used to refresh addresses
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const response = await api.post(`/customers/${customer?.id}/profile-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status) {
        toast.success('Profile image updated successfully!');
        // Update both local state and global context
        if (response.data.data.image_url) {
          updateCustomer({ image_url: response.data.data.image_url });
        }
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In a real app, you would have a PATCH endpoint for profile update
      const response = await api.put(`/customers/${customer?.id}`, formData);

      if (response.data.status) {
        toast.success('Profile updated successfully!');
        updateCustomer(formData as any);
      }
    } catch (error: any) {
      console.error('Update failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated || !customer) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Profile Settings</h2>
          <p className="text-sm text-slate-500 font-medium">Manage your account information and preferences.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 text-[10px] font-bold text-green-600 uppercase tracking-widest">
              <CheckCircle2 className="h-3 w-3" />
              Verified Account
           </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar and Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden group">
            {/* Decorative Background */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-indigo-500 to-purple-600" />
            
            <div className="relative z-10 pt-4">
              <div className="relative inline-block mx-auto mb-6">
                <Avatar className="h-32 w-32 border-4 border-white shadow-xl shadow-slate-200">
                  {customer.image_url && (
                    <AvatarImage 
                      src={customer.image_url.startsWith('http') ? customer.image_url : `${process.env.NEXT_PUBLIC_API_URL}${customer.image_url}`} 
                      className="object-cover" 
                    />
                  )}
                  <AvatarFallback className="bg-slate-100 text-slate-400 text-4xl font-black">
                    {customer.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <button 
                  type="button" 
                  onClick={handleImageClick}
                  disabled={uploading}
                  className="absolute bottom-1 right-1 h-10 w-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:scale-110 transition-all cursor-pointer disabled:opacity-50 disabled:scale-100"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{formData.name || 'Your Name'}</h3>
              <p className="text-sm text-slate-500 font-medium mb-4">{formData.email}</p>
              
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  {formData.customer_type}
                </span>
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                  Member since 2024
                </span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-3xl p-8 shadow-xl shadow-indigo-100 text-white">
            <div className="flex items-center gap-3 mb-4">
               <ShieldCheck className="h-6 w-6 text-indigo-200" />
               <h4 className="font-bold">Security Tip</h4>
            </div>
            <p className="text-xs text-indigo-100 leading-relaxed font-medium">
              Ensure your account is secure by using a strong, unique password and updating it regularly. Never share your credentials with others.
            </p>
          </div>
        </div>

        {/* Right Column: Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <User className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative group">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                   <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Account Type</label>
                <div className="relative group">
                   <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                   <select
                    name="customer_type"
                    value={formData.customer_type}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="individual">Individual Account</option>
                    <option value="company">Company / Business Account</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors" />
                   <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed"
                    placeholder="Email cannot be changed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                <div className="relative group">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                   <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    placeholder="Your contact number"
                  />
                </div>
              </div>

              {formData.customer_type === 'company' && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Company Name</label>
                  <div className="relative group">
                     <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                     <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                      placeholder="Enter company name"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Shipping Address</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Street Address</label>
                <div className="relative group">
                   <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                   <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    placeholder="123 Street Name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">City</label>
                <div className="relative group">
                   <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                   <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    placeholder="New York"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">State / Province</label>
                <div className="relative group">
                   <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                   <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    placeholder="NY"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Country</label>
                <div className="relative group">
                   <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                   <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    placeholder="United States"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Postal Code</label>
                <div className="relative group">
                   <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                   <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Security & Password</h3>
            </div>

            <div className="space-y-6">
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                To update your password, please fill in the fields below. If you don't want to change your password, leave these fields empty.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Current Password</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
                    <input
                      type="password"
                      name="oldPassword"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">New Password</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="password"
                      name="newPassword"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-start">
                <Button 
                  type="button"
                  onClick={async () => {
                    const oldPass = (document.querySelector('input[name="oldPassword"]') as HTMLInputElement)?.value;
                    const newPass = (document.querySelector('input[name="newPassword"]') as HTMLInputElement)?.value;
                    
                    if (!oldPass || !newPass) {
                      toast.error('Please fill in both current and new password');
                      return;
                    }

                    try {
                      setLoading(true);
                      const response = await api.post('/customers/change-password', {
                        oldPassword: oldPass,
                        newPassword: newPass
                      });
                      
                      if (response.data.status) {
                        toast.success('Password changed successfully!');
                        (document.querySelector('input[name="oldPassword"]') as HTMLInputElement).value = '';
                        (document.querySelector('input[name="newPassword"]') as HTMLInputElement).value = '';
                      }
                    } catch (error: any) {
                      toast.error(error.response?.data?.message || 'Failed to change password');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-6 py-2 rounded-xl text-xs font-black text-white bg-slate-900 hover:bg-black transition-all uppercase tracking-widest cursor-pointer"
                >
                  Update Password
                </Button>
              </div>
            </div>
          </div>

          {/* Address Management Section */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <AddressList
              key={addressesKey}
              addresses={addresses}
              isLoading={loadingAddresses}
              onUpdate={() => setAddressesKey(prev => prev + 1)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4">

            <button
              type="button"
              className="px-8 py-3.5 rounded-2xl text-sm font-black text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all uppercase tracking-widest cursor-pointer"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-3.5 rounded-2xl text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 uppercase tracking-widest cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
