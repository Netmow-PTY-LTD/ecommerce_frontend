'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Loader2, Home, Clock } from 'lucide-react';
import Link from 'next/link';

interface PageData {
  id: number;
  title: string;
  slug: string;
  content: string;
  status: 'published' | 'draft';
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export default function PublicPagePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debug, setDebug] = useState<any>(null);

  useEffect(() => {
    fetchPage();
  }, [slug]);

  const fetchPage = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/public/pages/${slug}`);

      // Debug: Log full response
      console.log('🔍 API Response:', response);
      console.log('📦 Page Data:', response.data);

      // Remove global CSS reset that breaks the page
      let content = response.data.data.content;
      content = content.replace(/<style>[\s\S]*?<\/style>/g, ''); // Remove ALL style tags
      content = content.replace(/<!-- PAGE_BLOCKS:.*?-->/g, ''); // Remove HTML comment

      console.log('✨ Cleaned Content Length:', content.length);

      setDebug({
        ...response.data,
        cleanedContent: content.substring(0, 500) + '...' // Show first 500 chars
      });

      setPage({ ...response.data.data, content });
    } catch (err: any) {
      console.error('❌ API Error:', err);
      console.error('❌ Error Response:', err.response);

      setError(err.response?.data?.message || 'Page not found');
      setDebug({
        error: err.message,
        response: err.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  // Update meta tags
  useEffect(() => {
    if (page) {
      document.title = page.meta_title || `${page.title} - E-Commerce`;
      if (page.meta_description) {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute('content', page.meta_description);
        }
      }
    }
  }, [page]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Error or no page found - show Coming Soon
  if (error || !page) {
    const formattedSlug = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="text-center px-4 max-w-2xl mx-auto">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
              <Clock className="h-10 w-10 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {formattedSlug}
          </h1>
          <h2 className="text-2xl font-semibold text-indigo-600 mb-6">Coming Soon</h2>
          <p className="text-lg text-gray-600 mb-8">
            This page is under construction. We're working hard to bring you amazing content. Stay tuned!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                <Home className="h-4 w-4" />
                Back to Home
              </button>
            </Link>
            <Link href="/shop">
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                Browse Products
              </button>
            </Link>
          </div>

          {/* Debug Info */}
          {debug && (
            <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <h3 className="font-bold text-red-600 mb-2">🐛 Debug Info (Error):</h3>
              <pre className="text-xs text-red-800 overflow-auto max-h-64">
                {JSON.stringify(debug, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Page found - show dynamic content
  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{page.title}</h1>
        </div>
      </div>

      {/* Debug Info - Show at top for visibility */}
      {debug && (
        <div className="bg-blue-50 border-b-4 border-blue-500 py-4">
          <div className="container mx-auto px-4">
            <h3 className="font-bold text-blue-900 mb-2">🐛 Debug Info:</h3>
            <details className="cursor-pointer">
              <summary className="text-sm text-blue-700 font-semibold mb-2">Click to expand API response</summary>
              <pre className="text-xs text-blue-800 overflow-auto max-h-96 bg-white p-4 rounded border border-blue-200">
                {JSON.stringify(debug, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      {/* Content - Wrap PageBuilder content with proper spacing */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
