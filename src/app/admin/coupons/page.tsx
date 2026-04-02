'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AdminLayout from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tag, Plus, Edit, Trash2, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Coupon {
  id: number;
  code: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'bogo';
  value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_count: number;
  per_customer_limit: number;
  starts_at?: string;
  expires_at?: string;
  is_active: boolean;
  applicable_products?: number[];
  applicable_categories?: number[];
  created_at: string;
  updated_at: string;
}

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
  applicable_products: '',
};

export default function AdminCouponsPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPage: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/admin/login');
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) fetchCoupons();
  }, [isAuthenticated, currentPage]);

  const fetchCoupons = useCallback(async () => {
    try {
      const response = await api.get(`/pricing/coupons?page=${currentPage}&limit=20`);
      setCoupons(response.data.data || []);
      setPagination(response.data.pagination || { total: 0, page: 1, limit: 20, totalPage: 0 });
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
      setError('Failed to load coupons');
    }
  }, [currentPage]);

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
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
      applicable_products: coupon.applicable_products?.join(', ') || '',
    });
    setModalError('');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await api.delete(`/pricing/coupons/${id}`);
      setSuccess('Coupon deleted successfully');
      fetchCoupons();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete coupon');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');

    try {
      const payload: any = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: formData.type === 'bogo' ? 0 : parseFloat(formData.value),
        is_active: formData.is_active,
        per_customer_limit: parseInt(formData.per_customer_limit) || 1,
      };
      if (formData.type === 'bogo' && formData.applicable_products) {
        payload.applicable_products = formData.applicable_products
          .split(',')
          .map((id: string) => parseInt(id.trim()))
          .filter((id: number) => !isNaN(id));
      }
      if (formData.description) payload.description = formData.description;
      if (formData.min_order_amount) payload.min_order_amount = parseFloat(formData.min_order_amount);
      if (formData.max_discount_amount) payload.max_discount_amount = parseFloat(formData.max_discount_amount);
      if (formData.usage_limit) payload.usage_limit = parseInt(formData.usage_limit);
      if (formData.starts_at) payload.starts_at = formData.starts_at;
      if (formData.expires_at) payload.expires_at = formData.expires_at;

      if (editingCoupon) {
        await api.put(`/pricing/coupons/${editingCoupon.id}`, payload);
        setSuccess('Coupon updated successfully');
      } else {
        await api.post('/pricing/coupons', payload);
        setSuccess('Coupon created successfully');
      }

      setShowModal(false);
      setEditingCoupon(null);
      setFormData(emptyForm);
      fetchCoupons();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
    setFormData(emptyForm);
    setModalError('');
  };

  const isExpired = (coupon: Coupon) => coupon.expires_at && new Date(coupon.expires_at) < new Date();
  const isActive = (coupon: Coupon) => coupon.is_active && !isExpired(coupon);

  const valueLabel = (coupon: Coupon) => {
    if (coupon.type === 'percentage') return `${coupon.value}%`;
    if (coupon.type === 'fixed') return `$${coupon.value}`;
    if (coupon.type === 'bogo') return 'Buy 1 Get 1 Free';
    return 'Free Shipping';
  };

  const typeBadge: Record<string, string> = {
    percentage: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    fixed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    free_shipping: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
    bogo: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <AdminLayout title="Coupons Management" subtitle="Create and manage discount coupons">
      <div className="space-y-6">
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">Coupons ({pagination.total})</h2>
          <Button onClick={() => { setEditingCoupon(null); setFormData(emptyForm); setModalError(''); setShowModal(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Coupon
          </Button>
        </div>

        {coupons.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No coupons found. Create your first coupon to get started.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="bg-card border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="px-2 py-1 bg-muted rounded text-sm font-mono font-bold">{coupon.code}</code>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge[coupon.type]}`}>
                        {coupon.type === 'free_shipping' ? 'Free Shipping' : coupon.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isActive(coupon)
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {isActive(coupon) ? 'Active' : isExpired(coupon) ? 'Expired' : 'Inactive'}
                      </span>
                    </div>

                    {coupon.description && (
                      <p className="text-sm text-muted-foreground mt-1">{coupon.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="font-semibold text-foreground text-sm">{valueLabel(coupon)}</span>
                      {coupon.min_order_amount > 0 && <span>Min: ${coupon.min_order_amount}</span>}
                      {coupon.max_discount_amount > 0 && <span>Max discount: ${coupon.max_discount_amount}</span>}
                      <span>Used: {coupon.usage_count}{coupon.usage_limit ? `/${coupon.usage_limit}` : ''}</span>
                      <span>Per customer: {coupon.per_customer_limit}</span>
                      {coupon.starts_at && <span>Starts: {new Date(coupon.starts_at).toLocaleDateString()}</span>}
                      {coupon.expires_at && <span>Expires: {new Date(coupon.expires_at).toLocaleDateString()}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(coupon)} className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(coupon.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPage > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: pagination.totalPage }, (_, i) => i + 1).map((page) => (
              <Button key={page} variant={page === currentPage ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(page)}>
                {page}
              </Button>
            ))}
            <Button variant="outline" size="sm" disabled={currentPage >= pagination.totalPage} onClick={() => setCurrentPage((p) => Math.min(pagination.totalPage, p + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-muted rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                  {modalError}
                </div>
              )}

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

              {formData.type === 'bogo' && (
                <div className="space-y-2">
                  <Label htmlFor="applicable_products">Applicable Product IDs</Label>
                  <Input
                    id="applicable_products"
                    value={formData.applicable_products}
                    onChange={(e) => setFormData({ ...formData, applicable_products: e.target.value })}
                    placeholder="e.g., 1, 5, 12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated product IDs. Customers must buy 2+ of these products to get the cheapest one free.
                  </p>
                </div>
              )}

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

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting} className="gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
