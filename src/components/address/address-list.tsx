'use client';

import { useState } from 'react';
import { MapPin, Plus, Pencil, Trash2, Star, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddressForm } from './address-form';
import { deleteAddress, setDefaultAddress, createAddress, updateAddress } from '@/hooks/use-addresses';
import { toast } from 'sonner';

interface AddressListProps {
  addresses: any[];
  isLoading: boolean;
  onUpdate: () => void;
}

export function AddressList({ addresses, isLoading, onUpdate }: AddressListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await deleteAddress(id);
      toast.success('Address deleted');
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultAddress(id);
      toast.success('Default address updated');
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to set default');
    }
  };

  if (showForm || editingAddress) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {editingAddress ? 'Edit Address' : 'Add New Address'}
        </h3>
        <AddressForm
          editingAddress={editingAddress}
          createAddress={createAddress}
          updateAddress={updateAddress}
          onSuccess={() => {
            setShowForm(false);
            setEditingAddress(null);
            onUpdate();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingAddress(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Saved Addresses ({addresses.length})
        </h3>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add New
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
          <MapPin className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400">No saved addresses yet.</p>
          <Button onClick={() => setShowForm(true)} className="mt-4 gap-2">
            <Plus className="h-4 w-4" /> Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="relative bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border-2 transition-all
                ${address.is_default ? 'border-indigo-500 dark:border-indigo-500' : 'border-slate-200 dark:border-slate-700'}
                hover:border-indigo-300 dark:hover:border-indigo-700"
            >
              {address.is_default && (
                <div className="absolute -top-2 -right-2 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3" /> Default
                </div>
              )}

              <div className="space-y-2">
                {address.label && (
                  <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold px-2 py-1 rounded-lg">
                    <MapPin className="h-3 w-3" /> {address.label}
                  </span>
                )}
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {address.first_name} {address.last_name}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{address.phone}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {address.address}
                  {address.apartment && `, ${address.apartment}`}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {address.city}
                  {address.state && `, ${address.state}`}
                  {address.postal_code && ` - ${address.postal_code}`}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500">{address.country}</p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingAddress(address)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </button>
                  {!address.is_default && (
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </button>
                  )}
                </div>
                {!address.is_default && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetDefault(address.id)}
                    className="text-xs"
                  >
                    Set Default
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
