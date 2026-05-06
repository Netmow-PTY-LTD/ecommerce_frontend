'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AdminLayout from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Tag, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

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
  status: 'active' | 'inactive';
  applicable_products?: number[];
  applicable_categories?: number[];
  created_at: string;
  updated_at: string;
}

export default function AdminCouponsPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPage: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/admin/login');
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) fetchCoupons();
  }, [isAuthenticated, currentPage]);

  // Show success message from creation/edit page
  useEffect(() => {
    const msg = sessionStorage.getItem('couponSuccess');
    if (msg) {
      setSuccess(msg);
      sessionStorage.removeItem('couponSuccess');
      setTimeout(() => setSuccess(''), 3000);
    }
  }, []);

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

  const isExpired = (coupon: Coupon) => coupon.expires_at && new Date(coupon.expires_at) < new Date();
  const isActive = (coupon: Coupon) => coupon.status === 'active' && !isExpired(coupon);

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
          <Button onClick={() => router.push('/admin/coupons/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Coupon
          </Button>
        </div>

        {coupons.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No coupons found. Create your first coupon to get started.</p>
            <Button onClick={() => router.push('/admin/coupons/new')} className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Create Coupon
            </Button>
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
                        {coupon.type === 'free_shipping' ? 'Free Shipping' : coupon.type === 'bogo' ? 'BOGO' : coupon.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isActive(coupon)
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : coupon.status === 'inactive'
                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
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
                      {coupon.max_discount_amount && coupon.max_discount_amount > 0 && <span>Max discount: ${coupon.max_discount_amount}</span>}
                      <span>Used: {coupon.usage_count}{coupon.usage_limit ? `/${coupon.usage_limit}` : ''}</span>
                      <span>Per customer: {coupon.per_customer_limit}</span>
                      {coupon.starts_at && <span>Starts: {new Date(coupon.starts_at).toLocaleDateString()}</span>}
                      {coupon.expires_at && <span>Expires: {new Date(coupon.expires_at).toLocaleDateString()}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/coupons/${coupon.id}`)} className="h-8 w-8 p-0">
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
    </AdminLayout>
  );
}
