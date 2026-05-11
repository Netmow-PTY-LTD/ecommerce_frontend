'use client';

import { useState } from 'react';
import { Plus, Star, Check, X } from 'lucide-react';
import { AddressForm } from './address-form';

interface Address {
  id: number;
  label?: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  is_default: boolean;
}

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddress: Address | null;
  onSelectAddress: (address: Address | null) => void;
  mutateAddresses: () => void | Promise<void>;
  createAddress?: (data: any) => Promise<any>;
  onFormVisibilityChange?: (visible: boolean) => void;
}

export function AddressSelector({ addresses, selectedAddress, onSelectAddress, mutateAddresses, createAddress, onFormVisibilityChange }: AddressSelectorProps) {
  const [showForm, setShowForm] = useState(false);

  const handleSelectAddress = (address: Address) => {
    onSelectAddress(address);
  };

  const handleNewAddress = async () => {
    // This will be called after AddressForm successfully adds an address
    setShowForm(false);
    await mutateAddresses();
  };

  const toggleForm = () => {
    const newState = !showForm;
    setShowForm(newState);
    onFormVisibilityChange?.(newState);
  };

  return (
    <div className="space-y-3">
      {/* Quick Actions - Always Visible */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={toggleForm}
          className={`flex-1 px-4 py-2.5 border-2 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2
            ${showForm
              ? 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              : 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
            }`}
        >
          {showForm ? <><Check className="h-4 w-4" /> Done</> : <><Plus className="h-4 w-4" /> Add New Address</>}
        </button>
        {selectedAddress && (
          <button
            type="button"
            onClick={() => {
              onSelectAddress(null);
              setShowForm(false);
            }}
            className="px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1"
          >
            <X className="h-4 w-4" /> Clear
          </button>
        )}
      </div>

      {/* Inline Form - Compact for Checkout */}
      {showForm && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-sm">Add New Address</h4>
            <button type="button" onClick={toggleForm} className="text-slate-500 hover:text-slate-700">
              ✕
            </button>
          </div>
          <AddressForm onSuccess={handleNewAddress} onCancel={toggleForm} createAddress={createAddress} />
        </div>
      )}

      {/* Saved Addresses Grid */}
      {!showForm && addresses.length > 0 && (
        <>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Saved addresses:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {addresses.map((address) => (
              <button
                key={address.id}
                type="button"
                onClick={() => handleSelectAddress(address)}
                className={`text-left p-3 rounded-xl border-2 transition-all relative
                  ${selectedAddress?.id === address.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-sm'
                  }`}
              >
                {selectedAddress?.id === address.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                {address.is_default && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    <Star className="h-3 w-3" /> Default
                  </div>
                )}

                <div className="space-y-0.5 pr-6">
                  {address.label && (
                    <span className="inline-flex items-center gap-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-lg">
                      {address.label}
                    </span>
                  )}
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {address.first_name} {address.last_name}
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400">{address.phone}</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400">
                    {address.address}, {address.city}
                    {address.postal_code && ` - ${address.postal_code}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* No addresses message */}
      {!showForm && addresses.length === 0 && (
        <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-sm">
          No saved addresses yet. Click "Add New Address" above.
        </div>
      )}
    </div>
  );
}
