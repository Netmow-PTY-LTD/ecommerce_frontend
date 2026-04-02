'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/admin/admin-layout';
import { Plus, Search, Edit, Trash2, ExternalLink, FileText } from 'lucide-react';

interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  status: 'published' | 'draft';
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  total: number;
  page: string;
  limit: string;
  totalPage: number;
}

export default function AdminPagesPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [pages, setPages] = useState<Page[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: '1',
    limit: '10',
    totalPage: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingPages, setLoadingPages] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Common default pages suggestion
  const defaultPageSuggestions = [
    { title: 'About Us', slug: 'about-us', description: 'Information about your company' },
    { title: 'Contact Us', slug: 'contact', description: 'Contact form and information' },
    { title: 'Privacy Policy', slug: 'privacy-policy', description: 'Your privacy policy' },
    { title: 'Terms & Conditions', slug: 'terms-conditions', description: 'Terms and conditions of use' },
    { title: 'Shipping Policy', slug: 'shipping-policy', description: 'Shipping information and policies' },
    { title: 'Return & Refund Policy', slug: 'return-refund-policy', description: 'Return and refund policies' },
    { title: 'FAQ', slug: 'faq', description: 'Frequently asked questions' },
  ];

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPages();
    }
  }, [isAuthenticated, currentPage]);

  const fetchPages = async () => {
    try {
      setLoadingPages(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/pages?${params}`);
      const data = response.data;

      setPages(data.data || []);
      setPagination(data.pagination || { total: 0, page: '1', limit: '10', totalPage: 0 });
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch pages:', err);
      // If it's a 404, the endpoint might not exist yet - show helpful message
      if (err.response?.status === 404) {
        setError('Pages API endpoint not found. Please create the pages endpoint in your backend.');
      } else {
        setError(err.response?.data?.message || 'Failed to load pages');
      }
      setPages([]);
      setPagination({ total: 0, page: '1', limit: '10', totalPage: 0 });
    } finally {
      setLoadingPages(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPages();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      await api.delete(`/pages/${id}`);
      setSuccess('Page deleted successfully!');
      fetchPages();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete page');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading || loadingPages) {
    return (
      <AdminLayout title="Pages" subtitle="Manage your website pages">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout title="Pages" subtitle="Manage your website pages">
      <div className="space-y-6 py-4">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search pages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          <Button
            onClick={() => router.push('/admin/pages/create')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Page
          </Button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">Backend API Not Ready</p>
                <p className="text-sm mt-1">{error}</p>
                <p className="text-sm mt-2">You can still create pages using the form below. The pages will be saved once the backend API is available.</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Pages Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {pages.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No pages found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchTerm ? 'Try a different search term' : 'Get started by creating your first page'}
                </p>

                {/* Suggested default pages */}
                {!searchTerm && (
                  <div className="max-w-md mx-auto text-left">
                    <p className="text-xs font-medium text-gray-600 mb-3 text-center">Common pages you might need:</p>
                    <div className="grid grid-cols-1 gap-2 mb-4">
                      {defaultPageSuggestions.slice(0, 4).map((suggestion) => (
                        <button
                          key={suggestion.slug}
                          onClick={() => router.push(`/admin/pages/create?title=${encodeURIComponent(suggestion.title)}&slug=${suggestion.slug}`)}
                          className="text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{suggestion.title}</div>
                          <div className="text-xs text-gray-500">{suggestion.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => router.push('/admin/pages/create')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Page
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pages.map((page) => (
                        <TableRow key={page.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">{page.title}</div>
                              {page.meta_title && (
                                <div className="text-sm text-gray-500">{page.meta_title}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              /{page.slug}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={page.status === 'published' ? 'default' : 'secondary'}
                              className={
                                page.status === 'published'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                              }
                            >
                              {page.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {new Date(page.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(`/page/${page.slug}`, '_blank')}
                                title="View on website"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/admin/pages/${page.id}/edit`)}
                                title="Edit page"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(page.id)}
                                title="Delete page"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.totalPage > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      Showing {((parseInt(pagination.page) - 1) * parseInt(pagination.limit)) + 1} to{' '}
                      {Math.min(parseInt(pagination.page) * parseInt(pagination.limit), pagination.total)} of{' '}
                      {pagination.total} pages
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={parseInt(pagination.page) <= 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(parseInt(pagination.totalPage), p + 1))}
                        disabled={parseInt(pagination.page) >= parseInt(pagination.totalPage)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
