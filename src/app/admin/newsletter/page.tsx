'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/admin-layout';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { toast } from 'sonner';
import {
  Mail,
  Users,
  CheckCircle2,
  XCircle,
  Trash2,
  Power,
  PowerOff,
  Search,
  RefreshCw,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';

interface NewsletterSubscriber {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface NewsletterStats {
  total: number;
  active: number;
  inactive: number;
  todayCount: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminNewsletterPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [stats, setStats] = useState<NewsletterStats>({
    total: 0,
    active: 0,
    inactive: 0,
    todayCount: 0
  });
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [deleteModal, setDeleteModal] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setColumnVisibility({
        email: true,
        status: width >= 768,
        created_at: width >= 1024,
        actions: width >= 500
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (appliedSearch) params.append('search', appliedSearch);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await api.get(`/newsletter/admin/subscribers?${params}`);
      const data = response.data.data;

      setSubscribers(data.subscribers || []);
      setPagination({
        total: data.total || 0,
        page: data.page || currentPage,
        limit: data.limit || 10,
        totalPages: data.totalPages || 0
      });
    } catch (error: any) {
      console.error('Failed to fetch subscribers:', error);
      toast.error('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/newsletter/admin/stats');
      setStats(response.data.data || {
        total: 0,
        active: 0,
        inactive: 0,
        todayCount: 0
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscribers();
      fetchStats();
    }
  }, [isAuthenticated, currentPage, statusFilter, appliedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setAppliedSearch(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setAppliedSearch('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const handleDelete = (id: number) => {
    setSubscriberToDelete(id);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!subscriberToDelete) return;
    try {
      setDeleting(true);
      await api.delete(`/newsletter/admin/subscribers/${subscriberToDelete}`);
      toast.success('Subscriber deleted successfully');
      fetchSubscribers();
      fetchStats();
      setDeleteModal(false);
      setSubscriberToDelete(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete subscriber');
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (subscriber: NewsletterSubscriber) => {
    try {
      await api.patch(`/newsletter/admin/subscribers/${subscriber.id}/toggle-status`);
      toast.success(`Subscriber ${subscriber.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchSubscribers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const filteredSubscribers = subscribers.filter(sub => {
    const matchSearch = !appliedSearch || sub.email.toLowerCase().includes(appliedSearch.toLowerCase());
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && sub.is_active) ||
      (statusFilter === 'inactive' && !sub.is_active);
    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-5 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Newsletter Subscribers</h1>
            <p className="text-slate-500 mt-1 text-sm">Manage your newsletter subscribers and send marketing campaigns.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-gradient-to-br from-brand to-brand/90 text-white p-4 transition-all hover:scale-[1.02] cursor-default">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Total Subscribers</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-4 transition-all hover:scale-[1.02] cursor-default">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Active Subscribers</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.active}</h3>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-rose-500 to-rose-600 text-white p-4 transition-all hover:scale-[1.02] cursor-default">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-rose-100 text-sm font-medium">Inactive</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.inactive}</h3>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <XCircle className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500 to-amber-600 text-white p-4 transition-all hover:scale-[1.02] cursor-default">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">New Today</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.todayCount}</h3>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 bg-white border-b border-slate-100">
            <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by email..."
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full sm:w-[180px] h-11 bg-slate-50 border-slate-200"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button type="submit" className="flex-1 sm:flex-none h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white transition-all">
                  Filter
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-4 border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={handleClearSearch}
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-4 border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={() => {
                    fetchSubscribers();
                    fetchStats();
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Subscribers Table */}
        <Card className="border-none shadow-sm overflow-hidden p-0 sm:p-4 md:p-6">
          <DataTable<NewsletterSubscriber>
            data={filteredSubscribers}
            columns={[
              {
                key: 'email',
                title: 'Email',
                render: (email): React.ReactNode => (
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                      <Mail className="w-5 h-5 text-brand" />
                    </div>
                    <span className="font-medium text-sm text-slate-900 truncate">{email}</span>
                  </div>
                )
              },
              {
                key: 'is_active',
                title: 'Status',
                render: (isActive): React.ReactNode => (
                  <Badge className={`${isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                    } shadow-none border px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase tracking-wider`} variant="outline">
                    {isActive ? 'Active' : 'Inactive'}
                  </Badge>
                )
              },
              {
                key: 'created_at',
                title: 'Subscribed',
                render: (date): React.ReactNode => (
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span>{new Date(date).toLocaleDateString()}</span>
                  </div>
                )
              },
              {
                key: 'actions',
                title: 'Actions',
                className: 'text-right',
                headerClassName: 'text-right',
                render: (_, subscriber): React.ReactNode => (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 w-8 p-0 transition-colors ${
                        subscriber.is_active
                          ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                          : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      onClick={() => toggleStatus(subscriber)}
                      title={subscriber.is_active ? 'Deactivate Subscriber' : 'Activate Subscriber'}
                    >
                      {subscriber.is_active ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(subscriber.id)}
                      title="Delete Subscriber"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              }
            ]}
            searchable={false}
            serverPagination
            paginationMeta={{
              total: filteredSubscribers.length,
              page: currentPage,
              limit: 10,
              totalPage: Math.ceil(filteredSubscribers.length / 10)
            }}
            onPageChange={(page) => setCurrentPage(page)}
            loading={loading}
            emptyMessage="No subscribers found."
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        </Card>
      </div>

      <ConfirmationModal
        isOpen={deleteModal}
        onClose={() => {
          setDeleteModal(false);
          setSubscriberToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Subscriber?"
        description="Are you sure you want to delete this subscriber? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleting}
        variant="danger"
      />
    </AdminLayout>
  );
}
