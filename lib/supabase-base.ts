/**
 * Base Supabase Utilities
 * Reusable functions for common database operations
 */

import { supabase } from './supabase';
import type { ListParams, PaginatedResponse } from '@/types/database';

/**
 * Generic list function with pagination, search, and filters
 */
export async function listFromTable<T>(
  tableName: string,
  params: ListParams = {},
  selectFields: string = '*',
  joins?: string[]
): Promise<PaginatedResponse<T>> {
  const { page = 1, limit = 20, search, sortBy = 'created_at', sortOrder = 'desc', filters } = params;

  let query = supabase
    .from(tableName)
    .select(selectFields, { count: 'exact' });

  // Apply filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    });
  }

  // Apply search if provided (override with specific fields per table)
  if (search) {
    // Note: search implementation is table-specific, handled in individual services
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit - 1;
  query = query.range(startIndex, endIndex);

  // Sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error, count } = await query;

  if (error) {
    console.error(`Error fetching from ${tableName}:`, error);
    throw error;
  }

  return {
    items: (data || []) as T[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Get single record by ID
 */
export async function getById<T>(
  tableName: string,
  id: string,
  selectFields: string = '*'
): Promise<T | null> {
  const { data, error } = await supabase
    .from(tableName)
    .select(selectFields)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error(`Error fetching ${tableName} by ID:`, error);
    throw error;
  }

  return data as T;
}

/**
 * Create a new record
 */
export async function createRecord<T>(
  tableName: string,
  data: Partial<T>
): Promise<T> {
  const { data: created, error } = await supabase
    .from(tableName)
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error(`Error creating ${tableName}:`, error);
    throw error;
  }

  return created as T;
}

/**
 * Update a record by ID
 */
export async function updateRecord<T>(
  tableName: string,
  id: string,
  updates: Partial<T>
): Promise<T> {
  const { data, error } = await supabase
    .from(tableName)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating ${tableName}:`, error);
    throw error;
  }

  return data as T;
}

/**
 * Delete a record by ID (soft delete if is_active column exists)
 */
export async function deleteRecord(
  tableName: string,
  id: string,
  softDelete: boolean = true
): Promise<boolean> {
  if (softDelete) {
    // Try soft delete first
    const { error } = await supabase
      .from(tableName)
      .update({ is_active: false })
      .eq('id', id);

    if (!error) return true;
  }

  // Hard delete
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    throw error;
  }

  return true;
}

/**
 * Count records with optional filters
 */
export async function countRecords(
  tableName: string,
  filters?: Record<string, any>
): Promise<number> {
  let query = supabase
    .from(tableName)
    .select('id', { count: 'exact', head: true });

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
  }

  const { count, error } = await query;

  if (error) {
    console.error(`Error counting ${tableName}:`, error);
    throw error;
  }

  return count || 0;
}

/**
 * Execute a custom query
 */
export async function executeQuery<T>(
  query: any
): Promise<T[]> {
  const { data, error } = await query;

  if (error) {
    console.error('Error executing query:', error);
    throw error;
  }

  return (data || []) as T[];
}

/**
 * Get current admin user
 */
export async function getCurrentAdmin() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No user logged in');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile || profile.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }

  return profile;
}

/**
 * Build search query for multiple fields
 */
export function buildSearchQuery(fields: string[], searchTerm: string): string {
  return fields
    .map(field => `${field}.ilike.%${searchTerm}%`)
    .join(',');
}

/**
 * Format date for Supabase queries
 */
export function formatDateForQuery(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toISOString();
}

/**
 * Calculate pagination metadata
 */
export function getPaginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasNext,
    hasPrev,
  };
}
