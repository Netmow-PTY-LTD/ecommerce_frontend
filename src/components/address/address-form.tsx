'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddressFormProps {
  onSuccess?: () => void;
  editingAddress?: any;
  onCancel?: () => void;
  createAddress?: (data: any) => Promise<any>;
  updateAddress?: (id: number, data: any) => Promise<any>;
}

export function AddressForm({ onSuccess, editingAddress, onCancel, createAddress, updateAddress }: AddressFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    label: editingAddress?.label || '',
    first_name: editingAddress?.first_name || '',
    last_name: editingAddress?.last_name || '',
    phone: editingAddress?.phone || '',
    address: editingAddress?.address || '',
    apartment: editingAddress?.apartment || '',
    city: editingAddress?.city || '',
    state: editingAddress?.state || '',
    postal_code: editingAddress?.postal_code || '',
    country: editingAddress?.country || 'United States',
    is_default: editingAddress?.is_default || false
  });

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (editingAddress && updateAddress) {
      const result=  await updateAddress(editingAddress.id, formData);
      if(result.status){

        toast.success('Address updated successfully');
      }
      } else if (createAddress) {
       const result= await createAddress(formData);
          if(result.status){

       
            toast.success('Address added successfully');
      }
      }
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">First Name *</label>
          <Input
            required
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            placeholder="John"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last Name *</label>
          <Input
            required
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            placeholder="Doe"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone *</label>
        <Input
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+880 1XXX-XXXXXX"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address Label</label>
        <Input
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="Home, Office, etc."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Street Address *</label>
        <Input
          required
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="House no, Street name, Area"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Apartment/Suite (optional)</label>
        <Input
          value={formData.apartment}
          onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
          placeholder="Flat, Floor, Building"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">City *</label>
          <Input
            required
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Dhaka"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">State/Region</label>
          <Input
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder="Division"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Postal Code</label>
        <Input
          value={formData.postal_code}
          onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
          placeholder="1000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Country *</label>
        <Input
          required
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_default"
          checked={formData.is_default}
          onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
          className="w-4 h-4"
        />
        <label htmlFor="is_default" className="text-sm cursor-pointer">
          Set as default address
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" onClick={handleSubmit} disabled={loading} className="gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {editingAddress ? 'Update Address' : 'Add Address'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
