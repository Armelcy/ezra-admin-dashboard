/**
 * Transactions Supabase Service
 * Real database operations for transaction management
 */

import { supabase } from '@/lib/supabase';
import {
  getById,
  updateRecord,
} from '@/lib/supabase-base';
import type {
  Transaction,
  TransactionFilters,
  ListParams,
  PaginatedResponse,
} from '@/types/database';

/**
 * List transactions with pagination and filters
 */
export async function listTransactions(
  params: ListParams & { filters?: TransactionFilters } = {}
): Promise<PaginatedResponse<Transaction>> {
  const { search, ...restParams } = params;

  let query = supabase
    .from('transactions')
    .select(`
      *,
      booking:bookings!transactions_booking_id_fkey(
        *,
        customer:profiles!bookings_customer_id_fkey(*),
        provider:providers!bookings_provider_id_fkey(*)
      )
    `, { count: 'exact' });

  // Apply filters
  if (params.filters) {
    const { type, status, payment_method, date_from, date_to } = params.filters;
    if (type) query = query.eq('transaction_type', type);
    if (status) query = query.eq('status', status);
    if (payment_method) query = query.eq('payment_method', payment_method);
    if (date_from) query = query.gte('created_at', date_from);
    if (date_to) query = query.lte('created_at', date_to);
  }

  // Apply search (search by external reference)
  if (search) {
    query = query.ilike('external_reference', `%${search}%`);
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
    console.error('Error fetching transactions:', error);
    throw error;
  }

  return {
    items: (data || []) as Transaction[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Get transaction by ID
 */
export async function getTransaction(id: string): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      booking:bookings!transactions_booking_id_fkey(
        *,
        customer:profiles!bookings_customer_id_fkey(*),
        provider:providers!bookings_provider_id_fkey(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching transaction:', error);
    throw error;
  }

  return data as Transaction;
}

/**
 * Update transaction
 */
export async function updateTransaction(
  id: string,
  updates: Partial<Transaction>
): Promise<Transaction> {
  return updateRecord<Transaction>('transactions', id, updates);
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  id: string,
  status: Transaction['status']
): Promise<Transaction> {
  return updateRecord<Transaction>('transactions', id, { status });
}

/**
 * Get transaction statistics
 */
export async function getTransactionStats() {
  const { data, error } = await supabase
    .from('transactions')
    .select('transaction_type, status, amount, payment_method');

  if (error) {
    console.error('Error fetching transaction stats:', error);
    throw error;
  }

  const stats = {
    total: data?.length || 0,
    payments: data?.filter(t => t.transaction_type === 'payment').length || 0,
    refunds: data?.filter(t => t.transaction_type === 'refund').length || 0,
    payouts: data?.filter(t => t.transaction_type === 'payout').length || 0,
    fees: data?.filter(t => t.transaction_type === 'fee').length || 0,
    pending: data?.filter(t => t.status === 'pending').length || 0,
    completed: data?.filter(t => t.status === 'completed').length || 0,
    failed: data?.filter(t => t.status === 'failed').length || 0,
    total_amount: data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
    mtn_momo: data?.filter(t => t.payment_method === 'mtn_momo').length || 0,
    orange_money: data?.filter(t => t.payment_method === 'orange_money').length || 0,
  };

  return stats;
}

/**
 * Get pending transactions
 */
export async function getPendingTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      booking:bookings!transactions_booking_id_fkey(
        *,
        customer:profiles!bookings_customer_id_fkey(*),
        provider:providers!bookings_provider_id_fkey(*)
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching pending transactions:', error);
    throw error;
  }

  return (data || []) as Transaction[];
}
