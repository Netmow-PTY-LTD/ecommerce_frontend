'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AdminLayout from '@/components/admin/admin-layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, X, Check, ImageIcon } from 'lucide-react';
import { ImageGalleryModal } from '@/components/admin/ImageGalleryModal';
import { GalleryImage } from '@/types';

type GalleryTarget = 'category' | 'meta';

export default function AddCategoryPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showCategoryImageModal, setShowCategoryImageModal] = useState(false);
  const [showMetaImageModal, setShowMetaImageModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    show_on_home: false,
    meta_title: '',
    meta_description: '',
    meta_image: '',
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload: any = { ...formData };
      if (!payload.image_url) delete payload.image_url;
      if (!payload.meta_title) payload.meta_title = null;
      if (!payload.meta_description) payload.meta_description = null;
      if (!payload.meta_image) payload.meta_image = null;
      await api.post('/products/categories', payload);
      router.push('/admin/products/categories');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add New Category</h1>
            <p className="text-slate-500 mt-1 text-sm">Add a new product category</p>
          </div>
          <Button variant="ghost" onClick={() => router.push('/admin/products/categories')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Categories
          </Button>
        </div>


        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General */}
          <div className="bg-white rounded-2xl border overflow-hidden shadow-none">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-2 border-b-1 gap-0">
              <h3 className="font-semibold text-lg text-slate-900 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2 text-indigo-600" />
                General
              </h3>
            </div>
            <div className="p-6 space-y-4">

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

            {/* Category Image */}
            <div className="space-y-2">
              <Label>Category Image</Label>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={() => setShowCategoryImageModal(true)} className="gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Select from Gallery
                </Button>
                {formData.image_url && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, image_url: '' })} className="text-destructive">
                    Remove
                  </Button>
                )}
              </div>
              {formData.image_url ? (
                <div className="mt-2">
                  <img src={formData.image_url} alt="Category" className="h-40 w-40 object-cover rounded-lg border-2 border-primary/30 shadow" />
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center mt-2">
                  <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No image selected</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                id="show_on_home"
                type="checkbox"
                checked={formData.show_on_home}
                onChange={(e) => setFormData({ ...formData, show_on_home: e.target.checked })}
                className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
              />
              <Label htmlFor="show_on_home" className="cursor-pointer">Show on Home Page</Label>
            </div>
          </div>
        </div>

          {/* SEO / Meta */}
          <div className="bg-white rounded-2xl border overflow-hidden shadow-none">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-2 border-b-1 gap-0 flex items-center">
              <h3 className="font-semibold text-lg text-slate-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                SEO / Meta
              </h3>
            </div>
            <div className="p-6 space-y-4">

            <div className="space-y-2">
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input
                id="meta_title"
                type="text"
                value={formData.meta_title}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                placeholder="SEO title for search engines"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                rows={3}
                placeholder="Brief description for search engine results..."
              />
            </div>

            {/* Meta Image */}
            <div className="space-y-2">
              <Label>Meta Image</Label>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={() => setShowMetaImageModal(true)} className="gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Select from Gallery
                </Button>
                {formData.meta_image && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, meta_image: '' })} className="text-destructive">
                    Remove
                  </Button>
                )}
              </div>
              {formData.meta_image ? (
                <div className="mt-2">
                  <img src={formData.meta_image} alt="Meta" className="h-40 w-40 object-cover rounded-lg border-2 border-primary/30 shadow" />
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center mt-2">
                  <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No meta image selected</p>
                </div>
              )}
            </div>
          </div>
        </div>

          <div className="flex justify-between items-center bg-white px-6 py-4 rounded-2xl border shadow-none">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/products/categories')}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-none">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Category
            </Button>
          </div>
        </form>
      </div>

      {/* Gallery Selection Modals */}
      <ImageGalleryModal
        isOpen={showCategoryImageModal}
        onClose={() => setShowCategoryImageModal(false)}
        onSelect={(selected: GalleryImage | GalleryImage[]) => {
          const img = selected as GalleryImage;
          setFormData({ ...formData, image_url: img.url });
        }}
        title="Select Category Image"
        themeColor="indigo"
        initialSelection={formData.image_url}
      />

      <ImageGalleryModal
        isOpen={showMetaImageModal}
        onClose={() => setShowMetaImageModal(false)}
        onSelect={(selected: GalleryImage | GalleryImage[]) => {
          const img = selected as GalleryImage;
          setFormData({ ...formData, meta_image: img.url });
        }}
        title="Select Meta Image"
        themeColor="emerald"
        initialSelection={formData.meta_image}
      />
    </AdminLayout>
  );
}
