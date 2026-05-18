'use client';

import { useEffect, useState } from 'react';
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
import { Loader2, Plus, Edit, Trash2, Search, Sliders, Image as ImageIcon } from 'lucide-react';
import { HeroSlide } from '@/types';
import { toast } from 'sonner';
import api from '@/lib/api';
import { MediaLibraryModal } from '@/components/admin/MediaLibraryModal';

export default function AdminHeroPage() {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);
    const [filters, setFilters] = useState({ status: '', search: '' });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isMediaOpen, setIsMediaOpen] = useState(false);
    const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        subtitle: '',
        title: '',
        deal: '',
        discount: '',
        image: '',
        accent: '#ff4d4d',
        status: 'active' as 'active' | 'inactive',
        display_order: 0,
    });

    const fetchSlides = async (currentPage = 1, searchFilters = filters) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10',
            });
            if (searchFilters.status) params.append('status', searchFilters.status);
            if (searchFilters.search) params.append('search', searchFilters.search);

            const response = await api.get(`/hero?${params}`);
            setSlides(response.data.data || []);
            setPagination(response.data.pagination);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to fetch slides');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSlides(page, filters);
    }, [page, filters]);

    const handleEdit = (slide: HeroSlide) => {
        setEditingSlide(slide);
        setFormData({
            subtitle: slide.subtitle,
            title: slide.title,
            deal: slide.deal || '',
            discount: slide.discount || '',
            image: slide.image,
            accent: slide.accent || '#ff4d4d',
            status: slide.status,
            display_order: slide.display_order,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async () => {
        if (deleteId) {
            try {
                await api.delete(`/hero/${deleteId}`);
                toast.success('Hero slide deleted successfully');
                fetchSlides(page, filters);
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to delete slide');
            }
            setDeleteId(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                deal: formData.deal || null,
                discount: formData.discount || null,
                accent: formData.accent || '#ff4d4d',
            };

            if (editingSlide) {
                await api.put(`/hero/${editingSlide.id}`, data);
                toast.success('Hero slide updated successfully');
            } else {
                await api.post('/hero', data);
                toast.success('Hero slide created successfully');
            }

            setIsDialogOpen(false);
            setEditingSlide(null);
            setFormData({
                subtitle: '',
                title: '',
                deal: '',
                discount: '',
                image: '',
                accent: '#ff4d4d',
                status: 'active',
                display_order: 0,
            });
            fetchSlides(page, filters);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save slide');
        }
    };

    const openCreateDialog = () => {
        setEditingSlide(null);
        setFormData({
            subtitle: '',
            title: '',
            deal: '',
            discount: '',
            image: '',
            accent: '#ff4d4d',
            status: 'active',
            display_order: 0,
        });
        setIsDialogOpen(true);
    };

    return (
        <AdminLayout title="Hero Slides" subtitle="Manage slides for the public storefront home hero section">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Hero Slides</h1>
                        <p className="text-muted-foreground">Customize marketing sliders, banners, and discounts</p>
                    </div>
                    <Button onClick={openCreateDialog} className="gap-2 bg-brand hover:opacity-90">
                        <Plus className="h-4 w-4" />
                        Add Hero Slide
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search slides by title or subtitle..."
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
                    </select>
                </div>

                {/* Table */}
                <div className="bg-background border rounded-lg overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Image
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Slide Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Deal & Discount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Accent Color
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
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-brand" />
                                        </td>
                                    </tr>
                                ) : slides.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                            <Sliders className="h-12 w-12 mx-auto mb-4 opacity-50 text-slate-400" />
                                            <p>No slides found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    slides.map((slide) => (
                                        <tr key={slide.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {slide.image ? (
                                                    <img
                                                        src={slide.image}
                                                        alt={slide.title}
                                                        className="h-14 w-20 rounded object-contain border bg-slate-50"
                                                    />
                                                ) : (
                                                    <div className="h-14 w-20 rounded border bg-slate-50 flex items-center justify-center text-muted-foreground">
                                                        <ImageIcon className="h-6 w-6" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-800">{slide.title}</div>
                                                    <div className="text-xs text-muted-foreground mt-0.5">{slide.subtitle}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <div>{slide.deal || <span className="text-slate-300">-</span>}</div>
                                                    {slide.discount && (
                                                        <span className="inline-block bg-brand/10 text-brand text-xs font-bold px-1.5 py-0.5 rounded mt-1">
                                                            {slide.discount}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-4 h-4 rounded-full border"
                                                        style={{ backgroundColor: slide.accent || '#ff4d4d' }}
                                                    />
                                                    <span className="text-xs font-mono text-slate-600">
                                                        {slide.accent || '#ff4d4d'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                                                {slide.display_order}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    slide.status === 'active'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                                    {slide.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(slide)}
                                                    className="text-brand hover:opacity-80 mr-3"
                                                >
                                                    <Edit className="h-4 w-4 inline" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(slide.id)}
                                                    className="text-red-600 hover:opacity-80"
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
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingSlide ? 'Edit Hero Slide' : 'Add New Hero Slide'}
                        </DialogTitle>
                        <DialogDescription>
                            Configure marketing text, slide image, and accents for the storefront homepage.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., The best way to stuff your wallet."
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subtitle">Subtitle *</Label>
                                <Input
                                    id="subtitle"
                                    placeholder="e.g., Super Delicious or Premium Sound"
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="deal">Deal Label</Label>
                                    <Input
                                        id="deal"
                                        placeholder="e.g., Today's Best Deal"
                                        value={formData.deal}
                                        onChange={(e) => setFormData({ ...formData, deal: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="discount">Discount Badge Text</Label>
                                    <Input
                                        id="discount"
                                        placeholder="e.g., 50% OFF"
                                        value={formData.discount}
                                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="image">Slide Image *</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="image"
                                        placeholder="Image URL or select from Media Library"
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsMediaOpen(true)}
                                        className="shrink-0"
                                    >
                                        Browse
                                    </Button>
                                </div>
                                {formData.image && (
                                    <div className="mt-2 border rounded p-2 bg-slate-50 flex items-center justify-center">
                                        <img src={formData.image} alt="Preview" className="h-32 object-contain" />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="accent">Accent Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="accent"
                                            type="color"
                                            value={formData.accent}
                                            onChange={(e) => setFormData({ ...formData, accent: e.target.value })}
                                            className="w-12 h-10 p-1 cursor-pointer shrink-0"
                                        />
                                        <Input
                                            value={formData.accent}
                                            onChange={(e) => setFormData({ ...formData, accent: e.target.value })}
                                            placeholder="#ff4d4d"
                                        />
                                    </div>
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
                                </select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-brand hover:opacity-90">
                                {editingSlide ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Media Gallery Selector */}
            <MediaLibraryModal
                open={isMediaOpen}
                onOpenChange={setIsMediaOpen}
                onSelect={(url) => setFormData({ ...formData, image: url })}
            />

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Hero Slide"
                description="Are you sure you want to delete this hero slide? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
            />
        </AdminLayout>
    );
}
