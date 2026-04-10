'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import AdminLayout from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, LayoutTemplate } from 'lucide-react';
import Link from 'next/link';
import PageBuilder from '@/components/admin/PageBuilder';

interface Section {
  id: number;
  title: string;
  slug: string;
  type: string;
  content: string;
  status: 'active' | 'inactive';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function EditSectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [section, setSection] = useState<Section | null>(null);
  const [loadingSection, setLoadingSection] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    type: 'custom' as string,
    content: '',
    status: 'inactive' as 'active' | 'inactive',
    sort_order: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSection();
    }
  }, [isAuthenticated, id]);

  const fetchSection = async () => {
    try {
      setLoadingSection(true);
      const response = await api.get(`/sections/${id}`);
      const sectionData = response.data.data;
      setSection(sectionData);
      setFormData({
        title: sectionData.title || '',
        slug: sectionData.slug || '',
        type: sectionData.type || 'custom',
        content: sectionData.content || '',
        status: sectionData.status || 'inactive',
        sort_order: sectionData.sort_order ?? 0,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load section');
    } finally {
      setLoadingSection(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'sort_order' ? parseInt(value) || 0 : value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.slug) newErrors.slug = 'Slug is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    setError('');

    try {
      await api.put(`/sections/${id}`, {
        title: formData.title,
        slug: formData.slug,
        type: formData.type,
        content: formData.content,
        status: formData.status,
        sort_order: formData.sort_order,
      });

      setSuccess('Section updated successfully!');
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update section');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContentChange = useCallback((html: string) => {
    setFormData(prev => ({ ...prev, content: html }));
    if (errors.content) {
      setErrors(prev => ({ ...prev, content: '' }));
    }
  }, [errors.content]);

  if (loading || loadingSection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!section) {
    return (
      <AdminLayout title="Section Not Found" subtitle="">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            {error || 'Section not found'}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={`Edit: ${section.title}`}
      subtitle="Update section content and settings"
      defaultSidebarCollapsed={true}
    >
      <div className="w-full py-4">
        {/* Back Button */}
        <div className="mb-4">
          <Link href="/admin/sections">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Sections
            </Button>
          </Link>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Hero Banner"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 text-gray-600 text-sm rounded-l-lg">
                    /section/
                  </span>
                  <Input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="hero-banner"
                    className={`rounded-l-none ${errors.slug ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
                <p className="text-xs text-gray-500 mt-1">The URL-friendly version of the title</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="banner">Banner</option>
                    <option value="featured">Featured</option>
                    <option value="promo">Promo</option>
                    <option value="gallery">Gallery</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="inactive">Inactive</option>
                    <option value="active">Active</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
                  <Input
                    type="number"
                    name="sort_order"
                    value={formData.sort_order}
                    onChange={handleChange}
                    min={0}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(section.created_at).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>{' '}
                  {new Date(section.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Content</h2>
              <Link href={`/admin/sections/content/${id}/edit`}>
                <Button type="button" size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md flex items-center gap-2 cursor-pointer">
                  <LayoutTemplate className="h-4 w-4" />
                  Full Screen Editor
                </Button>
              </Link>
            </div>
            <div className="p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Content
                </label>
                <PageBuilder
                  initialContent={formData.content}
                  onChange={handleContentChange}
                />
                {errors.content && <p className="text-red-500 text-sm mt-2">{errors.content}</p>}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link href="/admin/sections">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {submitting ? 'Updating...' : 'Update Section'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
