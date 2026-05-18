'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/admin-layout';
import {
  MessageCircle,
  Send,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  User,
  Bot,
  Headphones,
  ChevronLeft,
  Filter,
  Sparkles,
} from 'lucide-react';

interface ChatSession {
  id: number;
  customer_id: number | null;
  guest_id: string | null;
  status: 'active' | 'escalated' | 'closed';
  channel: 'widget' | 'admin';
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}

interface ChatMessage {
  id: number;
  session_id: number;
  sender_type: 'customer' | 'bot' | 'admin';
  message: string;
  metadata: any;
  is_read: boolean;
  created_at: string;
}

export default function ChatsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);
  const [showDetail, setShowDetail] = useState(false);

  const [aiStatus, setAiStatus] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/admin/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
      fetchAIStatus();
    }
  }, [isAuthenticated, statusFilter]);

  const fetchAIStatus = async () => {
    try {
      const res = await api.get('/chat/admin/ai/status');
      setAiStatus(res.data.data);
    } catch (err) {
      console.error('Failed to fetch AI status:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/chat/admin/sessions?${params.toString()}`);
      setSessions(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchMessages = useCallback(async (sessionId: number) => {
    try {
      setLoadingMessages(true);
      const res = await api.get(`/chat/admin/sessions/${sessionId}`);
      const sessionData = res.data.data;
      setSelectedSession(sessionData);
      setMessages(sessionData?.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectSession = (session: ChatSession) => {
    fetchMessages(session.id);
    setShowDetail(true);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedSession || sendingReply) return;
    try {
      setSendingReply(true);
      await api.post(`/chat/admin/sessions/${selectedSession.id}/reply`, {
        message: replyText.trim(),
      });
      setReplyText('');
      fetchMessages(selectedSession.id);
      replyInputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleCloseSession = async (sessionId: number) => {
    try {
      await api.put(`/chat/admin/sessions/${sessionId}/close`);
      fetchSessions();
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
        setMessages([]);
        setShowDetail(false);
      }
    } catch (err) {
      console.error('Failed to close session:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'escalated': return 'bg-amber-100 text-amber-700';
      case 'closed': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 size={12} />;
      case 'escalated': return <AlertCircle size={12} />;
      case 'closed': return <XCircle size={12} />;
      default: return <Clock size={12} />;
    }
  };

  const getSenderStyle = (senderType: string) => {
    switch (senderType) {
      case 'admin': return 'bg-indigo-600 text-white ml-auto';
      case 'customer': return 'bg-slate-100 text-slate-900 mr-auto';
      case 'bot': return 'bg-emerald-50 text-emerald-900 border border-emerald-200 mr-auto';
      default: return 'bg-slate-100 text-slate-900';
    }
  };

  const getSenderLabel = (senderType: string) => {
    switch (senderType) {
      case 'admin': return 'You';
      case 'customer': return 'Customer';
      case 'bot': return 'AI Bot';
      default: return senderType;
    }
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'admin': return <Headphones size={12} />;
      case 'customer': return <User size={12} />;
      case 'bot': return <Sparkles size={12} />;
      default: return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const activeCount = sessions.filter((s) => s.status === 'active').length;
  const escalatedCount = sessions.filter((s) => s.status === 'escalated').length;

  const stats = [
    { label: 'Active Chats', value: activeCount, color: 'bg-green-600', icon: <MessageCircle size={20} /> },
    { label: 'Escalated', value: escalatedCount, color: 'bg-amber-600', icon: <AlertCircle size={20} /> },
    { label: 'Total Sessions', value: sessions.length, color: 'bg-blue-600', icon: <MessageCircle size={20} /> },
    { label: 'AI Powered', value: aiStatus?.configured ? 'Active' : 'Setup Required', color: 'bg-purple-600', icon: <Sparkles size={20} />, badge: false },
  ];

  return (
    <AdminLayout title="Chats" subtitle="Manage customer conversations with AI assistance">
      <div className="w-full">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">{stat.label}</p>
                  {stat.label === 'AI Powered' ? (
                    <p className={`text-lg font-bold ${aiStatus?.configured ? 'text-green-600' : 'text-amber-600'}`}>
                      {stat.value}
                    </p>
                  ) : stat.badge ? (
                    <p className="text-lg font-bold text-purple-600">Enabled</p>
                  ) : (
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  )}
                </div>
                <div className={`${stat.color} p-3 rounded-xl text-white`}>{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Panel */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden" style={{ height: 'calc(100vh - 340px)', minHeight: '500px' }}>
          <div className="flex h-full">
            {/* Session List */}
            <div className={`w-full lg:w-80 border-r border-slate-200 flex flex-col ${showDetail ? 'hidden lg:flex' : 'flex'}`}>
              <div className="p-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="escalated">Escalated</option>
                      <option value="closed">Closed</option>
                      <option value="">All</option>
                    </select>
                  </div>
                  <button onClick={fetchSessions} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="Refresh">
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loadingSessions ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <MessageCircle size={40} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">No conversations</p>
                    <p className="text-sm">Active chats will appear here</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleSelectSession(session)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        selectedSession?.id === session.id ? 'bg-indigo-50 border-l-2 border-l-indigo-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-900">
                          {session.customer_id ? `Customer #${session.customer_id}` : `Guest ${session.guest_id?.slice(0, 8)}...`}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                          {getStatusIcon(session.status)}
                          {session.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Session #{session.id} &middot; {formatDate(session.updated_at)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Detail */}
            <div className={`flex-1 flex flex-col ${!showDetail ? 'hidden lg:flex' : 'flex'}`}>
              {selectedSession ? (
                <>
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setShowDetail(false)} className="lg:hidden p-1 rounded hover:bg-slate-200 text-slate-600">
                        <ChevronLeft size={20} />
                      </button>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedSession.customer_id ? `Customer #${selectedSession.customer_id}` : 'Guest'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Session #{selectedSession.id} &middot; Started {formatDate(selectedSession.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedSession.status)}`}>
                        {getStatusIcon(selectedSession.status)}
                        {selectedSession.status}
                      </span>
                      {selectedSession.status !== 'closed' && (
                        <button
                          onClick={() => handleCloseSession(selectedSession.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <p className="text-sm">No messages in this conversation</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className="flex flex-col">
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${getSenderStyle(msg.sender_type)}`}>
                            <div className="flex items-center gap-1.5 mb-1 opacity-70">
                              {getSenderIcon(msg.sender_type)}
                              <span className="text-xs font-medium">{getSenderLabel(msg.sender_type)}</span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-0.5 px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {selectedSession.status !== 'closed' && (
                    <div className="p-3 border-t border-slate-200 bg-white">
                      <div className="flex gap-2">
                        <input
                          ref={replyInputRef}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
                          placeholder="Type your reply..."
                          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          disabled={sendingReply}
                        />
                        <button
                          onClick={handleSendReply}
                          disabled={!replyText.trim() || sendingReply}
                          className="bg-indigo-600 text-white rounded-xl px-4 py-2.5 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          <Send size={16} />
                          <span className="hidden sm:inline text-sm font-medium">Send</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <MessageCircle size={48} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-slate-500">Select a conversation</p>
                    <p className="text-sm">Choose a chat from the list to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
