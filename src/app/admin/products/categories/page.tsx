'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProductsNavbar from '@/components/admin/products-navbar';
import AdminLayout from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus, GripVertical, ImageIcon } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  show_on_home?: boolean;
  status: 'active' | 'inactive';
  sort_order?: number;
}

function SortableCategoryItem({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: (c: Category) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-2xl border bg-white p-4 transition-all ${isDragging ? 'shadow-xl ring-2 ring-indigo-500/20' : 'shadow-none hover:border-slate-300'
        }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing shrink-0"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {category.image_url ? (
        <img
          src={category.image_url}
          alt={category.name}
          className="h-12 w-12 rounded-lg object-cover shrink-0 border"
        />
      ) : (
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 border">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">{category.name}</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${category.status === 'active'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            }`}>
            {category.status === 'active' ? 'Active' : 'Inactive'}
          </span>
          {category.show_on_home && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
              Home
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-sm text-muted-foreground">
          <span className="truncate">{category.slug}</span>
          {category.description && (
            <>
              <span className="text-border">·</span>
              <span className="truncate">{category.description}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => onEdit(category)} className="h-8 w-8 p-0">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(category.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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
      setDataLoading(true);
      const response = await api.get(`/products/categories?page=${page}&limit=100`);
      setCategories(response.data.data || []);
      setPaginationMeta(response.data.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        totalPage: 0,
      });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setDataLoading(false);
    }
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDragEnd = async (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);

    try {
      const orders = reordered.map((c, i) => ({ id: c.id, sort_order: i }));
      await api.put('/products/categories/reorder', { orders });
    } catch {
      setCategories(categories);
      setError('Failed to save order');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (category: Category) => {
    router.push(`/admin/products/categories/${category.id}/edit`);
  };

  const handleDeleteClick = (id: number) => {
    setCategoryToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setIsDeleting(true);
      await api.delete(`/products/categories/${categoryToDelete}`);
      setSuccess('Category deleted successfully');
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete category');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
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
    <>
      <AdminLayout>
        <div className="w-full">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Categories Management</h1>
              <p className="text-slate-500 text-sm">Manage your product categories</p>
            </div>
            <Button
              onClick={() => router.push('/admin/products/categories/add')}
              className="gap-2 bg-brand text-white border-none rounded-xl px-6 py-2.5 font-semibold shadow-lg hover:bg-brand/90 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </div>
          <div className="space-y-6">
            <ProductsNavbar />

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

            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Categories ({paginationMeta.total})</h2>
            </div>

            {dataLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground font-medium">Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No categories found. Add your first category to get started.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <SortableCategoryItem
                        key={category.id}
                        category={category}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {paginationMeta.totalPage > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: paginationMeta.totalPage }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Delete Category"
        description="Are you sure you want to delete this category? This will also affect products associated with it."
        confirmText="Delete Category"
      />
    </>
  );
}
