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
  Clock,
  Play,
  Search,
  RefreshCw,
  Zap,
  CheckCircle2,
  XCircle as XCircleIcon,
} from 'lucide-react';

interface EmailTemplate {
  id: number;
  name: string;
  slug: string;
  subject: string;
  status: 'active' | 'inactive';
}

interface EmailAutomationRule {
  id: number;
  name: string;
  trigger_event: 'order_placed' | 'order_shipped' | 'order_delivered' | 'order_cancelled' | 'order_confirmed' | 'abandoned_cart' | 'customer_registered' | 'low_stock' | 'payment_received';
  template_id: number;
  template?: EmailTemplate;
  delay_minutes: number;
  status: 'active' | 'inactive';
  conditions?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

const TRIGGER_EVENTS = [
  { value: 'order_placed', label: 'Order Placed', description: 'When a new order is created' },
  { value: 'order_confirmed', label: 'Order Confirmed', description: 'When an order is confirmed' },
  { value: 'order_shipped', label: 'Order Shipped', description: 'When an order is shipped' },
  { value: 'order_delivered', label: 'Order Delivered', description: 'When an order is delivered' },
  { value: 'order_cancelled', label: 'Order Cancelled', description: 'When an order is cancelled' },
  { value: 'payment_received', label: 'Payment Received', description: 'When a payment is received' },
  { value: 'customer_registered', label: 'Customer Registered', description: 'When a new customer registers' },
  { value: 'abandoned_cart', label: 'Abandoned Cart', description: 'When a cart is abandoned' },
  { value: 'low_stock', label: 'Low Stock', description: 'When product stock is low' },
] as const;

export default function EmailRulesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [rules, setRules] = useState<EmailAutomationRule[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<EmailAutomationRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [testingRule, setTestingRule] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: '',
    trigger_event: 'order_placed' as EmailAutomationRule['trigger_event'],
    template_id: '',
    delay_minutes: 0,
    status: 'active' as 'active' | 'inactive',
    conditions: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/admin/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRules();
      fetchTemplates();
    }
  }, [isAuthenticated]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/email/rules');
      setRules(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch rules:', err);
      toast.error('Failed to load automation rules');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const res = await api.get('/email/templates');
      setTemplates(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.template_id) {
      toast.error('Name and template are required');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        trigger_event: form.trigger_event,
        template_id: parseInt(form.template_id as string),
        delay_minutes: parseInt(form.delay_minutes as unknown as string) || 0,
        status: form.status,
        conditions: form.conditions ? JSON.parse(form.conditions) : undefined,
      };
      if (editingRule) {
        await api.put(`/email/rules/${editingRule.id}`, payload);
        toast.success('Rule updated');
      } else {
        await api.post('/email/rules', payload);
        toast.success('Rule created');
      }
      setShowModal(false);
      setEditingRule(null);
      resetForm();
      fetchRules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this automation rule?')) return;
    try {
      await api.delete(`/email/rules/${id}`);
      toast.success('Rule deleted');
      fetchRules();
    } catch (err: any) {
      toast.error('Failed to delete rule');
    }
  };

  const handleTest = async (ruleId: number) => {
    const email = prompt('Enter email address to send test email:');
    if (!email || !email.trim()) {
      toast.error('Email address is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    try {
      setTestingRule(ruleId);
      await api.post(`/email/rules/${ruleId}/test`, { to: email.trim() });
      toast.success(`Test email sent to ${email}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send test email');
    } finally {
      setTestingRule(null);
    }
  };

  const openEdit = (rule: EmailAutomationRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name || '',
      trigger_event: rule.trigger_event,
      template_id: rule.template_id?.toString() || '',
      delay_minutes: rule.delay_minutes || 0,
      status: rule.status,
      conditions: rule.conditions ? JSON.stringify(rule.conditions, null, 2) : '',
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingRule(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      name: '',
      trigger_event: 'order_placed',
      template_id: '',
      delay_minutes: 0,
      status: 'active',
      conditions: '',
    });
  };

  const getTriggerInfo = (event: EmailAutomationRule['trigger_event']) => {
    return TRIGGER_EVENTS.find(e => e.value === event) || TRIGGER_EVENTS[0];
  };

  const filtered = rules.filter((rule) => {
    const matchSearch =
      !searchTerm ||
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTriggerInfo(rule.trigger_event).label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || rule.status === statusFilter;
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

  const activeCount = rules.filter((r) => r.status === 'active').length;
  const inactiveCount = rules.length - activeCount;

  return (
    <AdminLayout title="Email Automation Rules" subtitle="Manage automated email triggers and rules">
      <div className="w-full">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Rules</p>
                <p className="text-2xl font-bold text-slate-900">{rules.length}</p>
              </div>
              <div className="bg-blue-600 p-3 rounded-xl text-white"><Zap size={20} /></div>
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
        </div>

        {/* Rules Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Automation Rules</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search rules..."
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
                  onClick={fetchRules}
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
                  New Rule
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Rule</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Trigger Event</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Template</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Delay</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <Zap size={40} className="mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">{searchTerm ? 'No matching rules' : 'No automation rules yet'}</p>
                      <p className="text-sm">{searchTerm ? 'Try adjusting your search' : 'Create your first automation rule to get started'}</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((rule) => {
                    const triggerInfo = getTriggerInfo(rule.trigger_event);
                    return (
                      <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{rule.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-700">{triggerInfo.label}</p>
                            <p className="text-xs text-slate-500">{triggerInfo.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {rule.template ? (
                            <div>
                              <p className="text-sm text-slate-700">{rule.template.name}</p>
                              <code className="text-xs text-slate-500">{rule.template.slug}</code>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400 italic">No template</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Clock size={14} />
                            {rule.delay_minutes > 0 ? `${rule.delay_minutes} min` : 'Immediate'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                            rule.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {rule.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleTest(rule.id)}
                              disabled={testingRule === rule.id}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors disabled:opacity-50"
                              title="Send test email"
                            >
                              {testingRule === rule.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" /> : <Play size={15} />}
                            </button>
                            <button
                              onClick={() => openEdit(rule)}
                              className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(rule.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-lg font-semibold text-slate-900">
                  {editingRule ? 'Edit Automation Rule' : 'New Automation Rule'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Rule Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Send order confirmation email"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Trigger Event</label>
                  <select
                    value={form.trigger_event}
                    onChange={(e) => setForm({ ...form, trigger_event: e.target.value as EmailAutomationRule['trigger_event'] })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {TRIGGER_EVENTS.map((event) => (
                      <option key={event.value} value={event.value}>
                        {event.label} - {event.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Template</label>
                  {loadingTemplates ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
                      Loading templates...
                    </div>
                  ) : (
                    <select
                      value={form.template_id}
                      onChange={(e) => setForm({ ...form, template_id: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select a template...</option>
                      {templates.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name} ({tpl.slug}) {tpl.status === 'inactive' ? '- Inactive' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Delay (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.delay_minutes}
                    onChange={(e) => setForm({ ...form, delay_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-400 mt-1">How long to wait after the trigger event before sending the email. Set to 0 for immediate sending.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Conditions (JSON - optional)</label>
                  <textarea
                    value={form.conditions}
                    onChange={(e) => setForm({ ...form, conditions: e.target.value })}
                    placeholder='{"min_order_amount": 100}'
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                  />
                  <p className="text-xs text-slate-400 mt-1">Optional conditions for when this rule should apply (JSON format)</p>
                </div>

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

              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim() || !form.template_id}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
                >
                  {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : null}
                  {editingRule ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
