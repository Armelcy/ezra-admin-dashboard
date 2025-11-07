/**
 * Referrals Supabase Service
 * Handles all operations for the referral and rewards system
 */

import { supabase } from '@/lib/supabase';
import { listFromTable, getById, updateRecord, type PaginatedResponse, type ListParams } from '@/lib/supabase-base';

// Types
export type ShareType = 'whatsapp' | 'sms' | 'email' | 'social' | 'provider' | 'service' | 'app' | 'booking';
export type ShareStatus = 'pending' | 'completed' | 'failed';
export type ConversionType = 'signup' | 'first_booking' | 'payment';
export type RewardType = 'points' | 'discount' | 'credit' | 'free_service';
export type RewardStatus = 'pending' | 'applied' | 'expired' | 'cancelled';

export interface ShareHistory {
  id: string;
  user_id: string;
  share_type: ShareType;
  target?: string;
  content: string;
  referral_code?: string;
  status: ShareStatus;
  reward_given: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReferralCode {
  id: string;
  code: string;
  referrer_id: string;
  share_type: string;
  shared_item_id?: string;
  expires_at?: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReferralConversion {
  id: string;
  referral_code_id: string;
  referrer_id: string;
  referee_id: string;
  conversion_type: ConversionType;
  reward_amount: number;
  reward_currency: string;
  reward_given: boolean;
  created_at: string;
}

export interface ReferralReward {
  id: string;
  user_id: string;
  referral_conversion_id?: string;
  reward_type: RewardType;
  amount: number;
  currency: string;
  description: string;
  status: RewardStatus;
  expires_at?: string;
  applied_at?: string;
  created_at: string;
}

export interface UserReferralStats {
  user_id: string;
  full_name: string;
  total_shares: number;
  total_points: number;
  referrals_signed_up: number;
  active_rewards: number;
  total_credit: number;
}

export interface ReferralFilters {
  status?: ShareStatus | RewardStatus;
  share_type?: ShareType;
  conversion_type?: ConversionType;
  user_id?: string;
}

/**
 * List share history with filters and pagination
 */
export async function listShareHistory(
  params: ListParams & { filters?: ReferralFilters } = {}
): Promise<PaginatedResponse<ShareHistory>> {
  const { page = 1, limit = 20, search, sortBy = 'created_at', sortOrder = 'desc', filters } = params;

  let query = supabase
    .from('share_history')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters) {
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.share_type) query = query.eq('share_type', filters.share_type);
    if (filters.user_id) query = query.eq('user_id', filters.user_id);
  }

  // Sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error listing share history:', error);
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
 * List referral codes with filters and pagination
 */
export async function listReferralCodes(
  params: ListParams & { filters?: { is_active?: boolean; referrer_id?: string } } = {}
): Promise<PaginatedResponse<ReferralCode>> {
  const { page = 1, limit = 20, search, sortBy = 'created_at', sortOrder = 'desc', filters } = params;

  let query = supabase
    .from('referral_codes')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters) {
    if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active);
    if (filters.referrer_id) query = query.eq('referrer_id', filters.referrer_id);
  }

  // Search
  if (search) {
    query = query.ilike('code', `%${search}%`);
  }

  // Sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error listing referral codes:', error);
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
 * List referral conversions with filters and pagination
 */
export async function listReferralConversions(
  params: ListParams & { filters?: ReferralFilters } = {}
): Promise<PaginatedResponse<ReferralConversion>> {
  const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc', filters } = params;

  let query = supabase
    .from('referral_conversions')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters) {
    if (filters.conversion_type) query = query.eq('conversion_type', filters.conversion_type);
    if (filters.user_id) {
      query = query.or(`referrer_id.eq.${filters.user_id},referee_id.eq.${filters.user_id}`);
    }
  }

  // Sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error listing referral conversions:', error);
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
 * List referral rewards with filters and pagination
 */
export async function listReferralRewards(
  params: ListParams & { filters?: ReferralFilters } = {}
): Promise<PaginatedResponse<ReferralReward>> {
  const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc', filters } = params;

  let query = supabase
    .from('referral_rewards')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters) {
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.user_id) query = query.eq('user_id', filters.user_id);
  }

  // Sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error listing referral rewards:', error);
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
 * Get user referral stats
 */
export async function getUserReferralStats(userId: string): Promise<UserReferralStats | null> {
  const { data, error } = await supabase
    .from('user_referral_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error getting user referral stats:', error);
    return null;
  }

  return data;
}

/**
 * Get all user referral stats with pagination
 */
export async function getAllUserReferralStats(
  params: ListParams = {}
): Promise<PaginatedResponse<UserReferralStats>> {
  const { page = 1, limit = 20, search, sortBy = 'total_credit', sortOrder = 'desc' } = params;

  let query = supabase
    .from('user_referral_stats')
    .select('*', { count: 'exact' });

  // Search
  if (search) {
    query = query.ilike('full_name', `%${search}%`);
  }

  // Sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error getting all user referral stats:', error);
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
 * Generate a new referral code
 */
export async function generateReferralCode(
  referrerId: string,
  shareType: string = 'app',
  sharedItemId?: string
): Promise<ReferralCode> {
  // Call the database function to generate a unique code
  const { data: codeData, error: codeError } = await supabase.rpc('generate_referral_code', {
    prefix: 'EZRA',
  });

  if (codeError || !codeData) {
    console.error('Error generating referral code:', codeError);
    throw codeError || new Error('Failed to generate referral code');
  }

  // Create the referral code record
  const { data, error } = await supabase
    .from('referral_codes')
    .insert([{
      code: codeData,
      referrer_id: referrerId,
      share_type: shareType,
      shared_item_id: sharedItemId,
      max_uses: 1,
      current_uses: 0,
      is_active: true,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating referral code:', error);
    throw error;
  }

  return data;
}

/**
 * Process a referral reward
 */
export async function processReferralReward(
  referrerId: string,
  refereeId: string,
  conversionType: ConversionType,
  rewardAmount: number = 25000
): Promise<string> {
  const { data, error } = await supabase.rpc('process_referral_reward', {
    p_referrer_id: referrerId,
    p_referee_id: refereeId,
    p_conversion_type: conversionType,
    p_reward_amount: rewardAmount,
  });

  if (error) {
    console.error('Error processing referral reward:', error);
    throw error;
  }

  return data;
}

/**
 * Update reward status
 */
export async function updateRewardStatus(
  rewardId: string,
  status: RewardStatus
): Promise<ReferralReward> {
  const updates: any = { status };

  if (status === 'applied') {
    updates.applied_at = new Date().toISOString();
  }

  return updateRecord<ReferralReward>('referral_rewards', rewardId, updates);
}

/**
 * Get referral statistics
 */
export async function getReferralStats() {
  const [
    { data: shares, error: sharesError },
    { data: conversions, error: conversionsError },
    { data: rewards, error: rewardsError },
  ] = await Promise.all([
    supabase.from('share_history').select('status, share_type, created_at'),
    supabase.from('referral_conversions').select('conversion_type, reward_amount, created_at'),
    supabase.from('referral_rewards').select('status, reward_type, amount, created_at'),
  ]);

  if (sharesError || conversionsError || rewardsError) {
    console.error('Error getting referral stats:', { sharesError, conversionsError, rewardsError });
    throw new Error('Failed to get referral statistics');
  }

  const stats = {
    totalShares: shares?.length || 0,
    completedShares: shares?.filter((s) => s.status === 'completed').length || 0,
    totalConversions: conversions?.length || 0,
    signupConversions: conversions?.filter((c) => c.conversion_type === 'signup').length || 0,
    bookingConversions: conversions?.filter((c) => c.conversion_type === 'first_booking').length || 0,
    paymentConversions: conversions?.filter((c) => c.conversion_type === 'payment').length || 0,
    totalRewards: rewards?.length || 0,
    pendingRewards: rewards?.filter((r) => r.status === 'pending').length || 0,
    appliedRewards: rewards?.filter((r) => r.status === 'applied').length || 0,
    totalRewardAmount: rewards?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0,
    totalConversionValue: conversions?.reduce((sum, c) => sum + (c.reward_amount || 0), 0) || 0,
    sharesByType: {
      whatsapp: shares?.filter((s) => s.share_type === 'whatsapp').length || 0,
      sms: shares?.filter((s) => s.share_type === 'sms').length || 0,
      email: shares?.filter((s) => s.share_type === 'email').length || 0,
      social: shares?.filter((s) => s.share_type === 'social').length || 0,
      provider: shares?.filter((s) => s.share_type === 'provider').length || 0,
      service: shares?.filter((s) => s.share_type === 'service').length || 0,
    },
  };

  return stats;
}

/**
 * Get top referrers
 */
export async function getTopReferrers(limit: number = 10): Promise<UserReferralStats[]> {
  const { data, error } = await supabase
    .from('user_referral_stats')
    .select('*')
    .order('referrals_signed_up', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting top referrers:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get pending rewards
 */
export async function getPendingRewards(): Promise<ReferralReward[]> {
  const { data, error } = await supabase
    .from('referral_rewards')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting pending rewards:', error);
    throw error;
  }

  return data || [];
}

/**
 * Deactivate referral code
 */
export async function deactivateReferralCode(codeId: string): Promise<ReferralCode> {
  return updateRecord<ReferralCode>('referral_codes', codeId, {
    is_active: false,
  });
}

/**
 * Get referral code by code string
 */
export async function getReferralCodeByCode(code: string): Promise<ReferralCode | null> {
  const { data, error } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('code', code)
    .single();

  if (error) {
    console.error('Error getting referral code:', error);
    return null;
  }

  return data;
}
