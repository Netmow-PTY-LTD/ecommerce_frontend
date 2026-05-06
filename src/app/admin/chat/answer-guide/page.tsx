'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/admin-layout';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  XCircle,
  Bot,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  BookOpen,
  Search,
} from 'lucide-react';

interface ChatFAQ {
  id: number;
  question: string;
  answer: string;
  keywords: string[];
  category: string;
  status: 'active' | 'inactive';
  created_at: string;
}

interface AIStatus {
  configured: boolean;
  model: string | null;
  provider: string | null;
}

export default function AnswerGuidePage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [faqs, setFaqs] = useState<ChatFAQ[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [testingAI, setTestingAI] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // FAQ form
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<ChatFAQ | null>(null);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    keywords: '',
    category: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/admin/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFaqs();
      fetchAIStatus();
    }
  }, [isAuthenticated]);

  const fetchFaqs = async () => {
    try {
      setLoadingFaqs(true);
      const res = await api.get('/chat/admin/faqs');
      setFaqs(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch FAQs:', err);
    } finally {
      setLoadingFaqs(false);
    }
  };

  const fetchAIStatus = async () => {
    try {
      const res = await api.get('/chat/admin/ai/status');
      setAiStatus(res.data.data);
    } catch (err) {
      console.error('Failed to fetch AI status:', err);
    }
  };

  const handleTestAI = async () => {
    try {
      setTestingAI(true);
      setAiTestResult(null);
      const res = await api.post('/chat/admin/ai/test');
      setAiTestResult(res.data.data);
    } catch (err: any) {
      setAiTestResult({ success: false, error: err.response?.data?.message || err.message });
    } finally {
      setTestingAI(false);
    }
  };

  // FAQ CRUD
  const handleSaveFaq = async () => {
    try {
      const payload = {
        question: faqForm.question.trim(),
        answer: faqForm.answer.trim(),
        keywords: faqForm.keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        category: faqForm.category.trim(),
        status: faqForm.status,
      };
      if (editingFaq) {
        await api.put(`/chat/admin/faqs/${editingFaq.id}`, payload);
        toast.success('Answer guide updated');
      } else {
        await api.post('/chat/admin/faqs', payload);
        toast.success('Answer guide created');
      }
      setShowFaqModal(false);
      setEditingFaq(null);
      resetFaqForm();
      fetchFaqs();
    } catch (err: any) {
      console.error('Failed to save FAQ:', err);
      toast.error(err.response?.data?.message || 'Failed to save answer guide');
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm('Delete this answer guide entry?')) return;
    try {
      await api.delete(`/chat/admin/faqs/${id}`);
      fetchFaqs();
    } catch (err) {
      console.error('Failed to delete FAQ:', err);
    }
  };

  const parseKeywords = (raw: any): string[] => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; }
      catch { return raw.split(',').map((k: string) => k.trim()).filter(Boolean); }
    }
    return [];
  };

  const openEditFaq = (faq: ChatFAQ) => {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question || '',
      answer: faq.answer || '',
      keywords: parseKeywords(faq.keywords).join(', '),
      category: faq.category || '',
      status: faq.status,
    });
    setShowFaqModal(true);
  };

  const resetFaqForm = () => {
    setFaqForm({ question: '', answer: '', keywords: '', category: '', status: 'active' });
  };

  // Derived data
  const categories = [...new Set(faqs.map((f) => f.category).filter(Boolean))];
  const filteredFaqs = faqs.filter((faq) => {
    const matchSearch = !searchTerm ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(faq.keywords) ? faq.keywords : []).some((k: string) => k.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCategory = !categoryFilter || faq.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <AdminLayout title="Answer Guide" subtitle="Configure AI knowledge base and auto-reply patterns">
      <div className="w-full">
        {/* AI Status Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">AI Chat Engine</h3>
                <div className="flex items-center gap-2 mt-1">
                  {aiStatus?.configured ? (
                    <>
                      <CheckCircle2 size={14} className="text-green-600" />
                      <span className="text-sm text-green-700 font-medium">Connected</span>
                      <span className="text-xs text-slate-500">
                        &middot; {aiStatus.provider} &middot; {aiStatus.model}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} className="text-amber-600" />
                      <span className="text-sm text-amber-700 font-medium">Not configured</span>
                      <span className="text-xs text-slate-500">
                        &middot; Set AI_API_KEY in .env to enable AI responses
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {aiTestResult && (
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                  aiTestResult.success
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {aiTestResult.success ? 'Test passed' : 'Test failed'}
                </span>
              )}
              <button
                onClick={handleTestAI}
                disabled={testingAI || !aiStatus?.configured}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {testingAI ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Zap size={16} />
                )}
                Test AI
              </button>
              <button
                onClick={() => { fetchAIStatus(); fetchFaqs(); }}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                title="Refresh"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600"><BookOpen size={14} /></div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Knowledge Base</p>
                  <p className="text-xs text-slate-500">FAQs below serve as AI context for generating answers</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600"><Sparkles size={14} /></div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">AI Generates</p>
                  <p className="text-xs text-slate-500">Natural, contextual replies based on your knowledge base</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <div className="p-1.5 rounded-lg bg-green-100 text-green-600"><AlertCircle size={14} /></div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Fallback</p>
                  <p className="text-xs text-slate-500">Keyword matching used when AI is unavailable</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Guides</p>
                <p className="text-2xl font-bold text-slate-900">{faqs.length}</p>
              </div>
              <div className="bg-blue-600 p-3 rounded-xl text-white"><BookOpen size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{faqs.filter((f) => f.status === 'active').length}</p>
              </div>
              <div className="bg-green-600 p-3 rounded-xl text-white"><CheckCircle2 size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Categories</p>
                <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
              </div>
              <div className="bg-indigo-600 p-3 rounded-xl text-white"><Search size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">AI Engine</p>
                <p className="text-lg font-bold text-purple-600">{aiStatus?.configured ? 'Active' : 'Setup Required'}</p>
              </div>
              <div className="bg-purple-600 p-3 rounded-xl text-white"><Sparkles size={20} /></div>
            </div>
          </div>
        </div>

        {/* FAQ Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Knowledge Base</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search guides..."
                    className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-48"
                  />
                </div>
                {categories.length > 0 && (
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => { resetFaqForm(); setEditingFaq(null); setShowFaqModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <Plus size={16} />
                  Add Guide
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Question / Trigger</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Answer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Keywords</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loadingFaqs ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
                    </td>
                  </tr>
                ) : filteredFaqs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <BookOpen size={40} className="mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">{searchTerm || categoryFilter ? 'No matching guides' : 'No answer guides yet'}</p>
                      <p className="text-sm">{searchTerm || categoryFilter ? 'Try adjusting your filters' : 'Add guides to power AI chat responses'}</p>
                    </td>
                  </tr>
                ) : (
                  filteredFaqs.map((faq) => (
                    <tr key={faq.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-sm font-medium text-slate-900 truncate">{faq.question}</p>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <p className="text-sm text-slate-600 line-clamp-2">{faq.answer}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                          {faq.category || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {((Array.isArray(faq.keywords) ? faq.keywords : [])).slice(0, 3).map((kw: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded-full">
                              {kw}
                            </span>
                          ))}
                          {(Array.isArray(faq.keywords) ? faq.keywords : []).length > 3 && (
                            <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-500 rounded-full">
                              +{(faq.keywords as string[]).length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                          faq.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {faq.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditFaq(faq)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteFaq(faq.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Modal */}
        {showFaqModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  {editingFaq ? 'Edit Answer Guide' : 'Add Answer Guide'}
                </h3>
                <button onClick={() => setShowFaqModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                  <XCircle size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Question / Trigger Phrase</label>
                  <input
                    value={faqForm.question}
                    onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                    placeholder="e.g. How do I track my order?"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-400 mt-1">This is the main question the AI will learn to answer</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Answer</label>
                  <textarea
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                    placeholder="The answer the AI will use as context when responding to similar questions..."
                    rows={5}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">AI will use this as reference to generate natural responses</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Keywords (comma-separated)</label>
                  <input
                    value={faqForm.keywords}
                    onChange={(e) => setFaqForm({ ...faqForm, keywords: e.target.value })}
                    placeholder="e.g. track, order, shipping, delivery, where is my order"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-400 mt-1">Used for fallback matching when AI is not configured</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                    <input
                      value={faqForm.category}
                      onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                      placeholder="e.g. Shipping, Returns, Payment"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                    <select
                      value={faqForm.status}
                      onChange={(e) => setFaqForm({ ...faqForm, status: e.target.value as 'active' | 'inactive' })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowFaqModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFaq}
                  disabled={!faqForm.question.trim() || !faqForm.answer.trim()}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {editingFaq ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
