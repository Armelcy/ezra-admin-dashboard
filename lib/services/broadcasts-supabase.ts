/**
 * Broadcasts Supabase Service with OneSignal Integration
 * Handles all operations for the broadcast notifications system
 */

import { supabase } from '@/lib/supabase';
import { listFromTable, getById, updateRecord, createRecord, type PaginatedResponse, type ListParams } from '@/lib/supabase-base';

// Types
export type BroadcastTargetAudience = 'all' | 'customers' | 'providers' | 'specific';
export type BroadcastStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
export type RecipientStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'opened' | 'clicked';

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  target_audience: BroadcastTargetAudience;
  specific_user_ids: string[];
  onesignal_notification_id?: string;
  onesignal_external_id?: string;
  scheduled_for?: string;
  sent_at?: string;
  status: BroadcastStatus;
  total_recipients: number;
  successful_sends: number;
  failed_sends: number;
  opened_count: number;
  clicked_count: number;
  action_url?: string;
  image_url?: string;
  metadata: Record<string, any>;
  error_message?: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface BroadcastRecipient {
  id: string;
  broadcast_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  status: RecipientStatus;
  onesignal_player_id?: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  failed_at?: string;
  error_message?: string;
  created_at: string;
}

export interface BroadcastFilters {
  status?: BroadcastStatus;
  target_audience?: BroadcastTargetAudience;
  created_by?: string;
}

export interface CreateBroadcastData {
  title: string;
  message: string;
  target_audience: BroadcastTargetAudience;
  specific_user_ids?: string[];
  scheduled_for?: string;
  action_url?: string;
  image_url?: string;
  created_by: string;
  created_by_name: string;
}

export interface OneSignalConfig {
  appId: string;
  apiKey: string;
}

/**
 * Get OneSignal configuration from environment
 */
function getOneSignalConfig(): OneSignalConfig {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_API_KEY || process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    throw new Error('OneSignal configuration missing. Please set ONESIGNAL_APP_ID and ONESIGNAL_API_KEY in .env.local');
  }

  return { appId, apiKey };
}

/**
 * Send notification via OneSignal
 */
async function sendOneSignalNotification(
  config: OneSignalConfig,
  title: string,
  message: string,
  targetFilters: any[],
  data?: Record<string, any>
): Promise<{ id: string; recipients: number }> {
  const payload = {
    app_id: config.appId,
    headings: { en: title },
    contents: { en: message },
    filters: targetFilters,
    data: data || {},
  };

  if (data?.action_url) {
    payload['url'] = data.action_url;
  }

  if (data?.image_url) {
    payload['big_picture'] = data.image_url;
    payload['ios_attachments'] = { id: data.image_url };
  }

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OneSignal API error: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  return {
    id: result.id,
    recipients: result.recipients || 0,
  };
}

/**
 * Get target filters for OneSignal based on audience type
 */
function getOneSignalFilters(
  targetAudience: BroadcastTargetAudience,
  specificUserIds?: string[]
): any[] {
  switch (targetAudience) {
    case 'all':
      return [{ field: 'tag', key: 'user_type', relation: 'exists' }];

    case 'customers':
      return [{ field: 'tag', key: 'user_type', relation: '=', value: 'customer' }];

    case 'providers':
      return [{ field: 'tag', key: 'user_type', relation: '=', value: 'provider' }];

    case 'specific':
      if (!specificUserIds || specificUserIds.length === 0) {
        throw new Error('Specific user IDs required for specific audience targeting');
      }
      // Create OR filters for each user ID
      return specificUserIds.map((userId, index) => ({
        field: 'tag',
        key: 'user_id',
        relation: '=',
        value: userId,
        ...(index > 0 ? { operator: 'OR' } : {}),
      }));

    default:
      return [{ field: 'tag', key: 'user_type', relation: 'exists' }];
  }
}

/**
 * List all broadcasts with filters and pagination
 */
export async function listBroadcasts(
  params: ListParams & { filters?: BroadcastFilters } = {}
): Promise<PaginatedResponse<Broadcast>> {
  const { page = 1, limit = 20, search, sortBy = 'created_at', sortOrder = 'desc', filters } = params;

  let query = supabase
    .from('broadcasts')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters) {
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.target_audience) query = query.eq('target_audience', filters.target_audience);
    if (filters.created_by) query = query.eq('created_by', filters.created_by);
  }

  // Search
  if (search) {
    query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`);
  }

  // Sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error listing broadcasts:', error);
    throw error;
  }

  return {
    items: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Get a single broadcast by ID
 */
export async function getBroadcast(broadcastId: string): Promise<Broadcast | null> {
  return getById<Broadcast>('broadcasts', broadcastId);
}

/**
 * Create a new broadcast (draft)
 */
export async function createBroadcast(broadcastData: CreateBroadcastData): Promise<Broadcast> {
  const { data, error } = await supabase
    .from('broadcasts')
    .insert([{
      ...broadcastData,
      specific_user_ids: broadcastData.specific_user_ids || [],
      status: broadcastData.scheduled_for ? 'scheduled' : 'draft',
      total_recipients: 0,
      successful_sends: 0,
      failed_sends: 0,
      opened_count: 0,
      clicked_count: 0,
      metadata: {},
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating broadcast:', error);
    throw error;
  }

  return data;
}

/**
 * Send a broadcast immediately
 */
export async function sendBroadcast(broadcastId: string): Promise<Broadcast> {
  const broadcast = await getBroadcast(broadcastId);
  if (!broadcast) {
    throw new Error('Broadcast not found');
  }

  if (broadcast.status === 'sent') {
    throw new Error('Broadcast already sent');
  }

  try {
    // Update status to sending
    await updateRecord<Broadcast>('broadcasts', broadcastId, {
      status: 'sending',
    });

    // Get OneSignal config
    const config = getOneSignalConfig();

    // Get target filters
    const filters = getOneSignalFilters(
      broadcast.target_audience,
      broadcast.specific_user_ids
    );

    // Send via OneSignal
    const result = await sendOneSignalNotification(
      config,
      broadcast.title,
      broadcast.message,
      filters,
      {
        broadcast_id: broadcastId,
        action_url: broadcast.action_url,
        image_url: broadcast.image_url,
      }
    );

    // Update broadcast with results
    const updated = await updateRecord<Broadcast>('broadcasts', broadcastId, {
      status: 'sent',
      sent_at: new Date().toISOString(),
      onesignal_notification_id: result.id,
      total_recipients: result.recipients,
      successful_sends: result.recipients,
    });

    return updated;
  } catch (error) {
    console.error('Error sending broadcast:', error);

    // Update broadcast with error
    await updateRecord<Broadcast>('broadcasts', broadcastId, {
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Schedule a broadcast for later
 */
export async function scheduleBroadcast(
  broadcastId: string,
  scheduledFor: string
): Promise<Broadcast> {
  return updateRecord<Broadcast>('broadcasts', broadcastId, {
    scheduled_for: scheduledFor,
    status: 'scheduled',
  });
}

/**
 * Cancel a broadcast
 */
export async function cancelBroadcast(broadcastId: string): Promise<Broadcast> {
  const broadcast = await getBroadcast(broadcastId);
  if (!broadcast) {
    throw new Error('Broadcast not found');
  }

  if (broadcast.status === 'sent') {
    throw new Error('Cannot cancel a broadcast that has already been sent');
  }

  return updateRecord<Broadcast>('broadcasts', broadcastId, {
    status: 'cancelled',
  });
}

/**
 * Get broadcast recipients
 */
export async function getBroadcastRecipients(
  broadcastId: string
): Promise<BroadcastRecipient[]> {
  const { data, error } = await supabase
    .from('broadcast_recipients')
    .select('*')
    .eq('broadcast_id', broadcastId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting broadcast recipients:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get broadcast statistics
 */
export async function getBroadcastStats() {
  const { data: broadcasts, error } = await supabase
    .from('broadcasts')
    .select('status, total_recipients, successful_sends, failed_sends, opened_count, clicked_count, created_at');

  if (error) {
    console.error('Error getting broadcast stats:', error);
    throw error;
  }

  const stats = {
    total: broadcasts?.length || 0,
    sent: broadcasts?.filter((b) => b.status === 'sent').length || 0,
    scheduled: broadcasts?.filter((b) => b.status === 'scheduled').length || 0,
    failed: broadcasts?.filter((b) => b.status === 'failed').length || 0,
    totalRecipients: broadcasts?.reduce((sum, b) => sum + (b.total_recipients || 0), 0) || 0,
    successfulSends: broadcasts?.reduce((sum, b) => sum + (b.successful_sends || 0), 0) || 0,
    failedSends: broadcasts?.reduce((sum, b) => sum + (b.failed_sends || 0), 0) || 0,
    totalOpens: broadcasts?.reduce((sum, b) => sum + (b.opened_count || 0), 0) || 0,
    totalClicks: broadcasts?.reduce((sum, b) => sum + (b.clicked_count || 0), 0) || 0,
  };

  return stats;
}

/**
 * Get recent broadcasts
 */
export async function getRecentBroadcasts(limit: number = 10): Promise<Broadcast[]> {
  const { data, error } = await supabase
    .from('broadcasts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting recent broadcasts:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get scheduled broadcasts
 */
export async function getScheduledBroadcasts(): Promise<Broadcast[]> {
  const { data, error } = await supabase
    .from('broadcasts')
    .select('*')
    .eq('status', 'scheduled')
    .order('scheduled_for', { ascending: true });

  if (error) {
    console.error('Error getting scheduled broadcasts:', error);
    throw error;
  }

  return data || [];
}

/**
 * Test OneSignal connection
 */
export async function testOneSignalConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const config = getOneSignalConfig();

    // Try to fetch app info
    const response = await fetch(`https://onesignal.com/api/v1/apps/${config.appId}`, {
      headers: {
        'Authorization': `Basic ${config.apiKey}`,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to connect to OneSignal. Please check your API credentials.',
      };
    }

    const data = await response.json();

    return {
      success: true,
      message: `Connected to OneSignal app: ${data.name}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
