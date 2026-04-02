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

interface GalleryImage {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  category: string;
}

type GalleryTarget = 'category' | 'meta';

export default function AddCategoryPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<GalleryTarget>('category');
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [filteredGalleryImages, setFilteredGalleryImages] = useState<GalleryImage[]>([]);
  const [gallerySearchTerm, setGallerySearchTerm] = useState('');
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState('');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchGalleryImages();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (gallerySearchTerm || selectedGalleryCategory) {
      const filtered = galleryImages.filter((img) => {
        const matchesSearch = !gallerySearchTerm ||
          img.filename.toLowerCase().includes(gallerySearchTerm.toLowerCase()) ||
          img.originalName?.toLowerCase().includes(gallerySearchTerm.toLowerCase());
        const matchesCategory = !selectedGalleryCategory || img.category === selectedGalleryCategory;
        return matchesSearch && matchesCategory;
      });
      setFilteredGalleryImages(filtered);
    } else {
      setFilteredGalleryImages(galleryImages);
    }
  }, [gallerySearchTerm, selectedGalleryCategory, galleryImages]);

  const fetchGalleryImages = async () => {
    try {
      const response = await api.get('/gallery?limit=100');
      setGalleryImages(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch gallery images:', error);
    }
  };

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

  const openGallery = (target: GalleryTarget) => {
    setGalleryTarget(target);
    setSelectedImage(null);
    setShowGalleryModal(true);
  };

  const handleSelectImage = (image: GalleryImage) => {
    setSelectedImage(image);
    if (galleryTarget === 'category') {
      setFormData({ ...formData, image_url: image.url });
    } else {
      setFormData({ ...formData, meta_image: image.url });
    }
    setShowGalleryModal(false);
  };

  const currentGallerySelectedUrl = galleryTarget === 'category' ? formData.image_url : formData.meta_image;

  return (
    <AdminLayout title="Add New Category" subtitle="Create a new product category">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.push('/admin/products/categories')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Categories
        </Button>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General */}
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg">General</h3>

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
                <Button type="button" variant="outline" onClick={() => openGallery('category')} className="gap-2">
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

          {/* SEO / Meta */}
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg">SEO / Meta</h3>

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
                <Button type="button" variant="outline" onClick={() => openGallery('meta')} className="gap-2">
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

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Category
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/admin/products/categories')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {/* Gallery Selection Modal */}
      {showGalleryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Select {galleryTarget === 'category' ? 'Category' : 'Meta'} Image</h3>
                <p className="text-sm text-muted-foreground">Choose an image from your gallery</p>
              </div>
              <button onClick={() => setShowGalleryModal(false)} className="p-2 hover:bg-muted rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 border-b flex gap-3">
              <input
                type="text"
                placeholder="Search images..."
                value={gallerySearchTerm}
                onChange={(e) => setGallerySearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg bg-background text-sm"
              />
              <select
                value={selectedGalleryCategory}
                onChange={(e) => setSelectedGalleryCategory(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-background text-sm"
              >
                <option value="">All Categories</option>
                <option value="products">Products</option>
                <option value="general">General</option>
                <option value="banner">Banner</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {filteredGalleryImages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No images found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredGalleryImages.map((image) => (
                    <div
                      key={image.id}
                      onClick={() => handleSelectImage(image)}
                      className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImage?.id === image.id || currentGallerySelectedUrl === image.url
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50 hover:shadow-lg'
                      }`}
                    >
                      <img src={image.url} alt={image.originalName || image.filename} className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-xs font-medium text-white truncate">{image.originalName || image.filename}</p>
                      </div>
                      {(selectedImage?.id === image.id || currentGallerySelectedUrl === image.url) && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
