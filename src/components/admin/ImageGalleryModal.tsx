'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { GalleryImage } from '@/types';
import { Search, Loader2, Image as ImageIcon, UploadCloud, Check, X } from 'lucide-react';

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selected: GalleryImage | GalleryImage[]) => void;
  multiple?: boolean;
  initialSelection?: string | string[]; // URLs of already selected images
  title?: string;
  themeColor?: 'indigo' | 'cyan' | 'green' | 'violet' | 'emerald' | 'brand';
}

export function ImageGalleryModal({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  initialSelection = [],
  title = 'Select Image',
  themeColor = 'brand'
}: ImageGalleryModalProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedImages, setSelectedImages] = useState<GalleryImage[]>([]);

  // Theme mapping
  const themes = {
    brand: {
      bg: 'bg-brand',
      hover: 'hover:bg-brand/90',
      border: 'border-brand',
      ring: 'ring-brand/20',
      text: 'text-brand'
    },
    indigo: {
      bg: 'bg-brand',
      hover: 'hover:bg-brand',
      border: 'border-brand',
      ring: 'ring-brand',
      text: 'text-brand'
    },
    cyan: {
      bg: 'bg-cyan-600',
      hover: 'hover:bg-cyan-700',
      border: 'border-cyan-500',
      ring: 'ring-cyan-200',
      text: 'text-cyan-600'
    },
    green: {
      bg: 'bg-green-600',
      hover: 'hover:bg-green-700',
      border: 'border-green-500',
      ring: 'ring-green-200',
      text: 'text-green-600'
    },
    violet: {
      bg: 'bg-violet-600',
      hover: 'hover:bg-violet-700',
      border: 'border-violet-500',
      ring: 'ring-violet-200',
      text: 'text-violet-600'
    },
    emerald: {
      bg: 'bg-emerald-600',
      hover: 'hover:bg-emerald-700',
      border: 'border-emerald-500',
      ring: 'ring-emerald-200',
      text: 'text-emerald-600'
    }
  };

  const theme = themes[themeColor] || themes.indigo;

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen]);

  useEffect(() => {
    // When images are loaded, set initial selection based on URLs
    if (images.length > 0 && initialSelection) {
      const initialUrls = Array.isArray(initialSelection) ? initialSelection : [initialSelection];
      const initialSelected = images.filter(img => initialUrls.includes(img.url));
      setSelectedImages(initialSelected);
    }
  }, [images, initialSelection]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await api.get('/gallery?limit=100');
      setImages(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch gallery images:', error);
    } finally {
      setLoading(false);
    }
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
      formData.append('category', 'products');

      await api.post('/gallery/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Refresh and reset upload input
      await fetchImages();
    } catch (error) {
      console.error('Failed to upload images:', error);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const toggleImageSelection = (image: GalleryImage) => {
    if (multiple) {
      setSelectedImages(prev => {
        const isSelected = prev.some(img => img.id === image.id);
        if (isSelected) {
          return prev.filter(img => img.id !== image.id);
        } else {
          return [...prev, image];
        }
      });
    } else {
      setSelectedImages([image]);
      onSelect(image);
      onClose();
    }
  };

  const handleConfirm = () => {
    if (multiple) {
      onSelect(selectedImages);
    } else if (selectedImages.length > 0) {
      onSelect(selectedImages[0]);
    }
    onClose();
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = (image.originalName || image.filename || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || image.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">
              {multiple ? `Select one or more images (${selectedImages.length} selected)` : 'Choose an image from your gallery'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-6 border-b border-slate-200 space-y-4 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all text-sm shadow-sm"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent transition-all text-sm font-medium shadow-sm min-w-[140px]"
              >
                <option value="">All Categories</option>
                <option value="products">Products</option>
                <option value="general">General</option>
                <option value="banner">Banner</option>
              </select>
              
              <label className="cursor-pointer">
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                <div className={`flex items-center gap-2 h-[42px] px-6 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                  uploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : `${theme.bg} text-white ${theme.hover} active:scale-95`
                }`}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  {uploading ? 'Uploading...' : 'Upload'}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-brand" />
              <p className="text-slate-500 font-medium">Loading gallery...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-slate-600 font-bold text-lg">No images found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your search or upload a new image</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredImages.map((image) => {
                const isSelected = selectedImages.some(img => img.id === image.id);
                return (
                  <div
                    key={image.id}
                    onClick={() => toggleImageSelection(image)}
                    className={`relative group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 bg-white ${
                      isSelected ? `${theme.border} ring-4 ${theme.ring} shadow-lg scale-[1.02]` : 'border-slate-200 hover:border-slate-300 hover:shadow-xl hover:-translate-y-1'
                    }`}
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <img src={image.url} alt={image.originalName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      
                      {/* Selection Overlay */}
                      <div className={`absolute inset-0 transition-opacity duration-300 ${isSelected ? 'bg-black/10' : 'bg-black/40 opacity-0 group-hover:opacity-100'} flex items-center justify-center`}>
                        {!isSelected && <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">Click to Select</span>}
                      </div>

                      {/* Checkmark */}
                      {isSelected && (
                        <div className={`absolute top-3 right-3 w-7 h-7 ${theme.bg} rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-in zoom-in duration-300`}>
                          <Check className="w-4 h-4 text-white stroke-[3px]" />
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-white">
                      <p className="text-xs font-semibold text-slate-700 truncate">{image.originalName || image.filename}</p>
                      {image.size && <p className="text-[10px] text-slate-400 mt-0.5">{(image.size / 1024).toFixed(1)} KB</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {multiple && (
          <div className="p-6 border-t border-slate-200 flex items-center justify-between bg-white shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${theme.bg} text-white`}>
                {selectedImages.length}
              </div>
              <span className="text-sm font-medium text-slate-600">Images Selected</span>
            </div>
            <div className="flex space-x-3">
              <button onClick={onClose} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedImages.length === 0}
                className={`px-8 py-2.5 ${theme.bg} text-white rounded-xl text-sm font-bold ${theme.hover} transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
              >
                Confirm Selection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageGalleryModal;

