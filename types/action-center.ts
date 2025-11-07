/**
 * Action Center Domain Types
 *
 * These types define the structure for the Action Center system,
 * which aggregates all items requiring admin attention across the platform.
 */

export type Queue =
  | 'kyc'
  | 'bookings'
  | 'refunds_disputes'
  | 'payouts'
  | 'webhooks'
  | 'content_flags';

export type Severity = 'red' | 'amber' | 'green';

export type ItemStatus = 'open' | 'snoozed' | 'resolved';

export type RefType = 'provider' | 'customer' | 'booking' | 'payout' | 'webhook' | 'review';

export interface ActionItem {
  id: string; // AC-<shortid>
  queue: Queue;
  refType: RefType;
  refId: string;
  title: string; // short summary line
  whoName?: string;
  whoPhone?: string;
  reasonCode: string; // e.g., FAILED_PAYOUT, ID_MISMATCH
  status: ItemStatus;
  slaAt?: string; // ISO timestamp
  severity: Severity; // computed based on SLA
  amountAtRisk?: number; // in cents
  assigneeId?: string; // admin user id
  assigneeName?: string; // admin user name
  openedAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  meta?: Record<string, any>;
}

export interface ActionNote {
  id: string;
  actionItemId: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string; // ISO timestamp
}

export interface QueueSummary {
  queue: Queue;
  total: number;
  byStatus: Record<ItemStatus, number>;
  bySeverity: Record<Severity, number>;
}

export interface ActionCenterSummary {
  totalOpen: number;
  queues: Record<Queue, number>;
}

export interface ListParams {
  queue: Queue;
  page?: number;
  limit?: number;
  assignedTo?: 'me' | 'unassigned' | 'all';
  overdue?: boolean;
  severity?: Severity[];
  reasonCode?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ListResponse {
  items: ActionItem[];
  page: number;
  limit: number;
  total: number;
  totalsByReason: Record<string, number>;
}

// Action types for different queues
export type KYCAction = 'approve' | 'reject' | 'request_info';
export type BookingAction = 'confirm' | 'reschedule' | 'cancel';
export type RefundDisputeAction = 'approve_refund' | 'deny_refund' | 'request_info';
export type PayoutAction = 'retry' | 'change_method' | 'request_info';
export type WebhookAction = 'retry' | 'view_payload' | 'disable';
export type ContentAction = 'approve' | 'hide' | 'strike_user';

export type AdminAction =
  | KYCAction
  | BookingAction
  | RefundDisputeAction
  | PayoutAction
  | WebhookAction
  | ContentAction;

// Admin roles for RBAC
export type AdminRole = 'super_admin' | 'finance_admin' | 'operations_admin' | 'support_admin' | 'content_admin';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: Queue[];
}

// Reason codes by queue
export const REASON_CODES = {
  kyc: ['ID_MISMATCH', 'DOC_EXPIRED', 'DOC_UNCLEAR', 'FRAUD_SUSPECTED', 'INFO_INCOMPLETE'],
  bookings: ['PENDING_CONFIRM', 'RESCHEDULE_REQUEST', 'CANCELLATION_REQUEST', 'PAYMENT_ISSUE', 'DISPUTE_RAISED'],
  refunds_disputes: ['REFUND_REQUESTED', 'CHARGEBACK_OPEN', 'SERVICE_NOT_RENDERED', 'QUALITY_ISSUE', 'UNAUTHORIZED_CHARGE'],
  payouts: ['FAILED_PAYOUT', 'PENDING_INFO', 'BANK_DETAILS_INVALID', 'THRESHOLD_NOT_MET', 'HOLD_REQUESTED'],
  webhooks: ['DELIVERY_FAILED', 'RATE_LIMITED', 'AUTH_FAILED', 'TIMEOUT', 'INVALID_RESPONSE'],
  content_flags: ['REVIEW_FLAGGED', 'IMAGE_INAPPROPRIATE', 'PROFILE_SUSPICIOUS', 'SPAM_DETECTED', 'HARASSMENT_REPORTED'],
} as const;

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<AdminRole, Queue[]> = {
  super_admin: ['kyc', 'bookings', 'refunds_disputes', 'payouts', 'webhooks', 'content_flags'],
  finance_admin: ['payouts', 'refunds_disputes'],
  operations_admin: ['bookings', 'kyc'],
  support_admin: ['bookings', 'refunds_disputes', 'content_flags'],
  content_admin: ['content_flags'],
};
