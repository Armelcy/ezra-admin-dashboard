/**
 * Bookings Supabase Service
 * Real database operations for booking management
 */

import { supabase } from '@/lib/supabase';
import {
  getById,
  updateRecord,
  buildSearchQuery,
} from '@/lib/supabase-base';
import type {
  Booking,
  BookingFilters,
  ListParams,
  PaginatedResponse,
} from '@/types/database';

/**
 * List bookings with pagination and filters
 */
export async function listBookings(
  params: ListParams & { filters?: BookingFilters } = {}
): Promise<PaginatedResponse<Booking>> {
  const { search, ...restParams } = params;

  let query = supabase
    .from('bookings')
    .select(`
      *,
      customer:profiles!bookings_customer_id_fkey(*),
      provider:providers!bookings_provider_id_fkey(
        *,
        user:profiles!providers_user_id_fkey(*)
      )
    `, { count: 'exact' });

  // Apply filters
  if (params.filters) {
    const { status, payment_status, customer_id, provider_id, date_from, date_to } = params.filters;
    if (status) query = query.eq('status', status);
    if (payment_status) query = query.eq('payment_status', payment_status);
    if (customer_id) query = query.eq('customer_id', customer_id);
    if (provider_id) query = query.eq('provider_id', provider_id);
    if (date_from) query = query.gte('scheduled_date', date_from);
    if (date_to) query = query.lte('scheduled_date', date_to);
  }

  // Apply search (search by service name)
  if (search) {
    query = query.ilike('service_name', `%${search}%`);
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
    console.error('Error fetching bookings:', error);
    throw error;
  }

  return {
    items: (data || []) as Booking[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Get booking by ID with related data
 */
export async function getBooking(id: string): Promise<Booking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      customer:profiles!bookings_customer_id_fkey(*),
      provider:providers!bookings_provider_id_fkey(
        *,
        user:profiles!providers_user_id_fkey(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching booking:', error);
    throw error;
  }

  return data as Booking;
}

/**
 * Update booking
 */
export async function updateBooking(
  id: string,
  updates: Partial<Booking>
): Promise<Booking> {
  return updateRecord<Booking>('bookings', id, updates);
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
  id: string,
  status: Booking['status']
): Promise<Booking> {
  return updateRecord<Booking>('bookings', id, { status });
}

/**
 * Release escrow for booking
 */
export async function releaseEscrow(id: string): Promise<Booking> {
  return updateRecord<Booking>('bookings', id, {
    escrow_released: true,
  });
}

/**
 * Cancel booking
 */
export async function cancelBooking(id: string, reason?: string): Promise<Booking> {
  return updateRecord<Booking>('bookings', id, {
    status: 'cancelled',
  });
}

/**
 * Get booking statistics
 */
export async function getBookingStats() {
  const { data, error } = await supabase
    .from('bookings')
    .select('status, payment_status, total_amount, service_fee');

  if (error) {
    console.error('Error fetching booking stats:', error);
    throw error;
  }

  const stats = {
    total: data?.length || 0,
    pending: data?.filter(b => b.status === 'pending').length || 0,
    confirmed: data?.filter(b => b.status === 'confirmed').length || 0,
    in_progress: data?.filter(b => b.status === 'in_progress').length || 0,
    completed: data?.filter(b => b.status === 'completed').length || 0,
    cancelled: data?.filter(b => b.status === 'cancelled').length || 0,
    total_revenue: data?.reduce((sum, b) => sum + (b.service_fee || 0), 0) || 0,
    total_volume: data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0,
  };

  return stats;
}

/**
 * Get bookings requiring action
 */
export async function getBookingsRequiringAction(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      customer:profiles!bookings_customer_id_fkey(*),
      provider:providers!bookings_provider_id_fkey(
        *,
        user:profiles!providers_user_id_fkey(*)
      )
    `)
    .in('status', ['pending', 'confirmed'])
    .eq('escrow_released', false)
    .order('scheduled_date', { ascending: true });

  if (error) {
    console.error('Error fetching bookings requiring action:', error);
    throw error;
  }

  return (data || []) as Booking[];
}

/**
 * Get escrow bookings pending release
 */
export async function getPendingEscrowReleases(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      customer:profiles!bookings_customer_id_fkey(*),
      provider:providers!bookings_provider_id_fkey(
        *,
        user:profiles!providers_user_id_fkey(*)
      )
    `)
    .eq('status', 'completed')
    .eq('escrow_released', false)
    .order('updated_at', { ascending: true });

  if (error) {
    console.error('Error fetching pending escrow releases:', error);
    throw error;
  }

  return (data || []) as Booking[];
}
