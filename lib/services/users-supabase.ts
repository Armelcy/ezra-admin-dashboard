/**
 * Users Supabase Service
 * Real database operations for user management
 */

import { supabase } from '@/lib/supabase';
import {
  listFromTable,
  getById,
  updateRecord,
  deleteRecord,
  buildSearchQuery,
} from '@/lib/supabase-base';
import type {
  Profile,
  ListParams,
  PaginatedResponse,
  UserFilters,
} from '@/types/database';

/**
 * List users with pagination and filters
 */
export async function listUsers(
  params: ListParams & { filters?: UserFilters } = {}
): Promise<PaginatedResponse<Profile>> {
  const { search, ...restParams } = params;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' });

  // Apply filters
  if (params.filters) {
    const { role, is_active, is_verified } = params.filters;
    if (role) query = query.eq('role', role);
    if (is_active !== undefined) query = query.eq('is_active', is_active);
    if (is_verified !== undefined) query = query.eq('is_verified', is_verified);
  }

  // Apply search
  if (search) {
    query = query.or(
      buildSearchQuery(['full_name', 'email', 'phone'], search)
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
    console.error('Error fetching users:', error);
    throw error;
  }

  return {
    items: (data || []) as Profile[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Get user by ID
 */
export async function getUser(id: string): Promise<Profile | null> {
  return getById<Profile>('profiles', id);
}

/**
 * Update user
 */
export async function updateUser(
  id: string,
  updates: Partial<Profile>
): Promise<Profile> {
  return updateRecord<Profile>('profiles', id, updates);
}

/**
 * Toggle user active status
 */
export async function toggleUserStatus(id: string): Promise<Profile> {
  const user = await getUser(id);
  if (!user) throw new Error('User not found');

  return updateRecord<Profile>('profiles', id, {
    is_active: !user.is_active,
  });
}

/**
 * Verify user
 */
export async function verifyUser(id: string): Promise<Profile> {
  return updateRecord<Profile>('profiles', id, {
    is_verified: true,
  });
}

/**
 * Delete user (soft delete)
 */
export async function deleteUser(id: string): Promise<boolean> {
  return deleteRecord('profiles', id, true);
}

/**
 * Get user statistics
 */
export async function getUserStats() {
  const { data, error } = await supabase
    .from('profiles')
    .select('role, is_active, is_verified');

  if (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }

  const stats = {
    total: data?.length || 0,
    customers: data?.filter(u => u.role === 'customer').length || 0,
    providers: data?.filter(u => u.role === 'provider').length || 0,
    admins: data?.filter(u => u.role === 'admin').length || 0,
    active: data?.filter(u => u.is_active).length || 0,
    verified: data?.filter(u => u.is_verified).length || 0,
  };

  return stats;
}

/**
 * Search users by name, email, or phone
 */
export async function searchUsers(searchTerm: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(buildSearchQuery(['full_name', 'email', 'phone'], searchTerm))
    .limit(10);

  if (error) {
    console.error('Error searching users:', error);
    throw error;
  }

  return (data || []) as Profile[];
}
