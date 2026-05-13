'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/lib/api';
import ProductsNavbar from '@/components/admin/products-navbar';
import AdminLayout from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
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

interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  category_id: number;
  unit_id: number;
  price: number;
  cost: number;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  barcode: string;
  thumb_url: string;
  status: 'active' | 'inactive';
  sort_order?: number;
  category?: { id: number; name: string };
  unit?: { id: number; name: string; symbol: string };
}

interface Category {
  id: number;
  name: string;
}

interface Pagination {
  total: number;
  page: string;
  limit: string;
  totalPage: number;
}

function SortableProductRow({
  product,
  formatCurrency,
  onDelete,
}: {
  product: Product;
  formatCurrency: (n: number) => string;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const stockBadge = product.stock_quantity <= product.min_stock_level
    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    : product.stock_quantity <= product.max_stock_level * 0.5
      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-muted/50 ${isDragging ? 'shadow-lg bg-muted' : ''}`}
    >
      <td className="px-3 py-3 w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {product.thumb_url && (
            <img
              src={product.thumb_url}
              alt={product.name}
              className="h-10 w-10 rounded object-cover mr-4"
            />
          )}
          <div>
            <div className="text-sm font-medium text-foreground">{product.name}</div>
            <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
        {product.category?.name || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
        {formatCurrency(product.price)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockBadge}`}>
          {product.stock_quantity} {product.unit?.symbol}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.status === 'active'
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
          }`}>
          {product.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <a
          href={`/admin/product/details/${product.id}`}
          className="text-green-600 hover:text-green-900"
        >
          View
        </a>
        <span className="text-gray-300">|</span>
        <a
          href={`/admin/product/${product.id}/edit`}
          className="text-brand hover:text-brand/80"
        >
          Edit
        </a>
        <span className="text-gray-300">|</span>
        <button
          onClick={() => onDelete(product.id)}
          className="text-red-600 hover:text-red-900"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

export default function AdminProductsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: '1',
    limit: '10',
    totalPage: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

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
      fetchProducts();
      fetchCategories();
    }
  }, [isAuthenticated, currentPage, selectedCategory]);

  const fetchProducts = useCallback(async () => {
    try {
      setDataLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      if (selectedCategory) params.append('category_id', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/products?${params}`);
      setProducts(response.data.data);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      setError('Failed to load products');
    } finally {
      setDataLoading(false);
    }
  }, [currentPage, selectedCategory, searchTerm]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/ecommerce/categories?page=1&limit=100');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleDragEnd = async (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = products.findIndex((p) => p.id === active.id);
    const newIndex = products.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(products, oldIndex, newIndex);
    setProducts(reordered);

    try {
      const orders = reordered.map((p, i) => ({ id: p.id, sort_order: i }));
      await api.put('/products/reorder', { orders });
    } catch {
      setProducts(products);
      setError('Failed to save order');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/products/${id}`);
      setSuccess('Product deleted successfully');
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete product');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout
    >
      <div className="w-full">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products Management</h1>
            <p className="text-sm text-muted-foreground">Manage your product catalog</p>
          </div>
        </div>

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

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl border overflow-hidden shadow-none p-6 mb-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px]">
              <input
                type="text"
                placeholder="Search by name, SKU, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all text-sm"
              />
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all text-sm font-medium appearance-none min-w-[180px]"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all shadow-sm"
            >
              Search
            </button>
            <a
              href="/admin/product/add-new"
              className="px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand/90 transition-all shadow-lg flex items-center"
            >
              <span className="mr-2">+</span> Add Product
            </a>
          </form>
        </div>

        {/* Products Table with Drag & Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="bg-white rounded-2xl border overflow-hidden shadow-none">
            <div className="bg-gray-50/50 px-6 py-2 border-b-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Product List</h2>
              <span className="text-xs text-slate-500">{pagination.total} Total Products</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/30">
                  <tr>
                    <th className="px-3 py-3 w-10"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-border">
                  {dataLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
                          <span className="text-sm text-muted-foreground">Loading products...</span>
                        </div>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    <SortableContext
                      items={products.map((p) => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {products.map((product) => (
                        <SortableProductRow
                          key={product.id}
                          product={product}
                          formatCurrency={formatCurrency}
                          onDelete={handleDelete}
                        />
                      ))}
                    </SortableContext>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-6 py-4 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-slate-500">
                  Showing <span className="font-semibold text-slate-900">{((currentPage - 1) * 10) + 1}</span> to{' '}
                  <span className="font-semibold text-slate-900">{Math.min(currentPage * 10, pagination.total)}</span> of{' '}
                  <span className="font-semibold text-slate-900">{pagination.total}</span> products
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={currentPage >= pagination.totalPage}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DndContext>
      </div>
    </AdminLayout>
  );
}