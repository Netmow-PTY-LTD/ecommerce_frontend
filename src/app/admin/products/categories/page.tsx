'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProductsNavbar from '@/components/admin/products-navbar';
import AdminLayout from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus, GripVertical, ImageIcon } from 'lucide-react';
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
      className={`flex items-center gap-3 rounded-lg border bg-card p-4 transition-shadow ${
        isDragging ? 'shadow-lg' : 'hover:shadow-sm'
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
          {category.show_on_home && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0">
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
          <h2 className="text-2xl font-bold text-foreground">Categories ({paginationMeta.total})</h2>
          <Button onClick={() => router.push('/admin/products/categories/add')} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>

        {categories.length === 0 ? (
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
                    onDelete={handleDelete}
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
    </AdminLayout>
  );
}
