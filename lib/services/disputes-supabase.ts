/**
 * Disputes Supabase Service
 * Real database operations for dispute management
 */

import { supabase } from '@/lib/supabase';
import {
  getById,
  updateRecord,
} from '@/lib/supabase-base';
import type {
  Dispute,
  DisputeFilters,
  ListParams,
  PaginatedResponse,
} from '@/types/database';

/**
 * List disputes with pagination and filters
 */
export async function listDisputes(
  params: ListParams & { filters?: DisputeFilters } = {}
): Promise<PaginatedResponse<Dispute>> {
  const { search, ...restParams } = params;

  let query = supabase
    .from('disputes')
    .select(`
      *,
      booking:bookings!disputes_booking_id_fkey(*),
      reporter:profiles!disputes_reporter_id_fkey(*),
      reported:profiles!disputes_reported_id_fkey(*)
    `, { count: 'exact' });

  // Apply filters
  if (params.filters) {
    const { status, reporter_id, reported_id } = params.filters;
    if (status) query = query.eq('status', status);
    if (reporter_id) query = query.eq('reporter_id', reporter_id);
    if (reported_id) query = query.eq('reported_id', reported_id);
  }

  // Apply search (search by reason)
  if (search) {
    query = query.or(`reason.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Pagination
  const page = params.page || 1;
  const limit = params.limit || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit - 1;
  query = query.range(startIndex, endIndex);

  // Sorting
  const sortBy = params.sortBy || 'created_at';
  const sortOrder = params.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching disputes:', error);
    throw error;
  }

  return {
    items: (data || []) as Dispute[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Get dispute by ID
 */
export async function getDispute(id: string): Promise<Dispute | null> {
  const { data, error } = await supabase
    .from('disputes')
    .select(`
      *,
      booking:bookings!disputes_booking_id_fkey(*),
      reporter:profiles!disputes_reporter_id_fkey(*),
      reported:profiles!disputes_reported_id_fkey(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching dispute:', error);
    throw error;
  }

  return data as Dispute;
}

/**
 * Update dispute
 */
export async function updateDispute(
  id: string,
  updates: Partial<Dispute>
): Promise<Dispute> {
  return updateRecord<Dispute>('disputes', id, updates);
}

/**
 * Update dispute status
 */
export async function updateDisputeStatus(
  id: string,
  status: Dispute['status'],
  resolution?: string,
  adminNotes?: string
): Promise<Dispute> {
  const updates: Partial<Dispute> = { status };
  if (resolution) updates.resolution = resolution;
  if (adminNotes) updates.admin_notes = adminNotes;

  return updateRecord<Dispute>('disputes', id, updates);
}

/**
 * Resolve dispute
 */
export async function resolveDispute(
  id: string,
  resolution: string,
  adminNotes?: string
): Promise<Dispute> {
  return updateRecord<Dispute>('disputes', id, {
    status: 'resolved',
    resolution,
    admin_notes: adminNotes,
  });
}

/**
 * Get dispute statistics
 */
export async function getDisputeStats() {
  const { data, error } = await supabase
    .from('disputes')
    .select('status, reason');

  if (error) {
    console.error('Error fetching dispute stats:', error);
    throw error;
  }

  const stats = {
    total: data?.length || 0,
    open: data?.filter(d => d.status === 'open').length || 0,
    investigating: data?.filter(d => d.status === 'investigating').length || 0,
    resolved: data?.filter(d => d.status === 'resolved').length || 0,
    closed: data?.filter(d => d.status === 'closed').length || 0,
  };

  return stats;
}

/**
 * Get open disputes
 */
export async function getOpenDisputes(): Promise<Dispute[]> {
  const { data, error } = await supabase
    .from('disputes')
    .select(`
      *,
      booking:bookings!disputes_booking_id_fkey(*),
      reporter:profiles!disputes_reporter_id_fkey(*),
      reported:profiles!disputes_reported_id_fkey(*)
    `)
    .in('status', ['open', 'investigating'])
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching open disputes:', error);
    throw error;
  }

  return (data || []) as Dispute[];
}
