'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import AdminLayout from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import PageBuilder from '@/components/admin/PageBuilder';

interface Section {
  id: number;
  title: string;
  slug: string;
  content: string;
}

export default function EditSectionContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [section, setSection] = useState<Section | null>(null);
  const [loadingSection, setLoadingSection] = useState(true);
  const [content, setContent] = useState('');
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
      setContent(sectionData.content || '');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load section');
    } finally {
      setLoadingSection(false);
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.put(`/sections/${id}`, {
        content: content,
      });

      setSuccess('Content saved successfully!');
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save content');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContentChange = useCallback((html: string) => {
    setContent(html);
  }, []);

  if (loading || loadingSection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!section) {
    return (
      <AdminLayout title="Section Not Found" subtitle="">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            {error || 'Section not found'}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={`Design: ${section.title}`}
      subtitle="Visual Content Editor"
      defaultSidebarCollapsed={true}
    >
      <div className="h-[calc(100vh-105px)] flex flex-col gap-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <Link href={`/admin/sections/${id}/edit`}>
              <Button variant="ghost" size="sm" className="gap-2 cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                Section Settings
              </Button>
            </Link>
            <div className="h-6 w-px bg-slate-200" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest leading-none">
              Editing: <span className="text-slate-900">{section.title}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
            {success && <span className="text-xs text-green-500 font-medium">{success}</span>}
            <Button
              size="sm"
              className="px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200/50 transition-all font-bold cursor-pointer"
              onClick={handleSave}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-2" />
              )}
              Save Content
            </Button>
          </div>
        </div>

        {/* Builder Area */}
        <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm relative">
          <PageBuilder
            initialContent={content}
            onChange={handleContentChange}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
