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
import { Plus, Search, Edit, Trash2, Layers } from 'lucide-react';

interface Section {
  id: number;
  title: string;
  slug: string;
  type: string;
  content: string;
  status: 'active' | 'inactive';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  total: number;
  page: string;
  limit: string;
  totalPage: number;
}

const typeColors: Record<string, string> = {
  banner: 'bg-blue-100 text-blue-700',
  featured: 'bg-purple-100 text-purple-700',
  promo: 'bg-orange-100 text-orange-700',
  gallery: 'bg-pink-100 text-pink-700',
  custom: 'bg-gray-100 text-gray-700',
};

export default function AdminSectionsPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [sections, setSections] = useState<Section[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: '1',
    limit: '10',
    totalPage: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingSections, setLoadingSections] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSections();
    }
  }, [isAuthenticated, currentPage]);

  const fetchSections = async () => {
    try {
      setLoadingSections(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/sections?${params}`);
      const data = response.data;

      setSections(data.data || []);
      setPagination(data.pagination || { total: 0, page: '1', limit: '10', totalPage: 0 });
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch sections:', err);
      if (err.response?.status === 404) {
        setError('Sections API endpoint not found. Please create the sections endpoint in your backend.');
      } else {
        setError(err.response?.data?.message || 'Failed to load sections');
      }
      setSections([]);
      setPagination({ total: 0, page: '1', limit: '10', totalPage: 0 });
    } finally {
      setLoadingSections(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSections();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      await api.delete(`/sections/${id}`);
      setSuccess('Section deleted successfully!');
      fetchSections();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete section');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading || loadingSections) {
    return (
      <AdminLayout title="Sections" subtitle="Manage homepage sections">
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
    <AdminLayout title="Sections" subtitle="Manage homepage sections">
      <div className="space-y-6 py-4">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          <Button
            onClick={() => router.push('/admin/sections/create')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Section
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
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Sections Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Sections</CardTitle>
          </CardHeader>
          <CardContent>
            {sections.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <Layers className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No sections found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchTerm ? 'Try a different search term' : 'Get started by creating your first section'}
                </p>
                <Button
                  onClick={() => router.push('/admin/sections/create')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Section
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
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sections.map((section) => (
                        <TableRow key={section.id}>
                          <TableCell>
                            <div className="font-medium text-gray-900">{section.title}</div>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {section.slug}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={typeColors[section.type] || typeColors.custom}
                            >
                              {section.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={section.status === 'active' ? 'default' : 'secondary'}
                              className={
                                section.status === 'active'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                              }
                            >
                              {section.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{section.sort_order}</span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {new Date(section.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/admin/sections/${section.id}/edit`)}
                                title="Edit section"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(section.id)}
                                title="Delete section"
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
                      {pagination.total} sections
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
                        onClick={() => setCurrentPage((p) => Math.min(Number(pagination.totalPage), p + 1))}
                        disabled={parseInt(pagination.page) >= pagination.totalPage}
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
