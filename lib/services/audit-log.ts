/**
 * Audit Logging Service
 * Tracks all security-relevant events in the admin dashboard
 */

import { supabase } from '@/lib/supabase';

export type AuditEventType =
  | 'login_success'
  | 'login_failed'
  | 'login_locked'
  | 'logout'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | '2fa_enabled'
  | '2fa_disabled'
  | '2fa_verified'
  | '2fa_failed'
  | '2fa_backup_used'
  | 'role_changed'
  | 'permissions_changed'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_deactivated'
  | 'user_reactivated'
  | 'session_expired'
  | 'csrf_violation'
  | 'rate_limit_exceeded'
  | 'unauthorized_access_attempt'
  | 'data_export'
  | 'sensitive_data_accessed';

export interface AuditLogEntry {
  id?: string;
  event_type: AuditEventType;
  actor_id?: string;
  actor_email?: string;
  actor_name?: string;
  target_id?: string;
  target_type?: string;
  target_email?: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface AuditLogQuery {
  event_type?: AuditEventType | AuditEventType[];
  actor_id?: string;
  target_id?: string;
  success?: boolean;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'created_at'>): Promise<void> {
  try {
    const { error } = await supabase
      .from('admin_audit_logs')
      .insert([{
        event_type: entry.event_type,
        actor_id: entry.actor_id,
        actor_email: entry.actor_email,
        actor_name: entry.actor_name,
        target_id: entry.target_id,
        target_type: entry.target_type,
        target_email: entry.target_email,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
        success: entry.success,
        error_message: entry.error_message,
        metadata: entry.metadata || {},
      }]);

    if (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - logging failure shouldn't break the main flow
    }
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Query audit logs
 */
export async function queryAuditLogs(query: AuditLogQuery): Promise<{
  logs: AuditLogEntry[];
  total: number;
}> {
  try {
    let supabaseQuery = supabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (query.event_type) {
      if (Array.isArray(query.event_type)) {
        supabaseQuery = supabaseQuery.in('event_type', query.event_type);
      } else {
        supabaseQuery = supabaseQuery.eq('event_type', query.event_type);
      }
    }

    if (query.actor_id) {
      supabaseQuery = supabaseQuery.eq('actor_id', query.actor_id);
    }

    if (query.target_id) {
      supabaseQuery = supabaseQuery.eq('target_id', query.target_id);
    }

    if (query.success !== undefined) {
      supabaseQuery = supabaseQuery.eq('success', query.success);
    }

    if (query.start_date) {
      supabaseQuery = supabaseQuery.gte('created_at', query.start_date);
    }

    if (query.end_date) {
      supabaseQuery = supabaseQuery.lte('created_at', query.end_date);
    }

    // Pagination
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    supabaseQuery = supabaseQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await supabaseQuery;

    if (error) {
      console.error('Failed to query audit logs:', error);
      throw error;
    }

    return {
      logs: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error('Failed to query audit logs:', error);
    throw error;
  }
}

/**
 * Get recent audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 20
): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .or(`actor_id.eq.${userId},target_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get user audit logs:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get user audit logs:', error);
    throw error;
  }
}

/**
 * Get security events (failed logins, lockouts, etc.)
 */
export async function getSecurityEvents(
  hours: number = 24,
  limit: number = 100
): Promise<AuditLogEntry[]> {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .in('event_type', [
        'login_failed',
        'login_locked',
        '2fa_failed',
        'csrf_violation',
        'rate_limit_exceeded',
        'unauthorized_access_attempt',
      ])
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get security events:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get security events:', error);
    throw error;
  }
}

/**
 * Get audit statistics
 */
export async function getAuditStatistics(days: number = 7): Promise<{
  totalEvents: number;
  eventsByType: Record<string, number>;
  failedLogins: number;
  successfulLogins: number;
  lockouts: number;
  uniqueUsers: number;
}> {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('event_type, success, actor_id')
      .gte('created_at', since);

    if (error) {
      throw error;
    }

    const events = data || [];
    const eventsByType: Record<string, number> = {};
    const uniqueActors = new Set<string>();

    let failedLogins = 0;
    let successfulLogins = 0;
    let lockouts = 0;

    events.forEach((event) => {
      // Count by type
      eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;

      // Count specific events
      if (event.event_type === 'login_failed') failedLogins++;
      if (event.event_type === 'login_success') successfulLogins++;
      if (event.event_type === 'login_locked') lockouts++;

      // Count unique actors
      if (event.actor_id) uniqueActors.add(event.actor_id);
    });

    return {
      totalEvents: events.length,
      eventsByType,
      failedLogins,
      successfulLogins,
      lockouts,
      uniqueUsers: uniqueActors.size,
    };
  } catch (error) {
    console.error('Failed to get audit statistics:', error);
    throw error;
  }
}

/**
 * Log authentication event
 */
export async function logAuthEvent(
  type: 'login_success' | 'login_failed' | 'logout' | 'session_expired',
  userId?: string,
  email?: string,
  ipAddress?: string,
  userAgent?: string,
  errorMessage?: string
): Promise<void> {
  await logAuditEvent({
    event_type: type,
    actor_id: userId,
    actor_email: email,
    ip_address: ipAddress,
    user_agent: userAgent,
    success: type === 'login_success' || type === 'logout',
    error_message: errorMessage,
  });
}

/**
 * Log role change
 */
export async function logRoleChange(
  actorId: string,
  actorEmail: string,
  targetId: string,
  targetEmail: string,
  oldRole: string,
  newRole: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    event_type: 'role_changed',
    actor_id: actorId,
    actor_email: actorEmail,
    target_id: targetId,
    target_type: 'user',
    target_email: targetEmail,
    ip_address: ipAddress,
    user_agent: userAgent,
    success: true,
    metadata: {
      old_role: oldRole,
      new_role: newRole,
    },
  });
}

/**
 * Log data export
 */
export async function logDataExport(
  actorId: string,
  actorEmail: string,
  dataType: string,
  recordCount: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    event_type: 'data_export',
    actor_id: actorId,
    actor_email: actorEmail,
    ip_address: ipAddress,
    user_agent: userAgent,
    success: true,
    metadata: {
      data_type: dataType,
      record_count: recordCount,
    },
  });
}
