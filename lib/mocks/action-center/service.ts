/**
 * Mock Action Center Service
 *
 * This simulates API calls with artificial latency.
 * In production, replace these with real API calls to your backend.
 */

import type {
  ActionItem,
  ActionNote,
  ActionCenterSummary,
  ListParams,
  ListResponse,
  Queue,
} from '@/types/action-center';
import {
  allActionItems,
  kycItems,
  bookingItems,
  refundsDisputesItems,
  payoutItems,
  webhookItems,
  contentFlagsItems,
  mockNotes,
} from './data';

// In-memory storage (simulates database)
let items: ActionItem[] = JSON.parse(JSON.stringify(allActionItems));
let notes: Record<string, ActionNote[]> = JSON.parse(JSON.stringify(mockNotes));

// Simulate network latency
const delay = (ms: number = 250 + Math.random() * 350) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Current admin user (mock)
const CURRENT_ADMIN_ID = 'admin-current';
const CURRENT_ADMIN_NAME = 'Current Admin';

/**
 * Get summary of all queues with counts
 */
export async function getSummary(): Promise<ActionCenterSummary> {
  await delay();

  const openItems = items.filter((item) => item.status === 'open');
  const summary: ActionCenterSummary = {
    totalOpen: openItems.length,
    queues: {
      kyc: openItems.filter((i) => i.queue === 'kyc').length,
      bookings: openItems.filter((i) => i.queue === 'bookings').length,
      refunds_disputes: openItems.filter((i) => i.queue === 'refunds_disputes').length,
      payouts: openItems.filter((i) => i.queue === 'payouts').length,
      webhooks: openItems.filter((i) => i.queue === 'webhooks').length,
      content_flags: openItems.filter((i) => i.queue === 'content_flags').length,
    },
  };

  return summary;
}

/**
 * List items for a specific queue with filters
 */
export async function list(queue: Queue, params: ListParams = {}): Promise<ListResponse> {
  await delay();

  // Filter by queue
  let filtered = items.filter((item) => item.queue === queue);

  // Apply filters
  if (params.assignedTo === 'me') {
    filtered = filtered.filter((item) => item.assigneeId === CURRENT_ADMIN_ID);
  } else if (params.assignedTo === 'unassigned') {
    filtered = filtered.filter((item) => !item.assigneeId);
  }

  if (params.overdue) {
    const now = Date.now();
    filtered = filtered.filter((item) => {
      if (!item.slaAt) return false;
      return new Date(item.slaAt).getTime() < now;
    });
  }

  if (params.severity && params.severity.length > 0) {
    filtered = filtered.filter((item) => params.severity!.includes(item.severity));
  }

  if (params.reasonCode && params.reasonCode.length > 0) {
    filtered = filtered.filter((item) => params.reasonCode!.includes(item.reasonCode));
  }

  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.id.toLowerCase().includes(searchLower) ||
        item.refId.toLowerCase().includes(searchLower) ||
        item.whoName?.toLowerCase().includes(searchLower) ||
        item.whoPhone?.toLowerCase().includes(searchLower) ||
        item.title.toLowerCase().includes(searchLower)
    );
  }

  // Only show open and snoozed items by default
  filtered = filtered.filter((item) => item.status !== 'resolved');

  // Calculate totals by reason
  const totalsByReason: Record<string, number> = {};
  filtered.forEach((item) => {
    totalsByReason[item.reasonCode] = (totalsByReason[item.reasonCode] || 0) + 1;
  });

  // Pagination
  const page = params.page || 1;
  const limit = params.limit || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = filtered.slice(startIndex, endIndex);

  return {
    items: paginatedItems,
    page,
    limit,
    total: filtered.length,
    totalsByReason,
  };
}

/**
 * Assign an action item to an admin
 */
export async function assign(id: string, assigneeId?: string): Promise<ActionItem> {
  await delay(300);

  const itemIndex = items.findIndex((item) => item.id === id);
  if (itemIndex === -1) {
    throw new Error('Item not found');
  }

  items[itemIndex] = {
    ...items[itemIndex],
    assigneeId: assigneeId || CURRENT_ADMIN_ID,
    assigneeName: assigneeId ? 'Other Admin' : CURRENT_ADMIN_NAME,
    updatedAt: new Date().toISOString(),
  };

  return { ...items[itemIndex] };
}

/**
 * Resolve an action item
 */
export async function resolve(
  id: string,
  resolution: string,
  note?: string
): Promise<ActionItem> {
  await delay(400);

  const itemIndex = items.findIndex((item) => item.id === id);
  if (itemIndex === -1) {
    throw new Error('Item not found');
  }

  items[itemIndex] = {
    ...items[itemIndex],
    status: 'resolved',
    updatedAt: new Date().toISOString(),
    meta: {
      ...items[itemIndex].meta,
      resolution,
      resolvedBy: CURRENT_ADMIN_ID,
      resolvedAt: new Date().toISOString(),
    },
  };

  // Add resolution note
  if (note) {
    await addNote(id, note);
  }

  return { ...items[itemIndex] };
}

/**
 * Snooze an action item until a specific time
 */
export async function snooze(id: string, untilISO: string): Promise<ActionItem> {
  await delay(300);

  const itemIndex = items.findIndex((item) => item.id === id);
  if (itemIndex === -1) {
    throw new Error('Item not found');
  }

  items[itemIndex] = {
    ...items[itemIndex],
    status: 'snoozed',
    slaAt: untilISO,
    updatedAt: new Date().toISOString(),
    meta: {
      ...items[itemIndex].meta,
      snoozedBy: CURRENT_ADMIN_ID,
      snoozedUntil: untilISO,
    },
  };

  return { ...items[itemIndex] };
}

/**
 * Add a note to an action item
 */
export async function addNote(id: string, body: string): Promise<ActionNote> {
  await delay(250);

  const item = items.find((item) => item.id === id);
  if (!item) {
    throw new Error('Item not found');
  }

  const note: ActionNote = {
    id: `NOTE-${Date.now()}`,
    actionItemId: id,
    body,
    authorId: CURRENT_ADMIN_ID,
    authorName: CURRENT_ADMIN_NAME,
    createdAt: new Date().toISOString(),
  };

  if (!notes[id]) {
    notes[id] = [];
  }
  notes[id].push(note);

  return note;
}

/**
 * Get notes for an action item
 */
export async function getNotes(id: string): Promise<ActionNote[]> {
  await delay(200);
  return notes[id] || [];
}

/**
 * Retry a webhook (randomly fails 10% of the time)
 */
export async function retryWebhook(id: string): Promise<{ ok: boolean; message?: string }> {
  await delay(500);

  const item = items.find((item) => item.id === id);
  if (!item) {
    throw new Error('Item not found');
  }

  if (item.queue !== 'webhooks') {
    throw new Error('Item is not a webhook');
  }

  // 10% failure rate
  const shouldFail = Math.random() < 0.1;

  if (shouldFail) {
    return {
      ok: false,
      message: 'Webhook retry failed: endpoint returned 503',
    };
  }

  // Success - resolve the item
  const itemIndex = items.findIndex((i) => i.id === id);
  items[itemIndex] = {
    ...items[itemIndex],
    status: 'resolved',
    updatedAt: new Date().toISOString(),
    meta: {
      ...items[itemIndex].meta,
      retriedAt: new Date().toISOString(),
      retriedBy: CURRENT_ADMIN_ID,
    },
  };

  return {
    ok: true,
    message: 'Webhook delivered successfully',
  };
}

/**
 * Perform queue-specific actions
 */
export async function performAction(
  id: string,
  action: string,
  data?: any
): Promise<ActionItem> {
  await delay(400);

  const itemIndex = items.findIndex((item) => item.id === id);
  if (itemIndex === -1) {
    throw new Error('Item not found');
  }

  const item = items[itemIndex];

  // Update item based on action
  items[itemIndex] = {
    ...item,
    status: 'resolved',
    updatedAt: new Date().toISOString(),
    meta: {
      ...item.meta,
      action,
      actionData: data,
      actionBy: CURRENT_ADMIN_ID,
      actionAt: new Date().toISOString(),
    },
  };

  // Add action note
  await addNote(id, `Action performed: ${action}`);

  return { ...items[itemIndex] };
}

/**
 * Get a single item by ID
 */
export async function getItem(id: string): Promise<ActionItem | null> {
  await delay(200);
  const item = items.find((item) => item.id === id);
  return item ? { ...item } : null;
}

/**
 * Reset mock data (useful for testing)
 */
export function resetMockData() {
  items = JSON.parse(JSON.stringify(allActionItems));
  notes = JSON.parse(JSON.stringify(mockNotes));
}
