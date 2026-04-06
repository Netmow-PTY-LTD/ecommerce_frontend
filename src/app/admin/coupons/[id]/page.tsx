'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import AdminLayout from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Tag, Plus, X, Search, Package } from 'lucide-react';

const emptyForm = {
  code: '',
  description: '',
  type: 'percentage' as const,
  value: '',
  min_order_amount: '',
  max_discount_amount: '',
  usage_limit: '',
  per_customer_limit: '1',
  starts_at: '',
  expires_at: '',
  is_active: true,
  applicable_products: [] as number[],
};

export default function CouponFormPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const couponId = params.id === 'new' ? null : (params.id as string);
  const isEditing = !!couponId;

  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingCoupon, setLoadingCoupon] = useState(isEditing);

  // Product selector state
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/admin/login');
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated && couponId) fetchCoupon();
    else setLoadingCoupon(false);
  }, [isAuthenticated, couponId]);

  const fetchCoupon = async () => {
    try {
      setLoadingCoupon(true);
      const res = await api.get(`/pricing/coupons/${couponId}`);
      const coupon = res.data.data;
      setFormData({
        code: coupon.code,
        description: coupon.description || '',
        type: coupon.type,
        value: String(coupon.value),
        min_order_amount: String(coupon.min_order_amount || ''),
        max_discount_amount: String(coupon.max_discount_amount || ''),
        usage_limit: String(coupon.usage_limit || ''),
        per_customer_limit: String(coupon.per_customer_limit || 1),
        starts_at: coupon.starts_at ? coupon.starts_at.slice(0, 16) : '',
        expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : '',
        is_active: coupon.is_active,
        applicable_products: Array.isArray(coupon.applicable_products)
          ? coupon.applicable_products
          : (typeof coupon.applicable_products === 'string' ? JSON.parse(coupon.applicable_products) : []),
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load coupon');
    } finally {
      setLoadingCoupon(false);
    }
  };

  // Load product details for pre-selected products (editing mode)
  useEffect(() => {
    if (formData.applicable_products.length > 0 && selectedProducts.length === 0) {
      fetchProductDetails(formData.applicable_products);
    }
  }, [formData.applicable_products]);

  const fetchProductDetails = async (ids: number[]) => {
    try {
      const res = await api.get(`/products?limit=100`);
      const allProducts = res.data.data || [];
      const matched = allProducts.filter((p: any) => ids.includes(p.id));
      setSelectedProducts(matched);
    } catch {}
  };

  const searchProducts = async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get(`/products?search=${encodeURIComponent(query)}&limit=20`);
      setSearchResults(res.data.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addProduct = (product: any) => {
    if (formData.applicable_products.includes(product.id)) return;
    const newIds = [...formData.applicable_products, product.id];
    setFormData({ ...formData, applicable_products: newIds });
    setSelectedProducts([...selectedProducts, product]);
    setProductSearch('');
    setSearchResults([]);
  };

  const removeProduct = (productId: number) => {
    setFormData({ ...formData, applicable_products: formData.applicable_products.filter(id => id !== productId) });
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload: any = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: formData.type === 'bogo' ? 0 : parseFloat(formData.value),
        is_active: formData.is_active,
        per_customer_limit: parseInt(formData.per_customer_limit) || 1,
      };
      if (formData.type === 'bogo' && formData.applicable_products.length > 0) {
        payload.applicable_products = formData.applicable_products;
      }
      if (formData.description) payload.description = formData.description;
      if (formData.min_order_amount) payload.min_order_amount = parseFloat(formData.min_order_amount);
      if (formData.max_discount_amount) payload.max_discount_amount = parseFloat(formData.max_discount_amount);
      if (formData.usage_limit) payload.usage_limit = parseInt(formData.usage_limit);
      if (formData.starts_at) payload.starts_at = formData.starts_at;
      if (formData.expires_at) payload.expires_at = formData.expires_at;

      if (isEditing) {
        await api.put(`/pricing/coupons/${couponId}`, payload);
        setSuccess('Coupon updated successfully');
      } else {
        await api.post('/pricing/coupons', payload);
        setSuccess('Coupon created successfully');
      }

      setTimeout(() => router.push('/admin/coupons'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingCoupon) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <AdminLayout
      title={isEditing ? 'Edit Coupon' : 'Create Coupon'}
      subtitle={isEditing ? `Editing coupon ${formData.code}` : 'Create a new discount coupon'}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/admin/coupons')}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Coupons
        </button>

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-card border rounded-xl shadow-sm">
          <div className="p-6 border-b flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Tag className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{isEditing ? 'Edit Coupon' : 'New Coupon'}</h2>
              <p className="text-sm text-muted-foreground">Fill in the details below</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">Coupon Code *</Label>
              <Input
                id="code"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., SUMMER20"
                className="font-mono uppercase"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Brief description of this coupon..."
              />
            </div>

            {/* Type + Value */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Discount Type *</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                  <option value="free_shipping">Free Shipping</option>
                  <option value="bogo">Buy 1 Get 1 Free (BOGO)</option>
                </select>
              </div>

              {formData.type !== 'free_shipping' && formData.type !== 'bogo' && (
                <div className="space-y-2">
                  <Label htmlFor="value">
                    Value * {formData.type === 'percentage' ? '(%)' : '($)'}
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    required
                    min="0"
                    step={formData.type === 'percentage' ? '1' : '0.01'}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder={formData.type === 'percentage' ? '20' : '10.00'}
                  />
                </div>
              )}
            </div>

            {/* Min Order + Max Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_order_amount">Min Order ($)</Label>
                <Input
                  id="min_order_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                  placeholder="0"
                />
              </div>
              {formData.type === 'percentage' && (
                <div className="space-y-2">
                  <Label htmlFor="max_discount_amount">Max Discount ($)</Label>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                    placeholder="No limit"
                  />
                </div>
              )}
            </div>

            {/* BOGO - Applicable Products */}
            {formData.type === 'bogo' && (
              <div className="space-y-3">
                <Label>Applicable Products</Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  Select products eligible for this BOGO deal. Customers must buy 2+ of these to get the cheapest free.
                </p>

                {/* Selected product tags */}
                {selectedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedProducts.map(product => (
                      <span
                        key={product.id}
                        className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-sm pl-3 pr-1.5 py-1.5 rounded-lg border border-primary/20"
                      >
                        <Package className="h-3.5 w-3.5" />
                        {product.name}
                        <button
                          type="button"
                          onClick={() => removeProduct(product.id)}
                          className="ml-1 p-0.5 hover:bg-primary/20 rounded"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search products to add..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      searchProducts(e.target.value);
                    }}
                    onFocus={() => {
                      if (productSearch.length >= 2) searchProducts(productSearch);
                    }}
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Search results dropdown */}
                {searchResults.length > 0 && (
                  <div className="border rounded-lg max-h-60 overflow-y-auto bg-card shadow-lg">
                    {searchResults
                      .filter(p => !formData.applicable_products.includes(p.id))
                      .map(product => (
                        <button
                          key={product.id}
                          type="button"
                          className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center justify-between transition-colors"
                          onClick={() => addProduct(product)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                              {product.thumb_url || product.image_url ? (
                                <img
                                  src={product.thumb_url || product.image_url}
                                  alt=""
                                  className="w-10 h-10 object-cover rounded-md"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                ID: {product.id} · ${product.price || product.selling_price}
                              </p>
                            </div>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                  </div>
                )}

                {formData.applicable_products.length === 0 && (
                  <p className="text-xs text-amber-600 font-medium">No products selected. Add at least 2 products for BOGO to work.</p>
                )}
              </div>
            )}

            {/* Usage + Per Customer */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usage_limit">Usage Limit</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  min="0"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  placeholder="Unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="per_customer_limit">Per Customer Limit</Label>
                <Input
                  id="per_customer_limit"
                  type="number"
                  min="1"
                  value={formData.per_customer_limit}
                  onChange={(e) => setFormData({ ...formData, per_customer_limit: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starts_at">Starts At</Label>
                <Input
                  id="starts_at"
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires_at">Expires At</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>
            </div>

            {/* Active */}
            <div className="flex items-center gap-3">
              <input
                id="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-primary border-border rounded"
              />
              <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" disabled={submitting} className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Coupon' : 'Create Coupon'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/admin/coupons')}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
