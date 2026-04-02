'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AdminLayout from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Star, Trash2, Check, X, MessageSquare, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';

interface Review {
  id: number;
  product_id: number;
  customer_id: number;
  order_id?: number;
  rating: number;
  title?: string;
  body?: string;
  images?: string[];
  is_verified_purchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  admin_reply?: string;
  admin_reply_at?: string;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-4 w-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ))}
  </div>
);

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminReviewsPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPage: 0 });
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [replyModal, setReplyModal] = useState<{ open: boolean; reviewId: number | null; status: 'approved' | 'rejected'; reply: string }>({
    open: false, reviewId: null, status: 'approved', reply: '',
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) fetchReviews();
  }, [isAuthenticated, currentPage, filterStatus, filterRating]);

  const fetchReviews = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: currentPage.toString(), limit: '20' });
      if (filterStatus) params.append('status', filterStatus);
      if (filterRating) params.append('rating', filterRating);
      const response = await api.get(`/reviews?${params}`);
      setReviews(response.data.data || []);
      setPagination(response.data.pagination || { total: 0, page: 1, limit: 20, totalPage: 0 });
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError('Failed to load reviews');
    }
  }, [currentPage, filterStatus, filterRating]);

  const handleModerate = async (id: number, status: 'approved' | 'rejected', admin_reply?: string) => {
    try {
      const payload: any = { status };
      if (admin_reply) payload.admin_reply = admin_reply;
      await api.put(`/reviews/${id}/moderate`, payload);
      setSuccess(`Review ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      fetchReviews();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to moderate review');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      setSuccess('Review deleted successfully');
      fetchReviews();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete review');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openReplyModal = (reviewId: number, status: 'approved' | 'rejected') => {
    setReplyModal({ open: true, reviewId, status, reply: '' });
  };

  const submitReply = async () => {
    if (!replyModal.reviewId) return;
    await handleModerate(replyModal.reviewId, replyModal.status, replyModal.reply || undefined);
    setReplyModal({ open: false, reviewId: null, status: 'approved', reply: '' });
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
    <AdminLayout title="Reviews Management" subtitle="Moderate and manage product reviews">
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

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border rounded-lg bg-card text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filterRating}
            onChange={(e) => { setFilterRating(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border rounded-lg bg-card text-sm"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <span className="text-sm text-muted-foreground ml-auto">
            {pagination.total} review{pagination.total !== 1 ? 's' : ''} total
          </span>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No reviews found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-card border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <StarRating rating={review.rating} />
                      {review.title && (
                        <span className="font-medium text-foreground">{review.title}</span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[review.status]}`}>
                        {review.status}
                      </span>
                      {review.is_verified_purchase && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          Verified
                        </span>
                      )}
                    </div>

                    {review.body && (
                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{review.body}</p>
                    )}

                    {review.images && Array.isArray(review.images) && review.images.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {review.images.map((img: string, i: number) => (
                          <img key={i} src={img} alt={`Review image ${i + 1}`} className="h-16 w-16 rounded-lg object-cover border" />
                        ))}
                      </div>
                    )}

                    {review.admin_reply && (
                      <div className="mt-2 bg-primary/5 rounded-lg p-3 text-sm">
                        <span className="font-medium text-primary">Admin Reply:</span> {review.admin_reply}
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Product #{review.product_id}</span>
                      <span>Customer #{review.customer_id}</span>
                      {review.helpful_count > 0 && <span>{review.helpful_count} helpful</span>}
                      <span>{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {review.status === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleModerate(review.id, 'approved')}
                          className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Approve"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleModerate(review.id, 'rejected')}
                          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Reject"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openReplyModal(review.id, review.status === 'rejected' ? 'rejected' : 'approved')}
                      className="h-8 px-2"
                      title="Reply"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(review.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      title="Delete"
                    >
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
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: pagination.totalPage }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= pagination.totalPage}
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPage, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {replyModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold">
              {replyModal.status === 'approved' ? 'Approve & Reply' : 'Reject & Reply'}
            </h3>
            <textarea
              value={replyModal.reply}
              onChange={(e) => setReplyModal({ ...replyModal, reply: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg bg-background text-sm"
              placeholder="Write an optional admin reply..."
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setReplyModal({ open: false, reviewId: null, status: 'approved', reply: '' })}>
                Cancel
              </Button>
              <Button onClick={submitReply}>
                {replyModal.status === 'approved' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
