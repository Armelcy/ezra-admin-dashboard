'use client';

import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Eye,
  MessageCircle,
} from 'lucide-react';
import type { ActionItem } from '@/types/action-center';

interface ActionRowProps {
  item: ActionItem;
  onAction: (itemId: string, action: string, data?: any) => Promise<void>;
  onOpenNotes: (item: ActionItem) => void;
  onAssignToMe: (itemId: string) => Promise<void>;
}

export function ActionRow({ item, onAction, onOpenNotes, onAssignToMe }: ActionRowProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showActionModal, setShowActionModal] = useState<string | null>(null);

  const handleAction = async (action: string, data?: any) => {
    setIsProcessing(true);
    try {
      await onAction(item.id, action, data);
      setShowActionModal(null);
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Compute SLA status
  const getSLAStatus = () => {
    if (!item.slaAt) return null;
    const slaTime = new Date(item.slaAt).getTime();
    const now = Date.now();
    const hoursLeft = (slaTime - now) / (1000 * 60 * 60);

    if (hoursLeft < 0) {
      return { label: 'Overdue', color: 'bg-red-100 text-red-800', icon: '⏰' };
    } else if (hoursLeft < 2) {
      return { label: `${Math.floor(hoursLeft)}h left`, color: 'bg-red-100 text-red-800', icon: '🔴' };
    } else if (hoursLeft < 24) {
      return { label: `${Math.floor(hoursLeft)}h left`, color: 'bg-amber-100 text-amber-800', icon: '🟠' };
    } else {
      const daysLeft = Math.floor(hoursLeft / 24);
      return { label: `${daysLeft}d left`, color: 'bg-green-100 text-green-800', icon: '🟢' };
    }
  };

  const slaStatus = getSLAStatus();

  // Get queue-specific actions
  const renderActions = () => {
    switch (item.queue) {
      case 'kyc':
        return (
          <>
            <button
              onClick={() => handleAction('approve_kyc')}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md disabled:opacity-50"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Approve
            </button>
            <button
              onClick={() => setShowActionModal('reject')}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md disabled:opacity-50"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Reject
            </button>
            <button
              onClick={() => setShowActionModal('request_info')}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md disabled:opacity-50"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Request Info
            </button>
          </>
        );

      case 'bookings':
        return (
          <>
            <button
              onClick={() => handleAction('confirm_booking')}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md disabled:opacity-50"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Confirm
            </button>
            <button
              onClick={() => setShowActionModal('reschedule')}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md disabled:opacity-50"
            >
              <Clock className="h-3 w-3 mr-1" />
              Reschedule
            </button>
            <button
              onClick={() => setShowActionModal('cancel')}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md disabled:opacity-50"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Cancel
            </button>
          </>
        );

      case 'refunds_disputes':
        return (
          <>
            <button
              onClick={() => handleAction('approve_refund')}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md disabled:opacity-50"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Approve Refund
            </button>
            <button
              onClick={() => setShowActionModal('deny_refund')}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md disabled:opacity-50"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Deny
            </button>
            <button
              onClick={() => setShowActionModal('request_info')}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md disabled:opacity-50"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Request Info
            </button>
          </>
        );

      case 'payouts':
        return (
          <>
            <button
              onClick={() => handleAction('retry_payout')}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md disabled:opacity-50"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </button>
            <button
              onClick={() => setShowActionModal('change_method')}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md disabled:opacity-50"
            >
              Change Method
            </button>
            <button
              onClick={() => setShowActionModal('request_info')}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-md disabled:opacity-50"
            >
              Request Info
            </button>
          </>
        );

      case 'webhooks':
        return (
          <>
            <button
              onClick={() => handleAction('retry_webhook')}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md disabled:opacity-50"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry Now
            </button>
            <button
              onClick={() => setShowActionModal('view_payload')}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md disabled:opacity-50"
            >
              <Eye className="h-3 w-3 mr-1" />
              View Payload
            </button>
          </>
        );

      case 'content_flags':
        return (
          <>
            <button
              onClick={() => handleAction('approve_content')}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md disabled:opacity-50"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Approve
            </button>
            <button
              onClick={() => handleAction('hide_content')}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-md disabled:opacity-50"
            >
              Hide
            </button>
            <button
              onClick={() => setShowActionModal('strike_user')}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md disabled:opacity-50"
            >
              Strike User
            </button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50">
        {/* Type Icon */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <span className="text-xl">{getTypeIcon(item.refType)}</span>
          </div>
        </td>

        {/* Title & ID */}
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-gray-900">{item.title}</div>
          <div className="text-xs text-gray-500">
            {item.id} • {item.refId}
          </div>
        </td>

        {/* Who */}
        <td className="px-6 py-4">
          <div className="text-sm text-gray-900">{item.whoName || '—'}</div>
          {item.whoPhone && <div className="text-xs text-gray-500">{item.whoPhone}</div>}
        </td>

        {/* Reason */}
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            {item.reasonCode.replace(/_/g, ' ')}
          </span>
        </td>

        {/* SLA */}
        <td className="px-6 py-4 whitespace-nowrap">
          {slaStatus && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${slaStatus.color}`}>
              {slaStatus.icon} {slaStatus.label}
            </span>
          )}
        </td>

        {/* Owner */}
        <td className="px-6 py-4 whitespace-nowrap">
          {item.assigneeName ? (
            <span className="text-sm text-gray-900">{item.assigneeName}</span>
          ) : (
            <button
              onClick={() => onAssignToMe(item.id)}
              className="text-sm text-primary-600 hover:text-primary-900"
            >
              Assign to me
            </button>
          )}
        </td>

        {/* Opened */}
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {formatRelativeTime(item.openedAt)}
        </td>

        {/* Amount at Risk */}
        <td className="px-6 py-4 whitespace-nowrap">
          {item.amountAtRisk ? (
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(item.amountAtRisk)}
            </span>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </td>

        {/* Actions */}
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
          {renderActions()}
          <button
            onClick={() => onOpenNotes(item)}
            className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            Notes
          </button>
        </td>
      </tr>

      {/* Action Modals */}
      {showActionModal && (
        <tr>
          <td colSpan={9} className="px-6 py-4 bg-blue-50">
            <SimpleActionModal
              action={showActionModal}
              item={item}
              onConfirm={(data) => handleAction(showActionModal, data)}
              onCancel={() => setShowActionModal(null)}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// Helper: Simple inline action modal
function SimpleActionModal({
  action,
  item,
  onConfirm,
  onCancel,
}: {
  action: string;
  item: ActionItem;
  onConfirm: (data?: any) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState('');

  return (
    <div className="p-4 space-y-3">
      <h4 className="font-medium text-gray-900">
        {action === 'reject' && 'Reject KYC'}
        {action === 'request_info' && 'Request Additional Information'}
        {action === 'reschedule' && 'Reschedule Booking'}
        {action === 'cancel' && 'Cancel Booking'}
        {action === 'deny_refund' && 'Deny Refund'}
        {action === 'change_method' && 'Change Payment Method'}
        {action === 'view_payload' && 'Webhook Payload'}
        {action === 'strike_user' && 'Strike User'}
      </h4>

      {action === 'view_payload' ? (
        <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
          {JSON.stringify(item.meta, null, 2)}
        </pre>
      ) : (
        <>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm({ note })}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              Confirm
            </button>
          </div>
        </>
      )}

      {action === 'view_payload' && (
        <div className="flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getTypeIcon(refType: string): string {
  const icons: Record<string, string> = {
    provider: '👤',
    customer: '👤',
    booking: '📅',
    payout: '💰',
    webhook: '🔗',
    review: '⭐',
  };
  return icons[refType] || '📋';
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return `${Math.floor(diffMs / (1000 * 60))}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatCurrency(cents: number): string {
  return `${(cents / 100).toLocaleString('fr-FR')} CFA`;
}
