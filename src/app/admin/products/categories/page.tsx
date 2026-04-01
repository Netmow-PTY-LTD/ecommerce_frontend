'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProductsNavbar from '@/components/admin/products-navbar';
import AdminLayout from '@/components/admin/admin-layout';
import { FormModal } from '@/components/admin/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Edit, Trash2, Plus } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export default function AdminCategoriesPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalError, setModalError] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  }>({
    total: 0,
    page: 1,
    limit: 10,
    totalPage: 0,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated, currentPage]);

  const fetchCategories = useCallback(async (page: number = currentPage) => {
    try {
      const response = await api.get(`/products/categories?page=${page}&limit=10`);
      setCategories(response.data.data || []);
      setPaginationMeta(response.data.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        totalPage: 0,
      });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setModalError('');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await api.delete(`/products/categories/${id}`);
      setSuccess('Category deleted successfully');
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Failed to delete category');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');

    try {
      if (editingCategory) {
        await api.put(`/products/categories/${editingCategory.id}`, formData);
        setSuccess('Category updated successfully');
      } else {
        await api.post('/products/categories', formData);
        setSuccess('Category created successfully');
      }

      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setModalError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setModalError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout
      title="Categories Management"
      subtitle="Manage product categories"
    >
      <div className="space-y-6">
        <ProductsNavbar />

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

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Categories ({categories.length})</h2>
          <Button onClick={() => { setEditingCategory(null); setFormData({ name: '', description: '' }); setModalError(''); setShowModal(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>

        <DataTable
            data={categories}
            columns={[
              {
                key: 'name',
                title: 'Name',
                sortable: true,
                cellClassName: 'font-medium',
              },
              {
                key: 'slug',
                title: 'Slug',
                sortable: true,
                cellClassName: 'text-muted-foreground',
              },
              {
                key: 'description',
                title: 'Description',
                render: (value) => (value ? String(value) : '-'),
              },
            ]}
            actions={[
              {
                label: 'Edit',
                icon: <Edit className="h-4 w-4" />,
                onClick: (category) => handleEdit(category),
                variant: 'ghost',
              },
              {
                label: 'Delete',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: (category) => handleDelete(category.id),
                variant: 'ghost',
              },
            ]}
            searchable={true}
            searchPlaceholder="Search categories..."
            emptyMessage="No categories found. Add your first category to get started."
            pagination={true}
            pageSize={10}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={(column, direction) => {
              setSortBy(column);
              setSortOrder(direction);
            }}
            serverPagination={true}
            paginationMeta={paginationMeta}
            onPageChange={handlePageChange}
          />
      </div>

      <FormModal
        open={showModal}
        onOpenChange={(open) => { if (!open) handleCloseModal(); else setShowModal(open); }}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        description={editingCategory ? 'Update the category details below.' : 'Add a new category to organize your products.'}
        onSubmit={handleSubmit}
        submitText={editingCategory ? 'Update Category' : 'Create Category'}
        isSubmitting={submitting}
      >
        {modalError && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm mb-4">
            {modalError}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Electronics"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Brief description of this category..."
            />
          </div>
        </div>
      </FormModal>
    </AdminLayout>
  );
}
