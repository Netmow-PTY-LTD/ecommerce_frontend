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
  visibility: 'private' | 'public' | 'restricted';
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
  const [fetchingCoupons, setFetchingCoupons] = useState(true);

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
      setFetchingCoupons(true);
      const response = await api.get(`/pricing/coupons?page=${currentPage}&limit=20`);
      setCoupons(response.data.data || []);
      setPagination(response.data.pagination || { total: 0, page: 1, limit: 20, totalPage: 0 });
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
      setError('Failed to load coupons');
    } finally {
      setFetchingCoupons(false);
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

  const CouponSkeleton = () => (
    <div className="bg-white border rounded-2xl p-4 shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-24 bg-muted rounded"></div>
            <div className="h-5 w-20 bg-muted rounded-full"></div>
            <div className="h-5 w-16 bg-muted rounded-full"></div>
          </div>
          <div className="h-4 w-3/4 bg-muted/60 rounded"></div>
          <div className="flex gap-4">
            <div className="h-4 w-12 bg-muted/80 rounded"></div>
            <div className="h-4 w-20 bg-muted/40 rounded"></div>
            <div className="h-4 w-20 bg-muted/40 rounded"></div>
          </div>
        </div>
        <div className="flex gap-1">
          <div className="h-8 w-8 bg-muted rounded"></div>
          <div className="h-8 w-8 bg-muted rounded"></div>
        </div>
      </div>
    </div>
  );

  if (!loading && !isAuthenticated) return null;

  return (
    <AdminLayout>
      <div className="w-full max-w-5xl mx-auto py-4">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Coupons Management</h1>
            <p className="text-slate-500 text-sm">Manage discount codes and promotions</p>
          </div>
          <Button
            onClick={() => router.push('/admin/coupons/new')}
            className="gap-2 bg-brand text-white border-none rounded-xl px-6 py-2.5 font-semibold shadow-lg hover:bg-brand/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Coupon
          </Button>
        </div>

        {success && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl shadow-sm flex items-center">
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 101.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm flex items-center">
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Coupons ({pagination.total})</h2>
        </div>

        {fetchingCoupons ? (
          <div className="grid gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <CouponSkeleton key={i} />
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No coupons found. Create your first coupon to get started.</p>
            <Button onClick={() => router.push('/admin/coupons/new')} className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Create Coupon
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="bg-white border rounded-2xl p-4 shadow-none hover:border-slate-300 transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="px-2 py-1 bg-muted rounded text-sm font-mono font-bold">{coupon.code}</code>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge[coupon.type]}`}>
                        {coupon.type === 'free_shipping' ? 'Free Shipping' : coupon.type === 'bogo' ? 'BOGO' : coupon.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isActive(coupon)
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : coupon.status === 'inactive'
                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {isActive(coupon) ? 'Active' : isExpired(coupon) ? 'Expired' : 'Inactive'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        coupon.visibility === 'public'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                          : coupon.visibility === 'restricted'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {coupon.visibility === 'public' ? '🌐 Public' : coupon.visibility === 'restricted' ? '🔒 Restricted' : '🔒 Private'}
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
