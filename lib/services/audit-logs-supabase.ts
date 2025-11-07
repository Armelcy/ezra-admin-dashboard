/**
 * Audit Logs Supabase Service
 * Real database operations for audit log management
 */

import { supabase } from '@/lib/supabase';
import type {
  AuditLog,
  ListParams,
  PaginatedResponse,
} from '@/types/database';

/**
 * List audit logs with pagination and filters
 */
export async function listAuditLogs(
  params: ListParams & {
    filters?: {
      table_name?: string;
      action?: 'INSERT' | 'UPDATE' | 'DELETE';
      user_id?: string;
      date_from?: string;
      date_to?: string;
    }
  } = {}
): Promise<PaginatedResponse<AuditLog>> {
  const { search, ...restParams } = params;

  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      user:profiles!audit_logs_user_id_fkey(*)
    `, { count: 'exact' });

  // Apply filters
  if (params.filters) {
    const { table_name, action, user_id, date_from, date_to } = params.filters;
    if (table_name) query = query.eq('table_name', table_name);
    if (action) query = query.eq('action', action);
    if (user_id) query = query.eq('user_id', user_id);
    if (date_from) query = query.gte('created_at', date_from);
    if (date_to) query = query.lte('created_at', date_to);
  }

  // Apply search (search by record_id)
  if (search) {
    query = query.or(`record_id.ilike.%${search}%,table_name.ilike.%${search}%`);
  }

  // Pagination
  const page = params.page || 1;
  const limit = params.limit || 50;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit - 1;
  query = query.range(startIndex, endIndex);

  // Sorting
  const sortBy = params.sortBy || 'created_at';
  const sortOrder = params.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }

  return {
    items: (data || []) as AuditLog[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Get audit log by ID
 */
export async function getAuditLog(id: string): Promise<AuditLog | null> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      user:profiles!audit_logs_user_id_fkey(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching audit log:', error);
    throw error;
  }

  return data as AuditLog;
}

/**
 * Get audit logs for a specific record
 */
export async function getRecordAuditLogs(
  tableName: string,
  recordId: string
): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      user:profiles!audit_logs_user_id_fkey(*)
    `)
    .eq('table_name', tableName)
    .eq('record_id', recordId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching record audit logs:', error);
    throw error;
  }

  return (data || []) as AuditLog[];
}

/**
 * Get recent activity
 */
export async function getRecentActivity(limit: number = 50): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      user:profiles!audit_logs_user_id_fkey(*)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }

  return (data || []) as AuditLog[];
}

/**
 * Get activity for a specific user
 */
export async function getUserActivity(
  userId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching user activity:', error);
    throw error;
  }

  return (data || []) as AuditLog[];
}

/**
 * Get audit statistics
 */
export async function getAuditStats() {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('action, table_name');

  if (error) {
    console.error('Error fetching audit stats:', error);
    throw error;
  }

  const stats = {
    total: data?.length || 0,
    inserts: data?.filter(a => a.action === 'INSERT').length || 0,
    updates: data?.filter(a => a.action === 'UPDATE').length || 0,
    deletes: data?.filter(a => a.action === 'DELETE').length || 0,
    by_table: data?.reduce((acc, log) => {
      acc[log.table_name] = (acc[log.table_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
  };

  return stats;
}
