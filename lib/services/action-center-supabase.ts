/**
 * Real Supabase Action Center Service
 *
 * This connects to your Supabase database for live data.
 * Make sure to run the action_center_schema.sql first!
 */

import { supabase } from '@/lib/supabase';
import type {
  ActionItem,
  ActionNote,
  ActionCenterSummary,
  ListParams,
  ListResponse,
  Queue,
} from '@/types/action-center';

/**
 * Get summary of all queues with counts
 */
export async function getSummary(): Promise<ActionCenterSummary> {
  const { data, error } = await supabase
    .from('action_items')
    .select('queue, status')
    .eq('status', 'open');

  if (error) {
    console.error('Error fetching summary:', error);
    throw error;
  }

  // Count items by queue
  const counts: Record<Queue, number> = {
    kyc: 0,
    bookings: 0,
    refunds_disputes: 0,
    payouts: 0,
    webhooks: 0,
    content_flags: 0,
  };

  data?.forEach((item) => {
    counts[item.queue as Queue]++;
  });

  return {
    totalOpen: data?.length || 0,
    queues: counts,
  };
}

/**
 * List items for a specific queue with filters
 */
export async function list(queue: Queue, params: ListParams = {}): Promise<ListResponse> {
  let query = supabase
    .from('action_items')
    .select('*', { count: 'exact' })
    .eq('queue', queue);

  // Filter by status (only show open and snoozed by default)
  query = query.in('status', ['open', 'snoozed']);

  // Apply filters
  if (params.assignedTo === 'me') {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      query = query.eq('assignee_id', user.id);
    }
  } else if (params.assignedTo === 'unassigned') {
    query = query.is('assignee_id', null);
  }

  if (params.overdue) {
    query = query.lt('sla_at', new Date().toISOString());
  }

  if (params.severity && params.severity.length > 0) {
    query = query.in('severity', params.severity);
  }

  if (params.reasonCode && params.reasonCode.length > 0) {
    query = query.in('reason_code', params.reasonCode);
  }

  if (params.search) {
    // Search across multiple fields
    query = query.or(
      `id.ilike.%${params.search}%,ref_id.ilike.%${params.search}%,who_name.ilike.%${params.search}%,who_phone.ilike.%${params.search}%,title.ilike.%${params.search}%`
    );
  }

  // Pagination
  const page = params.page || 1;
  const limit = params.limit || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit - 1;

  query = query.range(startIndex, endIndex);

  // Order by SLA (most urgent first)
  query = query.order('sla_at', { ascending: true, nullsFirst: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching action items:', error);
    throw error;
  }

  // Calculate totals by reason
  const totalsByReason: Record<string, number> = {};
  data?.forEach((item) => {
    totalsByReason[item.reason_code] = (totalsByReason[item.reason_code] || 0) + 1;
  });

  // Map database fields to our ActionItem type
  const items: ActionItem[] = (data || []).map((item) => ({
    id: item.id,
    queue: item.queue,
    refType: item.ref_type,
    refId: item.ref_id,
    title: item.title,
    whoName: item.who_name,
    whoPhone: item.who_phone,
    reasonCode: item.reason_code,
    status: item.status,
    slaAt: item.sla_at,
    severity: item.severity,
    amountAtRisk: item.amount_at_risk,
    assigneeId: item.assignee_id,
    assigneeName: item.assignee_name,
    openedAt: item.created_at,
    updatedAt: item.updated_at,
    meta: item.meta || {},
  }));

  return {
    items,
    page,
    limit,
    total: count || 0,
    totalsByReason,
  };
}

/**
 * Assign an action item to an admin
 */
export async function assign(id: string, assigneeId?: string): Promise<ActionItem> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetAssigneeId = assigneeId || user?.id;

  if (!targetAssigneeId) {
    throw new Error('No user logged in');
  }

  // Get assignee name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', targetAssigneeId)
    .single();

  const { data, error } = await supabase
    .from('action_items')
    .update({
      assignee_id: targetAssigneeId,
      assignee_name: profile?.full_name || 'Admin',
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error assigning item:', error);
    throw error;
  }

  return mapDbItemToActionItem(data);
}

/**
 * Resolve an action item
 */
export async function resolve(
  id: string,
  resolution: string,
  note?: string
): Promise<ActionItem> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('action_items')
    .update({
      status: 'resolved',
      meta: {
        resolution,
        resolvedBy: user?.id,
        resolvedAt: new Date().toISOString(),
      },
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error resolving item:', error);
    throw error;
  }

  // Add resolution note if provided
  if (note) {
    await addNote(id, note);
  }

  return mapDbItemToActionItem(data);
}

/**
 * Snooze an action item until a specific time
 */
export async function snooze(id: string, untilISO: string): Promise<ActionItem> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('action_items')
    .update({
      status: 'snoozed',
      sla_at: untilISO,
      meta: {
        snoozedBy: user?.id,
        snoozedUntil: untilISO,
      },
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error snoozing item:', error);
    throw error;
  }

  return mapDbItemToActionItem(data);
}

/**
 * Add a note to an action item
 */
export async function addNote(id: string, body: string): Promise<ActionNote> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No user logged in');
  }

  // Get user name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const { data, error } = await supabase
    .from('action_notes')
    .insert({
      action_item_id: id,
      body,
      author_id: user.id,
      author_name: profile?.full_name || 'Admin',
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding note:', error);
    throw error;
  }

  return {
    id: data.id,
    actionItemId: data.action_item_id,
    body: data.body,
    authorId: data.author_id,
    authorName: data.author_name,
    createdAt: data.created_at,
  };
}

/**
 * Get notes for an action item
 */
export async function getNotes(id: string): Promise<ActionNote[]> {
  const { data, error } = await supabase
    .from('action_notes')
    .select('*')
    .eq('action_item_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }

  return (data || []).map((note) => ({
    id: note.id,
    actionItemId: note.action_item_id,
    body: note.body,
    authorId: note.author_id,
    authorName: note.author_name,
    createdAt: note.created_at,
  }));
}

/**
 * Retry a webhook
 */
export async function retryWebhook(id: string): Promise<{ ok: boolean; message?: string }> {
  // In production, this would trigger your webhook retry logic
  // For now, we'll just mark it as resolved

  try {
    await resolve(id, 'webhook_retried', 'Webhook retry initiated');
    return {
      ok: true,
      message: 'Webhook retry initiated successfully',
    };
  } catch (error) {
    return {
      ok: false,
      message: 'Webhook retry failed',
    };
  }
}

/**
 * Perform queue-specific actions
 */
export async function performAction(
  id: string,
  action: string,
  data?: any
): Promise<ActionItem> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: item, error } = await supabase
    .from('action_items')
    .update({
      status: 'resolved',
      meta: {
        action,
        actionData: data,
        actionBy: user?.id,
        actionAt: new Date().toISOString(),
      },
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error performing action:', error);
    throw error;
  }

  // Add action note
  await addNote(id, `Action performed: ${action}`);

  return mapDbItemToActionItem(item);
}

/**
 * Get a single item by ID
 */
export async function getItem(id: string): Promise<ActionItem | null> {
  const { data, error } = await supabase
    .from('action_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching item:', error);
    return null;
  }

  return mapDbItemToActionItem(data);
}

/**
 * Helper function to map database fields to ActionItem type
 */
function mapDbItemToActionItem(item: any): ActionItem {
  return {
    id: item.id,
    queue: item.queue,
    refType: item.ref_type,
    refId: item.ref_id,
    title: item.title,
    whoName: item.who_name,
    whoPhone: item.who_phone,
    reasonCode: item.reason_code,
    status: item.status,
    slaAt: item.sla_at,
    severity: item.severity,
    amountAtRisk: item.amount_at_risk,
    assigneeId: item.assignee_id,
    assigneeName: item.assignee_name,
    openedAt: item.created_at,
    updatedAt: item.updated_at,
    meta: item.meta || {},
  };
}
