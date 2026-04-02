'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Tag } from 'lucide-react';
import { validateCoupon } from '@/hooks/use-pricing';

interface CouponInputProps {
  cartTotal: number;
  customerId?: number;
  cartItems?: { product_id: number; quantity: number; unit_price: number }[];
  onApply: (discount: number, coupon: any) => void;
  onRemove: () => void;
  appliedCoupon: any;
}

export function CouponInput({ cartTotal, customerId, cartItems, onApply, onRemove, appliedCoupon }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async () => {
    setLoading(true); setError('');
    try {
      const res = await validateCoupon(code.toUpperCase(), cartTotal, customerId, cartItems);
      if (res.data?.valid) {
        onApply(res.data.discountAmount, res.data.coupon);
        setCode('');
      } else {
        setError(res.message || 'Invalid coupon');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to validate coupon');
    } finally { setLoading(false); }
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        <Tag className="text-green-600" size={16} />
        <span className="text-sm text-green-700 font-medium">{appliedCoupon.code}</span>
        <span className="text-sm text-green-600">applied!</span>
        <button onClick={onRemove} className="ml-auto"><X size={14} className="text-green-600" /></button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input placeholder="Coupon code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} className="uppercase" />
        <Button variant="outline" onClick={handleApply} disabled={!code || loading}>{loading ? '...' : 'Apply'}</Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
