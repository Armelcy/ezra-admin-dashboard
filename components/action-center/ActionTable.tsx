'use client';

import { ActionRow } from './ActionRow';
import type { ActionItem } from '@/types/action-center';
import { Loader2 } from 'lucide-react';

interface ActionTableProps {
  items: ActionItem[];
  loading?: boolean;
  onAction: (itemId: string, action: string, data?: any) => Promise<void>;
  onOpenNotes: (item: ActionItem) => void;
  onAssignToMe: (itemId: string) => Promise<void>;
}

export function ActionTable({
  items,
  loading,
  onAction,
  onOpenNotes,
  onAssignToMe,
}: ActionTableProps) {
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading action items...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-12">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items to review</h3>
          <p className="text-sm text-gray-500">
            All caught up! There are no action items matching your current filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Who
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SLA
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Opened
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                $ At Risk
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <ActionRow
                key={item.id}
                item={item}
                onAction={onAction}
                onOpenNotes={onOpenNotes}
                onAssignToMe={onAssignToMe}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with item count */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-900">{items.length}</span> action item
          {items.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
