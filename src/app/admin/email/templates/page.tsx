'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/admin-layout';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { toast } from 'sonner';
import { Info, HelpCircle } from 'lucide-react';
import {
  TRIGGER_EVENT_VARIABLES,
  TRIGGER_EVENT_LABELS,
  getSampleDataForTrigger,
  DEFAULT_TEMPLATE_SLUGS
} from '@/lib/email-system-guide';
import {
  Plus,
  Pencil,
  Trash2,
  XCircle,
  Mail,
  Eye,
  Code,
  Send,
  FileText,
  CheckCircle2,
  XCircle as XCircleIcon,
  Search,
  RefreshCw,
  Copy,
  Copy as Duplicate,
} from 'lucide-react';

interface EmailTemplate {
  id: number;
  name: string;
  slug: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export default function EmailTemplatesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    subject: '',
    body_html: '',
    body_text: '',
    variables: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/admin/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) fetchTemplates();
  }, [isAuthenticated]);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const res = await api.get('/email/templates');
      setTemplates(res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      toast.error('Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim() || !form.subject.trim()) {
      toast.error('Name, slug, and subject are required');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
        subject: form.subject.trim(),
        body_html: form.body_html,
        body_text: form.body_text,
        variables: form.variables
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
        status: form.status,
      };
      if (editingTemplate) {
        await api.put(`/email/templates/${editingTemplate.id}`, payload);
        toast.success('Template updated');
      } else {
        await api.post('/email/templates', payload);
        toast.success('Template created');
      }
      setShowModal(false);
      setEditingTemplate(null);
      resetForm();
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    setTemplateToDelete(id);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;
    try {
      setDeleting(true);
      await api.delete(`/email/templates/${templateToDelete}`);
      toast.success('Template deleted');
      fetchTemplates();
      setDeleteModal(false);
      setTemplateToDelete(null);
    } catch (err: any) {
      toast.error('Failed to delete template');
      setDeleting(false);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await api.post(`/email/templates/${id}/duplicate`);
      toast.success('Template duplicated');
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to duplicate template');
    }
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      toast.error('Enter an email address');
      return;
    }
    try {
      setSendingTest(true);
      await api.post('/email/test', { to: testEmail.trim() });
      toast.success(`Test email sent to ${testEmail}`);
      setTestEmail('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  const openEdit = (tpl: EmailTemplate) => {
    setEditingTemplate(tpl);
    setForm({
      name: tpl.name || '',
      slug: tpl.slug || '',
      subject: tpl.subject || '',
      body_html: tpl.body_html || '',
      body_text: tpl.body_text || '',
      variables: Array.isArray(tpl.variables)
        ? (tpl.variables as string[]).join(', ')
        : typeof tpl.variables === 'string'
          ? (() => { try { return JSON.parse(tpl.variables).join(', '); } catch { return String(tpl.variables); } })()
          : '',
      status: tpl.status,
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingTemplate(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({ name: '', slug: '', subject: '', body_html: '', body_text: '', variables: '', status: 'active' });
  };

  const openPreview = (tpl: EmailTemplate) => {
    setPreviewTemplate(tpl);
    setShowPreview(true);
  };

  const copySlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    toast.success('Slug copied!');
  };

  // Function to substitute variables with sample data for preview
  const substituteVariables = (text: string, templateVars: string[]) => {
    if (!text) return '';
    let result = text;
    templateVars.forEach(v => {
      const sampleValues: Record<string, string> = {
        customer_name: 'John Doe',
        order_number: 'ORD-1234567890-123',
        total: '99.99',
        currency: 'USD',
        order_date: new Date().toLocaleDateString(),
        order_status: 'Confirmed',
        product_name: 'Sample Product',
        tracking_number: '1Z999AA10123456784',
        estimated_delivery: '2026-05-20',
        carrier: 'FedEx',
        delivery_date: new Date().toLocaleDateString(),
        payment_amount: '99.99',
        payment_method: 'Credit Card',
        payment_date: new Date().toLocaleDateString(),
        reason: 'Out of stock',
        name: 'John Doe',
        email: 'john@example.com',
        shop_url: 'https://example.com/shop',
        cart_url: 'https://example.com/cart/abc123',
        item_count: '3',
        product_name: 'Awesome Product',
        current_stock: '5',
        sku: 'PROD-123',
        store_name: 'Your Store',
      };
      result = result.replace(new RegExp(`\\{\\{\\s*${v}\\s*\\}\\}`, 'g'), sampleValues[v] || `{{${v}}}`);
    });
    return result;
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: !editingTemplate ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : prev.slug,
    }));
  };

  // Filtered templates
  const filtered = templates.filter((tpl) => {
    const matchSearch =
      !searchTerm ||
      tpl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tpl.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tpl.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || tpl.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const activeCount = templates.filter((t) => t.status === 'active').length;
  const inactiveCount = templates.length - activeCount;

  return (
    <AdminLayout title="Email Templates" subtitle="Manage email templates for automated communications">
      <div className="w-full">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Templates</p>
                <p className="text-2xl font-bold text-slate-900">{templates.length}</p>
              </div>
              <div className="bg-blue-600 p-3 rounded-xl text-white"><Mail size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <div className="bg-green-600 p-3 rounded-xl text-white"><CheckCircle2 size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Inactive</p>
                <p className="text-2xl font-bold text-slate-500">{inactiveCount}</p>
              </div>
              <div className="bg-slate-400 p-3 rounded-xl text-white"><XCircleIcon size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Test Email</p>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="text-sm border border-slate-200 rounded-lg px-2 py-1 w-36 focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendTest()}
                  />
                  <button
                    onClick={handleSendTest}
                    disabled={sendingTest}
                    className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    title="Send test email"
                  >
                    {sendingTest ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Send size={14} />}
                  </button>
                </div>
              </div>
              <div className="bg-indigo-600 p-3 rounded-xl text-white"><Send size={20} /></div>
            </div>
          </div>
        </div>

        {/* Templates Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Email Templates</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search templates..."
                    className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-48"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button
                  onClick={fetchTemplates}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                  title="Refresh"
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <Plus size={16} />
                  New Template
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Template</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Variables</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loadingTemplates ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <Mail size={40} className="mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">{searchTerm ? 'No matching templates' : 'No email templates yet'}</p>
                      <p className="text-sm">{searchTerm ? 'Try adjusting your search' : 'Create your first email template to get started'}</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((tpl) => (
                    <tr key={tpl.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{tpl.name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <code className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono">{tpl.slug}</code>
                            <button onClick={() => copySlug(tpl.slug)} className="text-slate-400 hover:text-indigo-600" title="Copy slug">
                              <Copy size={12} />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 max-w-xs truncate">{tpl.subject}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(tpl.variables) ? tpl.variables : []).slice(0, 4).map((v: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 text-xs bg-amber-50 text-amber-700 rounded-full font-mono">
                              {'{{'}{v}{'}}'}
                            </span>
                          ))}
                          {(Array.isArray(tpl.variables) ? tpl.variables : []).length > 4 && (
                            <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-500 rounded-full">
                              +{(tpl.variables as string[]).length - 4}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                          tpl.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {tpl.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500">
                          {new Date(tpl.updated_at || tpl.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openPreview(tpl)}
                            className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
                            title="Preview"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => openEdit(tpl)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDuplicate(tpl.id)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                            title="Duplicate"
                          >
                            <Duplicate size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(tpl.id)}
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

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-lg font-semibold text-slate-900">
                  {editingTemplate ? 'Edit Template' : 'New Email Template'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Template Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Order Confirmation"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Slug</label>
                    <input
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      placeholder="e.g. order-confirmation"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-400 mt-1">Unique identifier used by automation rules</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Subject</label>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Your order #{{order_number}} has been confirmed!"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-400 mt-1">Use {'{{variable}}'} syntax for dynamic values</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <span className="flex items-center gap-1.5"><Code size={14} /> HTML Body</span>
                  </label>
                  <textarea
                    value={form.body_html}
                    onChange={(e) => setForm({ ...form, body_html: e.target.value })}
                    placeholder={`<h1 Hello customer_name,</h1>\n<p>Thank you for your order #order_number!</p>\n<p>Total: $order_total</p>`}
                    rows={12}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <span className="flex items-center gap-1.5"><FileText size={14} /> Plain Text Body (optional)</span>
                  </label>
                  <textarea
                    value={form.body_text}
                    onChange={(e) => setForm({ ...form, body_text: e.target.value })}
                    placeholder="Plain text version for email clients that don't support HTML..."
                    rows={4}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Template Variables (comma-separated)</label>
                  <input
                    value={form.variables}
                    onChange={(e) => setForm({ ...form, variables: e.target.value })}
                    placeholder="e.g. customer_name, order_number, order_total, order_date"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-400 mt-1">These variables can be used in subject and body as {'{{variable_name}}'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Email System Guide */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <HelpCircle size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Email System Guide</p>
                      <p className="text-xs text-blue-700 mb-3">
                        Templates use {'{{variable}}'} syntax. Available variables depend on which trigger event you're targeting.
                      </p>

                      <div className="mb-3">
                        <p className="text-xs font-semibold text-blue-800 mb-1.5">📧 Recommended Template Slugs:</p>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div className="bg-white/70 rounded px-2 py-1">
                            <span className="font-mono">order-confirmation</span> → Order Placed/Confirmed
                          </div>
                          <div className="bg-white/70 rounded px-2 py-1">
                            <span className="font-mono">order-shipped</span> → Order Shipped
                          </div>
                          <div className="bg-white/70 rounded px-2 py-1">
                            <span className="font-mono">order-delivered</span> → Order Delivered
                          </div>
                          <div className="bg-white/70 rounded px-2 py-1">
                            <span className="font-mono">order-cancelled</span> → Order Cancelled
                          </div>
                          <div className="bg-white/70 rounded px-2 py-1">
                            <span className="font-mono">payment-received</span> → Payment Received
                          </div>
                          <div className="bg-white/70 rounded px-2 py-1">
                            <span className="font-mono">welcome-email</span> → Customer Registered
                          </div>
                        </div>
                      </div>

                      <details className="group">
                        <summary className="cursor-pointer text-xs font-semibold text-blue-800 hover:text-blue-900 flex items-center gap-1">
                          <Info size={12} />
                          Click to see all available variables by trigger event
                        </summary>
                        <div className="mt-3 space-y-3 text-xs">
                          {Object.entries(TRIGGER_EVENT_VARIABLES).map(([event, vars]) => (
                            <div key={event} className="bg-white rounded-lg p-3">
                              <p className="font-semibold text-slate-900 mb-2">{TRIGGER_EVENT_LABELS[event] || event}</p>
                              <div className="grid grid-cols-1 gap-1">
                                {vars.map((v) => (
                                  <div key={v.name} className="flex items-start gap-2">
                                    <code className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-mono text-xs">
                                      {'{{'}{v.name}{'}}'}
                                    </code>
                                    <div className="flex-1">
                                      <span className="text-slate-700">{v.description}</span>
                                      {v.required && <span className="text-red-600 ml-1">*</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>

                      <p className="text-xs text-blue-600 mt-2">
                        💡 <strong>Tip:</strong> Use these exact variable names in your template. Variables marked with * are required.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim() || !form.slug.trim() || !form.subject.trim()}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
                >
                  {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : null}
                  {editingTemplate ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && previewTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{previewTemplate.name}</h3>
                  <p className="text-xs text-slate-500">Slug: {previewTemplate.slug}</p>
                </div>
                <button onClick={() => setShowPreview(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Subject (with sample data)</label>
                  <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-800 border border-slate-200">
                    {substituteVariables(previewTemplate.subject, Array.isArray(previewTemplate.variables) ? previewTemplate.variables : [])}
                  </div>
                </div>

                {/* HTML Preview */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                    <span className="flex items-center gap-2">
                      HTML Body Preview (with sample data substitution)
                    </span>
                  </label>
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-400" />
                        <span className="w-3 h-3 rounded-full bg-yellow-400" />
                        <span className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <span className="text-xs text-slate-400">Email Preview with Sample Data</span>
                      <div className="text-xs text-blue-600 ml-2">
                        Variables shown with sample values for preview
                      </div>
                    </div>
                    <div className="p-4 min-h-[200px]">
                      {previewTemplate.body_html ? (
                        <div dangerouslySetInnerHTML={{
                          __html: substituteVariables(previewTemplate.body_html, Array.isArray(previewTemplate.variables) ? previewTemplate.variables : [])
                        }} />
                      ) : (
                        <p className="text-sm text-slate-400 italic">No HTML content</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Plain Text */}
                {previewTemplate.body_text && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Plain Text (with sample data)</label>
                    <pre className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 border border-slate-200 whitespace-pre-wrap font-mono">
                      {substituteVariables(previewTemplate.body_text, Array.isArray(previewTemplate.variables) ? previewTemplate.variables : [])}
                    </pre>
                  </div>
                )}

                {/* Variables */}
                {(Array.isArray(previewTemplate.variables) ? previewTemplate.variables : []).length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Template Variables</label>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(previewTemplate.variables) ? previewTemplate.variables : []).map((v: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 rounded-lg font-mono border border-amber-200">
                          {'{{'}{v}{'}}'}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      💡 These variables will be replaced with actual data when emails are sent. Preview above shows sample values.
                    </p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => { openEdit(previewTemplate); setShowPreview(false); }}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModal}
          onClose={() => {
            setDeleteModal(false);
            setTemplateToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Email Template?"
          description="Are you sure you want to delete this email template? This action cannot be undone and will affect any automation rules using this template."
          confirmText="Delete"
          cancelText="Cancel"
          isLoading={deleting}
          variant="danger"
        />
      </div>
    </AdminLayout>
  );
}
