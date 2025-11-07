'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle, AlertCircle } from 'lucide-react';
import type { Queue, ActionItem, ActionCenterSummary } from '@/types/action-center';
import { Filters } from '@/components/action-center/Filters';
import { ActionTable } from '@/components/action-center/ActionTable';
import { NotesDrawer } from '@/components/action-center/NotesDrawer';
import {
  getSummary,
  list,
  assign,
  performAction,
  retryWebhook,
  resolve,
} from '@/lib/services/action-center';

const QUEUES: { id: Queue; label: string; icon: string }[] = [
  { id: 'kyc', label: 'KYC', icon: '🆔' },
  { id: 'bookings', label: 'Bookings', icon: '📅' },
  { id: 'refunds_disputes', label: 'Refunds & Disputes', icon: '💸' },
  { id: 'payouts', label: 'Payouts', icon: '💰' },
  { id: 'webhooks', label: 'Webhooks', icon: '🔗' },
  { id: 'content_flags', label: 'Content Flags', icon: '🚩' },
];

export default function ActionCenterPage() {
  const router = useRouter();
  const [activeQueue, setActiveQueue] = useState<Queue>('kyc');
  const [summary, setSummary] = useState<ActionCenterSummary | null>(null);
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ActionItem | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadSummary();
    loadItems(activeQueue);
  }, []);

  useEffect(() => {
    loadItems(activeQueue);
  }, [activeQueue, filters]);

  const loadSummary = async () => {
    try {
      const data = await getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const loadItems = async (queue: Queue) => {
    setLoading(true);
    try {
      const response = await list(queue, { ...filters, queue });
      setItems(response.items);
    } catch (error) {
      console.error('Failed to load items:', error);
      showToast('error', 'Failed to load action items');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (itemId: string, action: string, data?: any) => {
    try {
      if (action === 'retry_webhook') {
        const result = await retryWebhook(itemId);
        if (result.ok) {
          showToast('success', result.message || 'Webhook delivered successfully');
        } else {
          showToast('error', result.message || 'Webhook retry failed');
          return;
        }
      } else {
        await performAction(itemId, action, data);
        showToast('success', `Action "${action}" completed successfully`);
      }

      // Reload data
      await loadItems(activeQueue);
      await loadSummary();
    } catch (error: any) {
      console.error('Action failed:', error);
      showToast('error', error.message || 'Action failed');
    }
  };

  const handleAssignToMe = async (itemId: string) => {
    try {
      await assign(itemId);
      showToast('success', 'Item assigned to you');
      await loadItems(activeQueue);
    } catch (error: any) {
      console.error('Assignment failed:', error);
      showToast('error', error.message || 'Assignment failed');
    }
  };

  const handleOpenNotes = (item: ActionItem) => {
    setSelectedItem(item);
  };

  const handleCloseNotes = () => {
    setSelectedItem(null);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary-600" />
            Action Center
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            All items requiring your attention in one place
          </p>
        </div>
        {summary && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-lg">
            <span className="text-sm font-medium text-gray-600">Total Open:</span>
            <span className="text-2xl font-bold text-primary-600">{summary.totalOpen}</span>
          </div>
        )}
      </div>

      {/* Queue Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {QUEUES.map((queue) => {
              const count = summary?.queues[queue.id] || 0;
              const isActive = activeQueue === queue.id;

              return (
                <button
                  key={queue.id}
                  onClick={() => setActiveQueue(queue.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{queue.icon}</span>
                  <span>{queue.label}</span>
                  {count > 0 && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        isActive
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Filters */}
      <Filters queue={activeQueue} onFilterChange={handleFilterChange} />

      {/* Action Table */}
      <ActionTable
        items={items}
        loading={loading}
        onAction={handleAction}
        onOpenNotes={handleOpenNotes}
        onAssignToMe={handleAssignToMe}
      />

      {/* Notes Drawer */}
      <NotesDrawer item={selectedItem} onClose={handleCloseNotes} />

      {/* Toast Notifications */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
