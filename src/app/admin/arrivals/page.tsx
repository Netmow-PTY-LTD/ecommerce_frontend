'use client';

import { useEffect, useState } from 'react';
import { useAdminArrivals } from '@/hooks/use-admin-arrivals';
import AdminLayout from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Loader2, Plus, Edit, Trash2, Search, Star, Package } from 'lucide-react';
import { ArrivalProduct } from '@/types';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function AdminArrivalsPage() {
    const {
        arrivals,
        loading,
        error,
        pagination,
        fetchArrivals,
        createArrival,
        updateArrival,
        deleteArrival,
    } = useAdminArrivals();

    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ status: '', featured: '', search: '' });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingArrival, setEditingArrival] = useState<ArrivalProduct | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        product_id: '',
        featured: false,
        display_order: 0,
        expiry_date: '',
        badge_text: '',
        status: 'active' as 'active' | 'inactive' | 'scheduled',
    });
    const [products, setProducts] = useState<any[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);

    useEffect(() => {
        fetchArrivals(page, 10, filters);
    }, [page, filters]);

    // Fetch products for dropdown
    useEffect(() => {
        const fetchProducts = async () => {
            setProductsLoading(true);
            try {
                const response = await api.get('/products?limit=50&status=active');
                setProducts(response.data.data || []);
            } catch (err) {
                console.error('Failed to fetch products:', err);
            } finally {
                setProductsLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handleEdit = (arrival: ArrivalProduct) => {
        setEditingArrival(arrival);
        setFormData({
            product_id: arrival.product_id.toString(),
            featured: arrival.featured,
            display_order: arrival.display_order,
            expiry_date: arrival.expiry_date ? arrival.expiry_date.split('T')[0] : '',
            badge_text: arrival.badge_text || '',
            status: arrival.status,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async () => {
        if (deleteId) {
            try {
                await deleteArrival(deleteId);
                toast.success('Arrival deleted successfully');
                fetchArrivals(page, 10, filters);
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to delete arrival');
            }
            setDeleteId(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                product_id: parseInt(formData.product_id),
                expiry_date: formData.expiry_date || null,
            };

            if (editingArrival) {
                await updateArrival(editingArrival.id, data);
                toast.success('Arrival updated successfully');
            } else {
                await createArrival(data);
                toast.success('Arrival created successfully');
            }

            setIsDialogOpen(false);
            setEditingArrival(null);
            setFormData({
                product_id: '',
                featured: false,
                display_order: 0,
                expiry_date: '',
                badge_text: '',
                status: 'active',
            });
            fetchArrivals(page, 10, filters);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save arrival');
        }
    };

    const openCreateDialog = () => {
        setEditingArrival(null);
        setFormData({
            product_id: '',
            featured: false,
            display_order: 0,
            expiry_date: '',
            badge_text: '',
            status: 'active',
        });
        setIsDialogOpen(true);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Arrival Products</h1>
                        <p className="text-muted-foreground">Manage new arrivals and featured products</p>
                    </div>
                    <Button onClick={openCreateDialog} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Arrival
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search arrivals..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="pl-10"
                        />
                    </div>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="scheduled">Scheduled</option>
                    </select>
                    <select
                        value={filters.featured}
                        onChange={(e) => setFilters({ ...filters, featured: e.target.value })}
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="">All</option>
                        <option value="true">Featured</option>
                        <option value="false">Not Featured</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-background border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Arrival Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Badge
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Featured
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Order
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </td>
                                    </tr>
                                ) : arrivals.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No arrivals found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    arrivals.map((arrival) => (
                                        <tr key={arrival.id} className="hover:bg-muted/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    {arrival.product?.thumb_url && (
                                                        <img
                                                            src={arrival.product.thumb_url}
                                                            alt={arrival.product.name}
                                                            className="h-10 w-10 rounded object-cover mr-3"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-medium">{arrival.product?.name || '-'}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            SKU: {arrival.product?.sku || '-'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {new Date(arrival.arrival_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {arrival.badge_text || (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {arrival.featured ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                                        <Star className="h-3 w-3 fill-current" />
                                                        Featured
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">No</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {arrival.display_order}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    arrival.status === 'active'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : arrival.status === 'scheduled'
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                                    {arrival.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(arrival)}
                                                    className="text-brand hover:text-brand/80 mr-3"
                                                >
                                                    <Edit className="h-4 w-4 inline" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(arrival.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <Trash2 className="h-4 w-4 inline" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPage > 1 && (
                        <div className="flex justify-center items-center gap-2 px-6 py-4 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {pagination.page} of {pagination.totalPage}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={page === pagination.totalPage}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingArrival ? 'Edit Arrival' : 'Add New Arrival'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingArrival
                                ? 'Update the arrival product details.'
                                : 'Add a new product to arrivals.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="product">Product *</Label>
                                <select
                                    id="product"
                                    value={formData.product_id}
                                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                                    required
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="">Select a product</option>
                                    {productsLoading ? (
                                        <option disabled>Loading products...</option>
                                    ) : (
                                        products.map((product) => (
                                            <option key={product.id} value={product.id.toString()}>
                                                {product.name} ({product.sku})
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="flex items-center justify-between">
                                <Label htmlFor="featured">Featured</Label>
                                <Switch
                                    id="featured"
                                    checked={formData.featured}
                                    onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="display_order">Display Order</Label>
                                <Input
                                    id="display_order"
                                    type="number"
                                    min="0"
                                    value={formData.display_order}
                                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="badge_text">Badge Text</Label>
                                <Input
                                    id="badge_text"
                                    placeholder="e.g., NEW, HOT, LIMITED"
                                    value={formData.badge_text}
                                    onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                                    maxLength={50}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="expiry_date">Expiry Date</Label>
                                <Input
                                    id="expiry_date"
                                    type="date"
                                    value={formData.expiry_date}
                                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="scheduled">Scheduled</option>
                                </select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingArrival ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Arrival"
                message="Are you sure you want to delete this arrival? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
            />
        </AdminLayout>
    );
}
