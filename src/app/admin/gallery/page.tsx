'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AdminLayout from '@/components/admin/admin-layout';
import { ArrowLeft } from 'lucide-react';

interface GalleryImage {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  width?: number;
  height?: number;
  mimeType: string;
  category: string;
  caption?: string;
  altText?: string;
  tags?: string;
  created_at: string;
}

interface Pagination {
  total: number;
  page: string;
  limit: string;
  totalPage: number;
}

export default function AdminGalleryPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: '1',
    limit: '20',
    totalPage: 1,
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [uploadCategory, setUploadCategory] = useState('general');
  const [uploadTags, setUploadTags] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchImages();
      fetchCategories();
    }
  }, [isAuthenticated, currentPage, selectedCategory]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = images.filter((img) =>
        img.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.tags?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredImages(filtered);
    } else {
      setFilteredImages(images);
    }
  }, [searchTerm, images]);

  const fetchImages = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (selectedCategory) params.append('category', selectedCategory);

      const response = await api.get(`/gallery?${params}`);
      setImages(response.data.data);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Failed to fetch images:', error);
      setError('Failed to load images');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/gallery/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();

      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }

      formData.append('category', uploadCategory);
      if (uploadTags) {
        formData.append('tags', uploadTags);
      }

      const response = await api.post('/gallery/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(`${files.length} image(s) uploaded successfully!`);

      await fetchImages();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to upload images');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUploading(false);
      e.target.value = '';
      setUploadTags('');
    }
  };

  const handleDeleteImage = async (id: number) => {
    if (!confirm('Are you sure you want to delete this image? This will permanently remove it from DigitalOcean Spaces.')) {
      return;
    }

    try {
      await api.delete(`/gallery/${id}`);
      setSuccess('Image deleted successfully');

      await fetchImages();
      setTimeout(() => setSuccess(''), 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete image');
      setTimeout(() => setError(''), 2000);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setSuccess('URL copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading Gallery...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gallery Management</h1>
              <p className="text-slate-500 mt-1">Manage product images and media assets</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          </div>
        </div>
        {/* Alert Messages */}
        {success && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl shadow-sm flex items-center animate-slide-in">
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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

        {/* Upload & Filter Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Upload Section */}
            <div className="p-6 lg:p-8">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand/90 flex items-center justify-center mr-3 shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Upload Images</h3>
                  <p className="text-xs text-slate-500">To DigitalOcean Spaces</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all text-sm font-medium"
                  >
                    <option value="general">📁 General</option>
                    <option value="products">🛍️ Products</option>
                    <option value="blog">📝 Blog</option>
                    <option value="banner">🎨 Banner</option>
                    <option value="profile">👤 Profile</option>
                    <option value="hero-slider">🖼️ Hero Slider</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    placeholder="e.g. product, electronics, new"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all text-sm"
                  />
                </div>

                <label className="relative block cursor-pointer group">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                    id="image-upload"
                  />
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${uploading
                      ? 'border-brand/30 bg-brand/10 cursor-not-allowed'
                      : 'border-slate-300 hover:border-brand/40 hover:bg-brand/10/50 cursor-pointer'
                      }`}
                  >
                    {uploading ? (
                      <div className="space-y-3">
                        <div className="w-12 h-12 mx-auto border-4 border-brand/20 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-sm font-medium text-brand">Uploading to DigitalOcean Spaces...</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-14 h-14 mx-auto bg-gradient-to-br from-brand to-brand/90 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Click to upload</p>
                          <p className="text-xs text-slate-500">or drag and drop</p>
                        </div>
                        <p className="text-xs text-slate-400">JPEG, PNG, GIF, WebP • Max 5MB each</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Stats Section */}
            <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mr-3 shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Statistics</h3>
                  <p className="text-xs text-slate-500">Gallery overview</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Total Images</span>
                    <span className="text-2xl font-bold text-brand">{pagination.total}</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Storage</span>
                    <span className="text-sm font-semibold text-emerald-600">DigitalOcean Spaces</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Bucket</span>
                    <span className="text-sm font-semibold text-blue-600">ecommerce_test</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Filter Section */}
            <div className="p-6 lg:p-8">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mr-3 shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Filter & Search</h3>
                  <p className="text-xs text-slate-500">Find images quickly</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name, caption, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm font-medium appearance-none bg-[url('data:image/svg+xml;base64,PHN1Z2x3aWQ9InN2ZyIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciI+PHBhdGggZD0iTTEyIDE1bC00LTRoOHYtMkg0aDIgMiAwIDAgMSAyIDJ2MmEzIDMgMCAwIDEtMyAzaDE0YTUgNSAwIDAgMC01IDV6IiBmaWxsPSIjNjQ3Mzk4Ii8+PC9zdmc+')]"
                  >
                    <option value="">📁 All Categories</option>
                    <option value="general">📁 General</option>
                    <option value="products">🛍️ Products</option>
                    <option value="blog">📝 Blog</option>
                    <option value="banner">🎨 Banner</option>
                    <option value="profile">👤 Profile</option>
                    <option value="hero-slider">🖼️ Hero Slider</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Images Grid/List */}
        {filteredImages.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No images found</h3>
            <p className="text-slate-500 mb-6">
              {searchTerm ? 'Try adjusting your search or filters' : 'Upload your first images to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => document.getElementById('image-upload')?.click()}
                className="px-6 py-3 bg-gradient-to-r from-brand to-brand/90 text-white rounded-xl font-medium hover:from-brand/90 hover:to-brand/80 transition-all shadow-lg hover:shadow-xl"
              >
                Upload Images
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredImages.map((image) => (
                  <div
                    key={image.id}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200"
                  >
                    <div className="relative aspect-square bg-gradient-to-br from-slate-100 to-slate-200">
                      <img
                        src={image.url}
                        alt={image.altText || image.filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Category Badge */}
                      {image.category && (
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1.5 bg-gradient-to-r from-brand to-brand/90 text-white text-xs font-semibold rounded-full shadow-lg">
                            {image.category}
                          </span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedImage(image)}
                            className="p-2.5 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-all hover:scale-110 shadow-lg"
                            title="View"
                          >
                            <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => copyToClipboard(image.url)}
                            className="p-2.5 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-all hover:scale-110 shadow-lg"
                            title="Copy URL"
                          >
                            <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteImage(image.id)}
                            className="p-2.5 bg-red-500/90 backdrop-blur-sm rounded-xl hover:bg-red-500 transition-all hover:scale-110 shadow-lg"
                            title="Delete"
                          >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-4 bg-white">
                      <p className="text-sm font-semibold text-slate-900 truncate mb-2" title={image.originalName || image.filename}>
                        {image.originalName || image.filename}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center space-x-2">
                          {image.size && (
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0L8 8m4-4v12" />
                              </svg>
                              {formatFileSize(image.size)}
                            </span>
                          )}
                          {image.width && image.height && (
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 8l4-4m0 0L8 8m4-4v12m0 0h4m-4 0l-4-4" />
                              </svg>
                              {image.width}×{image.height}
                            </span>
                          )}
                        </div>
                        <span>{new Date(image.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Image
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Name & Info
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Size & Dimensions
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredImages.map((image) => (
                      <tr key={image.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative">
                            <img
                              src={image.url}
                              alt={image.altText || image.filename}
                              className="h-20 w-20 object-cover rounded-xl shadow-sm"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900 truncate max-w-xs">
                            {image.originalName || image.filename}
                          </div>
                          {image.caption && (
                            <div className="text-xs text-slate-500 truncate max-w-xs mt-1">{image.caption}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-brand to-brand/90 text-brand">
                            {image.category || 'general'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          <div>{image.size ? formatFileSize(image.size) : '-'}</div>
                          {image.width && image.height && (
                            <div className="text-xs">{image.width}×{image.height}px</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedImage(image)}
                              className="text-brand hover:text-brand font-medium"
                            >
                              View
                            </button>
                            <button
                              onClick={() => copyToClipboard(image.url)}
                              className="text-emerald-600 hover:text-emerald-900 font-medium"
                            >
                              Copy
                            </button>
                            <button
                              onClick={() => handleDeleteImage(image.id)}
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPage > 1 && (
              <div className="mt-8 flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-sm border border-slate-200">
                <div className="text-sm text-slate-600">
                  Showing <span className="font-semibold text-slate-900">{((currentPage - 1) * 20) + 1}</span> to{' '}
                  <span className="font-semibold text-slate-900">{Math.min(currentPage * 20, pagination.total)}</span> of{' '}
                  <span className="font-semibold text-slate-900">{pagination.total}</span> images
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={currentPage >= pagination.totalPage}
                    className="px-4 py-2 bg-gradient-to-r from-brand to-brand/90 text-white rounded-xl text-sm font-medium hover:from-brand/90 hover:to-brand/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Professional Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh] animate-scale-in">
            <img
              src={selectedImage.url}
              alt={selectedImage.altText || selectedImage.filename}
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            />

            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-4 -right-4 p-2 bg-white rounded-full shadow-lg hover:bg-slate-100 transition-all"
            >
              <svg className="w-6 h-6 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image Info Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent text-white p-6 rounded-b-2xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{selectedImage.originalName || selectedImage.filename}</h3>
                  {selectedImage.caption && (
                    <p className="text-sm text-slate-300 mb-2">{selectedImage.caption}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-slate-400">
                    {selectedImage.width && selectedImage.height && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 8l4-4m0 0L8 8m4-4v12m0 0h4m-4 0l-4-4" />
                        </svg>
                        {selectedImage.width}×{selectedImage.height}px
                      </span>
                    )}
                    {selectedImage.size && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0L8 8m4-4v12" />
                        </svg>
                        {formatFileSize(selectedImage.size)}
                      </span>
                    )}
                    <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
                      {selectedImage.category || 'general'}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(selectedImage.url);
                    }}
                    className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy URL
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(null);
                      handleDeleteImage(selectedImage.id);
                    }}
                    className="flex items-center px-4 py-2 bg-red-500/20 backdrop-blur-sm rounded-xl hover:bg-red-500/30 transition-all text-sm font-medium text-red-300"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

