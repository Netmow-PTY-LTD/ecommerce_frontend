'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/admin-layout';
import { toast } from 'sonner';
import {
  Mail,
  Search,
  RefreshCw,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Calendar,
} from 'lucide-react';

interface EmailTemplate {
  id: number;
  name: string;
  slug: string;
}

interface EmailLog {
  id: number;
  template_id: number;
  template?: EmailTemplate;
  recipient: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export default function EmailLogsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPage: 0 });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/admin/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) fetchLogs();
  }, [isAuthenticated, currentPage, statusFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const statusParam = statusFilter ? `&status=${statusFilter}` : '';
      const res = await api.get(`/email/logs?page=${currentPage}&limit=20${statusParam}`);
      setLogs(res.data.data?.rows || res.data.data || []);
      setPagination(res.data.data?.pagination || { total: 0, page: 1, limit: 20, totalPage: 0 });
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      toast.error('Failed to load email logs');
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter((log) => {
    const matchSearch =
      !searchTerm ||
      log.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.template?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || log.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: EmailLog['status']) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
            <CheckCircle2 size={12} /> Sent
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
            <XCircle size={12} /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const sentCount = logs.filter((l) => l.status === 'sent').length;
  const failedCount = logs.filter((l) => l.status === 'failed').length;
  const pendingCount = logs.filter((l) => l.status === 'pending').length;

  return (
    <AdminLayout title="Email Logs" subtitle="View history of all sent and queued emails">
      <div className="w-full">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Emails</p>
                <p className="text-2xl font-bold text-slate-900">{pagination.total}</p>
              </div>
              <div className="bg-blue-600 p-3 rounded-xl text-white"><Mail size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Sent</p>
                <p className="text-2xl font-bold text-green-600">{sentCount}</p>
              </div>
              <div className="bg-green-600 p-3 rounded-xl text-white"><CheckCircle2 size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{failedCount}</p>
              </div>
              <div className="bg-red-600 p-3 rounded-xl text-white"><XCircle size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              </div>
              <div className="bg-amber-600 p-3 rounded-xl text-white"><Clock size={20} /></div>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Email Logs</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by recipient, subject..."
                    className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
                <button
                  onClick={fetchLogs}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                  title="Refresh"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Template</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Recipient</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Sent At</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <Mail size={40} className="mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">{searchTerm || statusFilter ? 'No matching logs' : 'No email logs yet'}</p>
                      <p className="text-sm">{searchTerm || statusFilter ? 'Try adjusting your filters' : 'Email logs will appear here as emails are sent'}</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        {log.template ? (
                          <div>
                            <p className="text-sm font-medium text-slate-900">{log.template.name}</p>
                            <code className="text-xs text-slate-500">{log.template.slug}</code>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">No template</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`mailto:${log.recipient}`}
                          className="text-sm text-slate-700 hover:text-indigo-600 flex items-center gap-1"
                        >
                          {log.recipient}
                          <ExternalLink size={12} className="text-slate-400" />
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 max-w-xs truncate" title={log.subject}>
                          {log.subject}
                        </p>
                        {log.error_message && (
                          <p className="text-xs text-red-600 mt-1 truncate" title={log.error_message}>
                            {log.error_message}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(log.status)}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{formatDate(log.sent_at)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">{formatDate(log.created_at)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalPage > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(pagination.totalPage, 5) }, (_, i) => {
              let pageNum;
              if (pagination.totalPage <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= pagination.totalPage - 2) {
                pageNum = pagination.totalPage - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`min-w-[2.5rem] px-3 py-2 text-sm rounded-lg border ${
                    pageNum === currentPage
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPage, p + 1))}
              disabled={currentPage >= pagination.totalPage}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
