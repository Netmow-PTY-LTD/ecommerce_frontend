'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/admin-layout';
import { toast } from 'sonner';
import {
  Mail,
  RefreshCw,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  XCircle,
  Layers,
  Zap,
  BarChart3,
  Settings,
  Calendar,
} from 'lucide-react';

interface QueueStats {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
}

interface ProcessorStatus {
  isRunning: boolean;
  isProcessing: boolean;
  processInterval: number;
  nextRun: string | null;
}

export default function EmailQueuePage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [stats, setStats] = useState<QueueStats>({
    pending: 0,
    processing: 0,
    sent: 0,
    failed: 0,
  });
  const [processorStatus, setProcessorStatus] = useState<ProcessorStatus>({
    isRunning: false,
    isProcessing: false,
    processInterval: 60000,
    nextRun: null,
  });
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/admin/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchProcessorStatus();
      // Auto-refresh every 10 seconds
      const interval = setInterval(() => {
        fetchStats();
        fetchProcessorStatus();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/email/queue/stats');
      setStats(res.data.data || {
        pending: 0,
        processing: 0,
        sent: 0,
        failed: 0,
      });
    } catch (err) {
      console.error('Failed to fetch queue stats:', err);
    }
  };

  const fetchProcessorStatus = async () => {
    try {
      const res = await api.get('/email/queue/processor/status');
      setProcessorStatus(res.data.data || {
        isRunning: false,
        isProcessing: false,
        processInterval: 60000,
        nextRun: null,
      });
    } catch (err) {
      console.error('Failed to fetch processor status:', err);
    }
  };

  const handleProcessQueue = async () => {
    try {
      setProcessing(true);
      const res = await api.post('/email/process-queue');
      const result = res.data.data || { processed: 0, failed: 0 };
      toast.success(`Processed ${result.processed} emails${result.failed > 0 ? `, ${result.failed} failed` : ''}`);
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process queue');
    } finally {
      setProcessing(false);
    }
  };

  const handleStartProcessor = async () => {
    try {
      setStarting(true);
      await api.post('/email/queue/processor/start', { intervalMinutes: 1 });
      toast.success('Queue processor started');
      fetchProcessorStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start processor');
    } finally {
      setStarting(false);
    }
  };

  const handleStopProcessor = async () => {
    try {
      setStopping(true);
      await api.post('/email/queue/processor/stop');
      toast.success('Queue processor stopped');
      fetchProcessorStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to stop processor');
    } finally {
      setStopping(false);
    }
  };

  const formatNextRun = () => {
    if (!processorStatus.nextRun) return 'Not scheduled';
    const nextRun = new Date(processorStatus.nextRun);
    const now = new Date();
    const diff = nextRun.getTime() - now.getTime();

    if (diff < 0) return 'Processing...';
    if (diff < 60000) return `${Math.ceil(diff / 1000)}s`;
    if (diff < 3600000) return `${Math.ceil(diff / 60000)}m`;
    return nextRun.toLocaleTimeString();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const totalQueued = stats.pending + stats.processing;
  const totalProcessed = stats.sent + stats.failed;

  return (
    <AdminLayout title="Email Queue Monitor" subtitle="Monitor and manage the email processing queue">
      <div className="w-full">
        {/* Queue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <div className="bg-amber-600 p-3 rounded-xl text-white"><Clock size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
              </div>
              <div className="bg-blue-600 p-3 rounded-xl text-white"><Layers size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Sent</p>
                <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
              </div>
              <div className="bg-green-600 p-3 rounded-xl text-white"><CheckCircle2 size={20} /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <div className="bg-red-600 p-3 rounded-xl text-white"><XCircle size={20} /></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Queue Actions */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Queue Actions</h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Process Queue */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2 rounded-lg">
                    <Play size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Process Queue</p>
                    <p className="text-sm text-slate-500">Manually process pending emails</p>
                  </div>
                </div>
                <button
                  onClick={handleProcessQueue}
                  disabled={processing || totalQueued === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      Process Now
                    </>
                  )}
                </button>
              </div>

              {/* Processor Controls */}
              <div className="p-4 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-600 p-2 rounded-lg">
                    <Settings size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Queue Processor</p>
                    <p className="text-sm text-slate-500">Automatic background processing</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Status:</span>
                    <span className={`font-medium ${processorStatus.isRunning ? 'text-green-600' : 'text-slate-500'}`}>
                      {processorStatus.isRunning ? 'Running' : 'Stopped'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Currently:</span>
                    <span className={`font-medium ${processorStatus.isProcessing ? 'text-blue-600' : 'text-slate-500'}`}>
                      {processorStatus.isProcessing ? 'Processing queue...' : 'Idle'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Next run:</span>
                    <span className="font-medium text-slate-900">{formatNextRun()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Interval:</span>
                    <span className="font-medium text-slate-900">{Math.round(processorStatus.processInterval / 60000)} minute(s)</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {processorStatus.isRunning ? (
                      <button
                        onClick={handleStopProcessor}
                        disabled={stopping}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        {stopping ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            Stopping...
                          </>
                        ) : (
                          <>
                            <Pause size={16} />
                            Stop
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleStartProcessor}
                        disabled={starting}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        {starting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            Starting...
                          </>
                        ) : (
                          <>
                            <Play size={16} />
                            Start
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        fetchStats();
                        fetchProcessorStatus();
                      }}
                      className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={16} />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Queue Statistics */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Queue Statistics</h3>
            </div>
            <div className="p-6">
              {/* Visual Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">Queue Overview</span>
                  <span className="font-medium text-slate-900">{totalQueued + totalProcessed} total</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
                  {stats.pending > 0 && (
                    <div
                      className="bg-amber-500"
                      style={{ width: `${(stats.pending / (totalQueued + totalProcessed)) * 100}%` }}
                      title={`Pending: ${stats.pending}`}
                    />
                  )}
                  {stats.processing > 0 && (
                    <div
                      className="bg-blue-500"
                      style={{ width: `${(stats.processing / (totalQueued + totalProcessed)) * 100}%` }}
                      title={`Processing: ${stats.processing}`}
                    />
                  )}
                  {stats.sent > 0 && (
                    <div
                      className="bg-green-500"
                      style={{ width: `${(stats.sent / (totalQueued + totalProcessed)) * 100}%` }}
                      title={`Sent: ${stats.sent}`}
                    />
                  )}
                  {stats.failed > 0 && (
                    <div
                      className="bg-red-500"
                      style={{ width: `${(stats.failed / (totalQueued + totalProcessed)) * 100}%` }}
                      title={`Failed: ${stats.failed}`}
                    />
                  )}
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-amber-500"></div>
                    Pending: {stats.pending}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    Processing: {stats.processing}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    Sent: {stats.sent}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    Failed: {stats.failed}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Layers size={16} className="text-slate-500" />
                    <span className="text-sm text-slate-600">In Queue</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{totalQueued}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 size={16} className="text-slate-500" />
                    <span className="text-sm text-slate-600">Processed</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{totalProcessed}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={16} className="text-green-600" />
                    <span className="text-sm text-green-700">Success Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {totalProcessed > 0 ? `${Math.round((stats.sent / totalProcessed) * 100)}%` : '-'}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle size={16} className="text-red-600" />
                    <span className="text-sm text-red-700">Failed Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700">
                    {totalProcessed > 0 ? `${Math.round((stats.failed / totalProcessed) * 100)}%` : '-'}
                  </p>
                </div>
              </div>

              {/* Info Box */}
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <Mail size={18} className="text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">About Email Queue</p>
                    <p className="text-blue-700">
                      Emails are queued by automation rules and processed automatically every minute. Failed emails will be retried up to 3 times with 30-minute delays.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
