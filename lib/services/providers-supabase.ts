/**
 * Providers Supabase Service
 * Real database operations for provider management
 */

import { supabase } from '@/lib/supabase';
import {
  getById,
  updateRecord,
  deleteRecord,
  buildSearchQuery,
} from '@/lib/supabase-base';
import type {
  Provider,
  Profile,
  ListParams,
  PaginatedResponse,
  ProviderFilters,
  ProviderStats,
} from '@/types/database';

/**
 * List providers with pagination and filters
 */
export async function listProviders(
  params: ListParams & { filters?: ProviderFilters } = {}
): Promise<PaginatedResponse<Provider>> {
  const { search, ...restParams } = params;

  let query = supabase
    .from('providers')
    .select(`
      *,
      user:profiles!providers_user_id_fkey(*)
    `, { count: 'exact' });

  // Apply filters
  if (params.filters) {
    const { category, is_active, cni_verified, min_rating } = params.filters;
    if (category) query = query.eq('category', category);
    if (is_active !== undefined) query = query.eq('is_active', is_active);
    if (cni_verified !== undefined) query = query.eq('cni_verified', cni_verified);
    if (min_rating) query = query.gte('rating', min_rating);
  }

  // Apply search
  if (search) {
    query = query.or(
      buildSearchQuery(['business_name', 'category', 'cni_number'], search)
    );
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
    console.error('Error fetching providers:', error);
    throw error;
  }

  return {
    items: (data || []) as Provider[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Get provider by ID with user profile
 */
export async function getProvider(id: string): Promise<Provider | null> {
  const { data, error } = await supabase
    .from('providers')
    .select(`
      *,
      user:profiles!providers_user_id_fkey(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching provider:', error);
    throw error;
  }

  return data as Provider;
}

/**
 * Update provider
 */
export async function updateProvider(
  id: string,
  updates: Partial<Provider>
): Promise<Provider> {
  return updateRecord<Provider>('providers', id, updates);
}

/**
 * Verify provider CNI
 */
export async function verifyCNI(id: string, verified: boolean): Promise<Provider> {
  return updateRecord<Provider>('providers', id, {
    cni_verified: verified,
  });
}

/**
 * Toggle provider active status
 */
export async function toggleProviderStatus(id: string): Promise<Provider> {
  const provider = await getProvider(id);
  if (!provider) throw new Error('Provider not found');

  return updateRecord<Provider>('providers', id, {
    is_active: !provider.is_active,
  });
}

/**
 * Delete provider (soft delete)
 */
export async function deleteProvider(id: string): Promise<boolean> {
  return deleteRecord('providers', id, true);
}

/**
 * Get provider statistics
 */
export async function getProviderStats(): Promise<ProviderStats[]> {
  const { data, error } = await supabase
    .from('provider_stats')
    .select('*')
    .order('total_earnings', { ascending: false });

  if (error) {
    console.error('Error fetching provider stats:', error);
    throw error;
  }

  return (data || []) as ProviderStats[];
}

/**
 * Get pending CNI verifications
 */
export async function getPendingVerifications(): Promise<Provider[]> {
  const { data, error } = await supabase
    .from('providers')
    .select(`
      *,
      user:profiles!providers_user_id_fkey(*)
    `)
    .eq('cni_verified', false)
    .not('cni_number', 'is', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching pending verifications:', error);
    throw error;
  }

  return (data || []) as Provider[];
}

/**
 * Get provider earnings
 */
export async function getProviderEarnings(providerId: string) {
  const { data, error } = await supabase
    .rpc('get_provider_earnings', { provider_id: providerId });

  if (error) {
    console.error('Error fetching provider earnings:', error);
    throw error;
  }

  return data[0] || { total_earnings: 0, pending_payouts: 0 };
}

/**
 * Search providers
 */
export async function searchProviders(searchTerm: string): Promise<Provider[]> {
  const { data, error } = await supabase
    .from('providers')
    .select(`
      *,
      user:profiles!providers_user_id_fkey(*)
    `)
    .or(buildSearchQuery(['business_name', 'category'], searchTerm))
    .limit(10);

  if (error) {
    console.error('Error searching providers:', error);
    throw error;
  }

  return (data || []) as Provider[];
}
