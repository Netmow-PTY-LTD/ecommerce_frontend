'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AdminLayout from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Zap, Plus, Edit, Trash2, X, Loader2, ChevronLeft, ChevronRight, Package, Search } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface FlashSaleItem {
  id: number;
  product_id: number;
  original_price: number;
  sale_price: number;
  quantity_limit: number | null;
  sold_count: number;
  product?: { id: number; name: string; slug: string };
}

interface FlashSale {
  id: number;
  name: string;
  slug: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  banner_image?: string;
  items?: FlashSaleItem[];
  created_at: string;
}

const emptyForm = {
  name: '',
  description: '',
  starts_at: '',
  ends_at: '',
  banner_image: '',
  is_active: true,
};

export default function AdminFlashSalesPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { formatCurrency } = useCurrency();

  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPage: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Flash sale modal
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState<FlashSale | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Item modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemSaleId, setItemSaleId] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState({ product_id: '', original_price: '', sale_price: '', quantity_limit: '' });
  const [savingItem, setSavingItem] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchingProducts, setSearchingProducts] = useState(false);

  // Detail panel
  const [expandedSale, setExpandedSale] = useState<number | null>(null);
  const [saleDetails, setSaleDetails] = useState<FlashSale | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/admin/login');
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) fetchFlashSales();
  }, [isAuthenticated, currentPage]);

  const fetchFlashSales = async () => {
    try {
      const res = await api.get(`/pricing/flash-sales?page=${currentPage}&limit=20`);
      setFlashSales(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 20, totalPage: 0 });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load flash sales');
    }
  };

  const fetchSaleDetails = async (id: number) => {
    setLoadingDetails(true);
    setSaleDetails(null);
    try {
      const res = await api.get(`/pricing/flash-sales/${id}`);
      setSaleDetails(res.data.data);
    } catch (err: any) {
      console.error('Failed to load flash sale details:', err?.response?.data || err?.message);
      setSaleDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExpand = (id: number) => {
    if (expandedSale === id) {
      setExpandedSale(null);
      setSaleDetails(null);
    } else {
      setExpandedSale(id);
      fetchSaleDetails(id);
    }
  };

  // --- Flash Sale CRUD ---
  const openCreateModal = () => {
    setEditingSale(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (sale: FlashSale) => {
    setEditingSale(sale);
    setForm({
      name: sale.name,
      description: sale.description || '',
      starts_at: sale.starts_at ? sale.starts_at.slice(0, 16) : '',
      ends_at: sale.ends_at ? sale.ends_at.slice(0, 16) : '',
      banner_image: sale.banner_image || '',
      is_active: sale.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.starts_at || !form.ends_at) {
      setError('Name, start date, and end date are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingSale) {
        await api.put(`/pricing/flash-sales/${editingSale.id}`, form);
        setSuccess('Flash sale updated');
      } else {
        await api.post('/pricing/flash-sales', form);
        setSuccess('Flash sale created');
      }
      setShowModal(false);
      fetchFlashSales();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this flash sale?')) return;
    try {
      await api.delete(`/pricing/flash-sales/${id}`);
      setSuccess('Flash sale deleted');
      fetchFlashSales();
      if (expandedSale === id) { setExpandedSale(null); setSaleDetails(null); }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  // --- Item management ---
  const openItemModal = (saleId: number) => {
    setItemSaleId(saleId);
    setItemForm({ product_id: '', original_price: '', sale_price: '', quantity_limit: '' });
    setProductSearch('');
    setProducts([]);
    setShowItemModal(true);
  };

  const searchProducts = useCallback(async (q: string) => {
    if (q.length < 2) { setProducts([]); return; }
    setSearchingProducts(true);
    try {
      const res = await api.get(`/products?search=${encodeURIComponent(q)}&limit=10`);
      setProducts(res.data.data || []);
    } catch {
      setProducts([]);
    } finally {
      setSearchingProducts(false);
    }
  }, []);

  const selectProduct = (product: any) => {
    setItemForm(f => ({
      ...f,
      product_id: product.id,
      original_price: String(product.price || product.selling_price || ''),
    }));
    setProducts([]);
    setProductSearch(product.name);
  };

  const handleAddItem = async () => {
    if (!itemForm.product_id || !itemForm.sale_price) {
      setError('Product and sale price are required.');
      return;
    }
    setSavingItem(true);
    setError('');
    try {
      await api.post(`/pricing/flash-sales/${itemSaleId}/items`, {
        product_id: Number(itemForm.product_id),
        original_price: Number(itemForm.original_price),
        sale_price: Number(itemForm.sale_price),
        quantity_limit: itemForm.quantity_limit ? Number(itemForm.quantity_limit) : undefined,
      });
      setSuccess('Product added to flash sale');
      setShowItemModal(false);
      if (expandedSale === itemSaleId) fetchSaleDetails(itemSaleId);
      fetchFlashSales();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add item');
    } finally {
      setSavingItem(false);
    }
  };

  const handleRemoveItem = async (saleId: number, itemId: number) => {
    if (!confirm('Remove this product from the flash sale?')) return;
    try {
      await api.delete(`/pricing/flash-sales/${saleId}/items/${itemId}`);
      setSuccess('Item removed');
      if (expandedSale === saleId) fetchSaleDetails(saleId);
      fetchFlashSales();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove item');
    }
  };

  const getStatusBadge = (sale: FlashSale) => {
    const now = new Date();
    const start = new Date(sale.starts_at);
    const end = new Date(sale.ends_at);

    if (!sale.is_active) return { label: 'Inactive', color: 'bg-gray-100 text-gray-700' };
    if (now < start) return { label: 'Scheduled', color: 'bg-blue-100 text-blue-700' };
    if (now >= start && now <= end) return { label: 'Active', color: 'bg-green-100 text-green-700' };
    return { label: 'Expired', color: 'bg-red-100 text-red-700' };
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <AdminLayout title="Flash Sales" subtitle="Create and manage time-limited sale events">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl flex items-center">
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 101.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center">
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Flash Sales</h2>
            <p className="text-sm text-slate-500 mt-1">{pagination.total} total flash sale events</p>
          </div>
          <Button onClick={openCreateModal} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
            <Plus className="h-4 w-4 mr-2" /> New Flash Sale
          </Button>
        </div>

        {/* Flash Sales List */}
        {flashSales.length === 0 ? (
          <div className="bg-white rounded-2xl shadow border border-slate-200 p-16 text-center">
            <Zap className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No flash sales yet</h3>
            <p className="text-slate-500 mb-6">Create your first flash sale event to offer time-limited deals.</p>
            <Button onClick={openCreateModal} className="bg-gradient-to-r from-indigo-600 to-purple-600">
              <Plus className="h-4 w-4 mr-2" /> Create Flash Sale
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {flashSales.map((sale) => {
              const status = getStatusBadge(sale);
              const isExpanded = expandedSale === sale;

              return (
                <div key={sale.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                  {/* Sale Card Header */}
                  <div
                    className="px-6 py-5 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => handleExpand(sale.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Zap className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{sale.name}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                            <span>{formatDate(sale.starts_at)}</span>
                            <span className="text-slate-300">→</span>
                            <span>{formatDate(sale.ends_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="text-sm text-slate-500">
                          {(sale.items?.length || 0)} product{(sale.items?.length || 0) !== 1 ? 's' : ''}
                        </span>
                        <svg className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50">
                      {loadingDetails ? (
                        <div className="p-8 flex justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                        </div>
                      ) : saleDetails ? (
                        <div className="p-6">
                          {saleDetails.description && (
                            <p className="text-sm text-slate-600 mb-4">{saleDetails.description}</p>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-3 mb-4">
                            <Button size="sm" onClick={() => openItemModal(sale.id)} className="bg-gradient-to-r from-green-600 to-emerald-600">
                              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Product
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openEditModal(sale)}>
                              <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(sale.id)}>
                              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                            </Button>
                          </div>

                          {/* Items Table */}
                          {saleDetails.items && saleDetails.items.length > 0 ? (
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                              <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Product</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Original</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Sale Price</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Discount</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Sold / Limit</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                  {saleDetails.items.map((item) => {
                                    const discountPct = item.original_price > 0
                                      ? Math.round((1 - item.sale_price / item.original_price) * 100)
                                      : 0;
                                    return (
                                      <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                              <Package className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-900">
                                              {item.product?.name || `Product #${item.product_id}`}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500 text-right line-through">
                                          {formatCurrency(item.original_price)}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">
                                          {formatCurrency(item.sale_price)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">
                                            -{discountPct}%
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center text-slate-700">
                                          {item.sold_count || 0} / {item.quantity_limit || '∞'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <button
                                            onClick={() => handleRemoveItem(sale.id, item.id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                              <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                              <p className="text-sm text-slate-500">No products added yet. Click "Add Product" to start.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-slate-500">Failed to load details</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {pagination.totalPage > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-slate-600">
                  Page {currentPage} of {pagination.totalPage} ({pagination.total} total)
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={currentPage >= pagination.totalPage} onClick={() => setCurrentPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Create/Edit Flash Sale Modal --- */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-slate-200 rounded-t-2xl flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-amber-600" />
                  {editingSale ? 'Edit Flash Sale' : 'New Flash Sale'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <Label className="mb-1.5">Name <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="e.g. Summer Flash Deal"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="mb-1.5">Description</Label>
                  <Textarea
                    placeholder="Describe this flash sale event..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5">Starts At <span className="text-red-500">*</span></Label>
                    <Input
                      type="datetime-local"
                      value={form.starts_at}
                      onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5">Ends At <span className="text-red-500">*</span></Label>
                    <Input
                      type="datetime-local"
                      value={form.ends_at}
                      onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5">Banner Image URL</Label>
                  <Input
                    placeholder="https://..."
                    value={form.banner_image}
                    onChange={e => setForm(f => ({ ...f, banner_image: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 rounded-b-2xl">
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingSale ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* --- Add Item Modal --- */}
        {showItemModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200 rounded-t-2xl flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-green-600" />
                  Add Product to Flash Sale
                </h3>
                <button onClick={() => setShowItemModal(false)} className="p-1 hover:bg-slate-200 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Product Search */}
                <div className="relative">
                  <Label className="mb-1.5">Product <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-9"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={e => {
                        setProductSearch(e.target.value);
                        searchProducts(e.target.value);
                      }}
                    />
                    {searchingProducts && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                    )}
                  </div>
                  {products.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {products.map((p: any) => (
                        <button
                          key={p.id}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm flex items-center gap-3"
                          onClick={() => selectProduct(p)}
                        >
                          <Package className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-slate-900">{p.name}</p>
                            <p className="text-xs text-slate-500">{formatCurrency(p.price || p.selling_price)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {itemForm.product_id && (
                    <p className="text-xs text-green-600 mt-1">Product selected (ID: {itemForm.product_id})</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5">Original Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={itemForm.original_price}
                      onChange={e => setItemForm(f => ({ ...f, original_price: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5">Sale Price <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={itemForm.sale_price}
                      onChange={e => setItemForm(f => ({ ...f, sale_price: e.target.value }))}
                    />
                  </div>
                </div>

                {itemForm.original_price && itemForm.sale_price && Number(itemForm.original_price) > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <span className="text-sm text-green-700 font-medium">
                      Discount: {Math.round((1 - Number(itemForm.sale_price) / Number(itemForm.original_price)) * 100)}% off
                    </span>
                  </div>
                )}

                <div>
                  <Label className="mb-1.5">Quantity Limit <span className="text-xs text-slate-400">(optional, leave empty for unlimited)</span></Label>
                  <Input
                    type="number"
                    placeholder="e.g. 100"
                    value={itemForm.quantity_limit}
                    onChange={e => setItemForm(f => ({ ...f, quantity_limit: e.target.value }))}
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 rounded-b-2xl">
                <Button variant="outline" onClick={() => setShowItemModal(false)}>Cancel</Button>
                <Button onClick={handleAddItem} disabled={savingItem} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  {savingItem ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add Product
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
