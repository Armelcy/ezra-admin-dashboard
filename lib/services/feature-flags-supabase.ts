/**
 * Feature Flags Supabase Service
 * Handles all operations for the feature flags system
 */

import { supabase } from '@/lib/supabase';
import { listFromTable, getById, updateRecord, createRecord, type PaginatedResponse, type ListParams } from '@/lib/supabase-base';

// Types
export type FlagTargetType = 'all' | 'percentage' | 'user_ids' | 'user_roles' | 'custom';
export type FlagCategory = 'experimental' | 'beta' | 'stable' | 'deprecated';
export type Platform = 'ios' | 'android' | 'web';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  target_type: FlagTargetType;
  rollout_percentage: number;
  target_user_ids: string[];
  target_user_roles: string[];
  custom_rules: Record<string, any>;
  category?: FlagCategory;
  version?: string;
  min_app_version?: string;
  max_app_version?: string;
  platforms: Platform[];
  start_date?: string;
  end_date?: string;
  metadata: Record<string, any>;
  tags: string[];
  created_by?: string;
  created_by_name?: string;
  last_modified_by?: string;
  last_modified_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface FlagHistory {
  id: string;
  flag_id: string;
  flag_key: string;
  action: 'created' | 'enabled' | 'disabled' | 'updated' | 'deleted';
  previous_state?: Record<string, any>;
  new_state?: Record<string, any>;
  changes?: Record<string, any>;
  changed_by?: string;
  changed_by_name?: string;
  reason?: string;
  created_at: string;
}

export interface FlagFilters {
  enabled?: boolean;
  category?: FlagCategory;
  platform?: Platform;
}

export interface CreateFlagData {
  key: string;
  name: string;
  description?: string;
  enabled?: boolean;
  target_type?: FlagTargetType;
  rollout_percentage?: number;
  target_user_ids?: string[];
  target_user_roles?: string[];
  category?: FlagCategory;
  platforms?: Platform[];
  created_by?: string;
  created_by_name?: string;
}

export interface UpdateFlagData {
  name?: string;
  description?: string;
  enabled?: boolean;
  target_type?: FlagTargetType;
  rollout_percentage?: number;
  target_user_ids?: string[];
  target_user_roles?: string[];
  category?: FlagCategory;
  platforms?: Platform[];
  last_modified_by?: string;
  last_modified_by_name?: string;
}

/**
 * List all feature flags with filters and pagination
 */
export async function listFlags(
  params: ListParams & { filters?: FlagFilters } = {}
): Promise<PaginatedResponse<FeatureFlag>> {
  const { page = 1, limit = 50, search, sortBy = 'created_at', sortOrder = 'desc', filters } = params;

  let query = supabase
    .from('feature_flags')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters) {
    if (filters.enabled !== undefined) query = query.eq('enabled', filters.enabled);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.platform) query = query.contains('platforms', [filters.platform]);
  }

  // Search
  if (search) {
    query = query.or(`key.ilike.%${search}%,name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error listing feature flags:', error);
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
 * Get a single feature flag by ID
 */
export async function getFlag(flagId: string): Promise<FeatureFlag | null> {
  return getById<FeatureFlag>('feature_flags', flagId);
}

/**
 * Get a feature flag by key
 */
export async function getFlagByKey(key: string): Promise<FeatureFlag | null> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('key', key)
    .single();

  if (error) {
    console.error('Error getting flag by key:', error);
    return null;
  }

  return data;
}

/**
 * Create a new feature flag
 */
export async function createFlag(flagData: CreateFlagData): Promise<FeatureFlag> {
  const { data, error } = await supabase
    .from('feature_flags')
    .insert([{
      ...flagData,
      enabled: flagData.enabled ?? false,
      target_type: flagData.target_type || 'all',
      rollout_percentage: flagData.rollout_percentage || 100,
      target_user_ids: flagData.target_user_ids || [],
      target_user_roles: flagData.target_user_roles || [],
      custom_rules: {},
      platforms: flagData.platforms || ['ios', 'android', 'web'],
      metadata: {},
      tags: [],
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating feature flag:', error);
    throw error;
  }

  return data;
}

/**
 * Update a feature flag
 */
export async function updateFlag(
  flagId: string,
  updates: UpdateFlagData
): Promise<FeatureFlag> {
  return updateRecord<FeatureFlag>('feature_flags', flagId, updates);
}

/**
 * Toggle a feature flag on/off
 */
export async function toggleFlag(
  flagId: string,
  enabled: boolean,
  adminId?: string,
  adminName?: string
): Promise<FeatureFlag> {
  return updateRecord<FeatureFlag>('feature_flags', flagId, {
    enabled,
    last_modified_by: adminId,
    last_modified_by_name: adminName,
  });
}

/**
 * Delete a feature flag
 */
export async function deleteFlag(flagId: string): Promise<boolean> {
  const { error } = await supabase
    .from('feature_flags')
    .delete()
    .eq('id', flagId);

  if (error) {
    console.error('Error deleting feature flag:', error);
    throw error;
  }

  return true;
}

/**
 * Get flag history
 */
export async function getFlagHistory(flagId: string): Promise<FlagHistory[]> {
  const { data, error } = await supabase
    .from('feature_flag_history')
    .select('*')
    .eq('flag_id', flagId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting flag history:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get all flag history (recent changes)
 */
export async function getRecentFlagHistory(limit: number = 50): Promise<FlagHistory[]> {
  const { data, error } = await supabase
    .from('feature_flag_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting recent flag history:', error);
    throw error;
  }

  return data || [];
}

/**
 * Check if a flag is enabled for a specific user
 * This function calls the database function for server-side evaluation
 */
export async function isFlagEnabledForUser(
  flagKey: string,
  userId: string,
  userRole?: string,
  platform: Platform = 'web'
): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_flag_enabled_for_user', {
    p_flag_key: flagKey,
    p_user_id: userId,
    p_user_role: userRole,
    p_platform: platform,
  });

  if (error) {
    console.error('Error checking flag for user:', error);
    return false;
  }

  return data || false;
}

/**
 * Get all enabled flags for a user
 * Returns only the flags that are enabled for the specific user
 */
export async function getUserFlags(
  userId: string,
  userRole?: string,
  platform: Platform = 'web'
): Promise<Record<string, boolean>> {
  const { data: flags, error } = await supabase
    .from('feature_flags')
    .select('key, enabled, target_type, rollout_percentage, target_user_ids, target_user_roles, platforms');

  if (error) {
    console.error('Error getting user flags:', error);
    return {};
  }

  if (!flags) return {};

  const userFlags: Record<string, boolean> = {};

  for (const flag of flags) {
    // Check if flag is globally disabled
    if (!flag.enabled) {
      userFlags[flag.key] = false;
      continue;
    }

    // Check platform
    if (!flag.platforms.includes(platform)) {
      userFlags[flag.key] = false;
      continue;
    }

    // Check targeting
    let isEnabled = false;

    switch (flag.target_type) {
      case 'all':
        isEnabled = true;
        break;

      case 'percentage':
        // Consistent hashing based on user ID
        const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const percentage = hash % 100;
        isEnabled = percentage < flag.rollout_percentage;
        break;

      case 'user_ids':
        isEnabled = flag.target_user_ids.includes(userId);
        break;

      case 'user_roles':
        isEnabled = userRole ? flag.target_user_roles.includes(userRole) : false;
        break;

      case 'custom':
        // For custom rules, default to global enabled state
        // You can implement more complex logic here
        isEnabled = true;
        break;
    }

    userFlags[flag.key] = isEnabled;
  }

  return userFlags;
}

/**
 * Get feature flag statistics
 */
export async function getFlagStats() {
  const { data: flags, error } = await supabase
    .from('feature_flags')
    .select('enabled, target_type, category, platforms');

  if (error) {
    console.error('Error getting flag stats:', error);
    throw error;
  }

  const stats = {
    total: flags?.length || 0,
    enabled: flags?.filter((f) => f.enabled).length || 0,
    disabled: flags?.filter((f) => !f.enabled).length || 0,
    byTargetType: {
      all: flags?.filter((f) => f.target_type === 'all').length || 0,
      percentage: flags?.filter((f) => f.target_type === 'percentage').length || 0,
      user_ids: flags?.filter((f) => f.target_type === 'user_ids').length || 0,
      user_roles: flags?.filter((f) => f.target_type === 'user_roles').length || 0,
      custom: flags?.filter((f) => f.target_type === 'custom').length || 0,
    },
    byCategory: {
      experimental: flags?.filter((f) => f.category === 'experimental').length || 0,
      beta: flags?.filter((f) => f.category === 'beta').length || 0,
      stable: flags?.filter((f) => f.category === 'stable').length || 0,
      deprecated: flags?.filter((f) => f.category === 'deprecated').length || 0,
    },
  };

  return stats;
}

/**
 * Get enabled flags
 */
export async function getEnabledFlags(): Promise<FeatureFlag[]> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('enabled', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error getting enabled flags:', error);
    throw error;
  }

  return data || [];
}

/**
 * Bulk toggle flags
 */
export async function bulkToggleFlags(
  flagIds: string[],
  enabled: boolean,
  adminId?: string,
  adminName?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('feature_flags')
    .update({
      enabled,
      last_modified_by: adminId,
      last_modified_by_name: adminName,
      updated_at: new Date().toISOString(),
    })
    .in('id', flagIds);

  if (error) {
    console.error('Error bulk toggling flags:', error);
    throw error;
  }

  return true;
}
