'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/admin/modal';
import api from '@/lib/api';
import { Search, Loader2, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
  created_at: string;
}

interface Pagination {
  total: number;
  page: string;
  limit: string;
  totalPage: number;
}

interface MediaLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

export function MediaLibraryModal({ open, onOpenChange, onSelect }: MediaLibraryModalProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: '1',
    limit: '20',
    totalPage: 1,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchImages();
    }
  }, [open, currentPage, searchTerm]);

  // Debounced fetch
  const fetchImages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '24',
      });
      if (searchTerm) params.append('search', searchTerm); // Assuming backend supports search param

      const response = await api.get(`/gallery?${params}`);
      setImages(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (image: GalleryImage) => {
    onSelect(image.url);
    onOpenChange(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }
      formData.append('category', 'general');

      await api.post('/gallery/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Refresh gallery after upload
      setCurrentPage(1);
      await fetchImages();
    } catch (error) {
      console.error('Failed to upload images:', error);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Select Media"
      description="Choose an image from your gallery"
      className="max-w-5xl"
    >
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search images..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-10"
            />
          </div>
          
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
            <div className={`flex items-center gap-2 h-10 px-4 rounded-md font-medium text-sm transition-colors ${
              uploading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                : 'bg-brand text-white hover:bg-brand/90 shadow-sm'
            }`}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              {uploading ? 'Uploading...' : 'Upload'}
            </div>
          </label>
        </div>

        {/* Content */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 h-[50vh] overflow-y-auto">
          {loading && images.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand" />
            </div>
          ) : images.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <ImageIcon className="w-12 h-12 opacity-20" />
              <p>No images found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => handleSelect(img)}
                  className="group relative aspect-square bg-white rounded-lg border border-slate-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-brand hover:border-transparent transition-all"
                >
                  <img
                    src={img.url}
                    alt={img.originalName || img.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-center text-xs text-white truncate">
                    {img.originalName || img.filename}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {pagination.totalPage > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-sm text-slate-500">
              Showing {images.length} of {pagination.total} images
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= pagination.totalPage || loading}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
