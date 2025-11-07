/**
 * Unified Admin API
 * Automatically routes to demo or live data based on data mode
 */

import * as usersSupabase from '@/lib/services/users-supabase';
import * as providersSupabase from '@/lib/services/providers-supabase';
import * as bookingsSupabase from '@/lib/services/bookings-supabase';
import * as transactionsSupabase from '@/lib/services/transactions-supabase';
import * as disputesSupabase from '@/lib/services/disputes-supabase';
import * as auditLogsSupabase from '@/lib/services/audit-logs-supabase';
import * as supportTicketsSupabase from '@/lib/services/support-tickets-supabase';
import * as broadcastsSupabase from '@/lib/services/broadcasts-supabase';
import * as featureFlagsSupabase from '@/lib/services/feature-flags-supabase';
import * as referralsSupabase from '@/lib/services/referrals-supabase';

// Get current mode from localStorage
function getCurrentMode(): 'demo' | 'live' {
  if (typeof window === 'undefined') return 'demo';
  return (localStorage.getItem('ezra-admin-data-mode') as 'demo' | 'live') || 'demo';
}

function isLiveMode(): boolean {
  return getCurrentMode() === 'live';
}

export const adminAPI = {
  // ====================
  // USERS
  // ====================
  async getUsers(filters?: { role?: string; status?: string; search?: string }) {
    if (!isLiveMode()) {
      // Return demo data
      const demoUsers = Array.from({ length: 50 }, (_, i) => ({
        id: `user-${i + 1}`,
        email: `user${i + 1}@example.com`,
        phone: `+237${600000000 + i}`,
        full_name: `User ${i + 1}`,
        role: (['customer', 'provider', 'admin'] as const)[(i % 3)],
        avatar_url: `https://ui-avatars.com/api/?name=User+${i + 1}`,
        location: ['Yaoundé', 'Douala', 'Bafoussam'][i % 3],
        is_verified: i % 3 !== 0,
        is_active: i % 5 !== 0,
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        updated_at: new Date(Date.now() - i * 43200000).toISOString(),
      }));

      let filtered = demoUsers;
      if (filters?.role && filters.role !== 'all') {
        filtered = filtered.filter(u => u.role === filters.role);
      }
      if (filters?.status === 'active') {
        filtered = filtered.filter(u => u.is_active);
      } else if (filters?.status === 'inactive') {
        filtered = filtered.filter(u => !u.is_active);
      }
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(u =>
          u.full_name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
        );
      }
      return filtered;
    }

    // Live mode - use Supabase
    const result = await usersSupabase.listUsers({
      filters: {
        role: filters?.role && filters.role !== 'all' ? filters.role as any : undefined,
        is_active: filters?.status === 'active' ? true : filters?.status === 'inactive' ? false : undefined,
      },
      search: filters?.search,
      limit: 100,
    });
    return result.items;
  },

  // ====================
  // PROVIDERS
  // ====================
  async getPendingProviders() {
    if (!isLiveMode()) {
      // Return demo data
      return Array.from({ length: 5 }, (_, i) => ({
        id: `provider-${i + 1}`,
        user_id: `user-${i + 10}`,
        business_name: `Business ${i + 1}`,
        category: ['Plumbing', 'Electrical', 'Cleaning'][i % 3],
        description: `Professional service provider ${i + 1}`,
        services: ['Service A', 'Service B'],
        rating: 4.5,
        total_reviews: 10,
        total_bookings: 25,
        hourly_rate: 5000 + (i * 1000),
        availability: {},
        cni_number: `CM${100000 + i}`,
        cni_image_url: `https://via.placeholder.com/400x250?text=CNI+${i + 1}`,
        cni_verified: false,
        is_active: true,
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        updated_at: new Date(Date.now() - i * 43200000).toISOString(),
        profiles: {
          id: `user-${i + 10}`,
          full_name: `Provider ${i + 1}`,
          email: `provider${i + 1}@example.com`,
          phone: `+237${650000000 + i}`,
        },
      }));
    }

    return await providersSupabase.getPendingVerifications();
  },

  async approveProvider(providerId: string, approved: boolean) {
    if (!isLiveMode()) {
      // Mock approval
      return { success: true };
    }

    return await providersSupabase.verifyCNI(providerId, approved);
  },

  // ====================
  // TRANSACTIONS
  // ====================
  async getTransactions(filters?: { status?: string; type?: string }) {
    if (!isLiveMode()) {
      // Return demo data
      const demoTransactions = Array.from({ length: 100 }, (_, i) => ({
        id: `txn-${i + 1}`,
        booking_id: `booking-${i + 1}`,
        amount: 10000 + (i * 500),
        currency: 'XAF',
        payment_method: (['mtn_momo', 'orange_money'] as const)[i % 2],
        transaction_type: (['payment', 'refund', 'payout', 'fee'] as const)[i % 4],
        status: (['pending', 'completed', 'failed'] as const)[i % 3],
        external_reference: `EXT-${100000 + i}`,
        metadata: {},
        created_at: new Date(Date.now() - i * 3600000).toISOString(),
        updated_at: new Date(Date.now() - i * 1800000).toISOString(),
        bookings: {
          id: `booking-${i + 1}`,
          service_name: `Service ${i + 1}`,
        },
      }));

      let filtered = demoTransactions;
      if (filters?.status && filters.status !== 'all') {
        filtered = filtered.filter(t => t.status === filters.status);
      }
      if (filters?.type && filters.type !== 'all') {
        filtered = filtered.filter(t => t.transaction_type === filters.type);
      }
      return filtered;
    }

    const result = await transactionsSupabase.listTransactions({
      filters: {
        status: filters?.status && filters.status !== 'all' ? filters.status as any : undefined,
        type: filters?.type && filters.type !== 'all' ? filters.type as any : undefined,
      },
      limit: 100,
    });
    return result.items;
  },

  // ====================
  // BOOKINGS
  // ====================
  async getBookings(filters?: { status?: string; payment_status?: string }) {
    if (!isLiveMode()) {
      // Return demo data
      const demoBookings = Array.from({ length: 50 }, (_, i) => ({
        id: `booking-${i + 1}`,
        customer_id: `user-${i + 1}`,
        provider_id: `provider-${(i % 5) + 1}`,
        service_name: `Service ${i + 1}`,
        description: `Booking description ${i + 1}`,
        scheduled_date: new Date(Date.now() + i * 86400000).toISOString(),
        duration_hours: 2 + (i % 4),
        hourly_rate: 5000,
        total_amount: (2 + (i % 4)) * 5000,
        service_fee: (2 + (i % 4)) * 5000 * 0.15,
        status: (['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const)[i % 5],
        payment_status: (['pending', 'paid', 'refunded'] as const)[i % 3],
        payment_method: (['mtn_momo', 'orange_money'] as const)[i % 2],
        escrow_released: i % 3 === 0,
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        updated_at: new Date(Date.now() - i * 43200000).toISOString(),
      }));

      let filtered = demoBookings;
      if (filters?.status && filters.status !== 'all') {
        filtered = filtered.filter(b => b.status === filters.status);
      }
      if (filters?.payment_status && filters.payment_status !== 'all') {
        filtered = filtered.filter(b => b.payment_status === filters.payment_status);
      }
      return filtered;
    }

    const result = await bookingsSupabase.listBookings({
      filters: {
        status: filters?.status && filters.status !== 'all' ? filters.status as any : undefined,
        payment_status: filters?.payment_status && filters.payment_status !== 'all' ? filters.payment_status as any : undefined,
      },
      limit: 100,
    });
    return result.items;
  },

  // ====================
  // DISPUTES
  // ====================
  async getDisputes(filters?: { status?: string }) {
    if (!isLiveMode()) {
      // Return demo data
      const demoDisputes = Array.from({ length: 15 }, (_, i) => ({
        id: `dispute-${i + 1}`,
        booking_id: `booking-${i + 1}`,
        reporter_id: `user-${i + 1}`,
        reported_id: `user-${i + 10}`,
        reason: ['Service not delivered', 'Poor quality', 'Payment issue'][i % 3],
        description: `Dispute description ${i + 1}`,
        status: (['open', 'investigating', 'resolved', 'closed'] as const)[i % 4],
        admin_notes: i % 2 === 0 ? `Admin note ${i + 1}` : undefined,
        resolution: i % 4 === 2 ? `Resolution ${i + 1}` : undefined,
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        updated_at: new Date(Date.now() - i * 43200000).toISOString(),
      }));

      let filtered = demoDisputes;
      if (filters?.status && filters.status !== 'all') {
        filtered = filtered.filter(d => d.status === filters.status);
      }
      return filtered;
    }

    const result = await disputesSupabase.listDisputes({
      filters: {
        status: filters?.status && filters.status !== 'all' ? filters.status as any : undefined,
      },
      limit: 100,
    });
    return result.items;
  },

  // ====================
  // AUDIT LOGS
  // ====================
  async getAuditLogs(filters?: { table_name?: string; action?: string }) {
    if (!isLiveMode()) {
      // Return demo data
      return Array.from({ length: 100 }, (_, i) => ({
        id: `audit-${i + 1}`,
        table_name: ['profiles', 'providers', 'bookings', 'transactions'][i % 4],
        record_id: `record-${i + 1}`,
        action: (['INSERT', 'UPDATE', 'DELETE'] as const)[i % 3],
        old_data: i % 3 !== 0 ? { field: 'old value' } : undefined,
        new_data: i % 3 !== 2 ? { field: 'new value' } : undefined,
        user_id: `user-${(i % 10) + 1}`,
        created_at: new Date(Date.now() - i * 600000).toISOString(),
      }));
    }

    const result = await auditLogsSupabase.listAuditLogs({
      filters: {
        table_name: filters?.table_name,
        action: filters?.action as any,
      },
      limit: 100,
    });
    return result.items;
  },

  // ====================
  // DASHBOARD STATS
  // ====================
  async getDashboardStats() {
    if (!isLiveMode()) {
      // Return demo stats
      return {
        total_users: 1234,
        total_providers: 456,
        total_bookings: 789,
        total_revenue: 12500000,
        pending_verifications: 5,
        open_disputes: 3,
      };
    }

    // In live mode, aggregate stats from various sources
    const [userStats, bookingStats, disputeStats, pendingProviders] = await Promise.all([
      usersSupabase.getUserStats(),
      bookingsSupabase.getBookingStats(),
      disputesSupabase.getDisputeStats(),
      providersSupabase.getPendingVerifications(),
    ]);

    return {
      total_users: userStats.total,
      total_providers: userStats.providers,
      total_bookings: bookingStats.total,
      total_revenue: bookingStats.total_revenue,
      pending_verifications: pendingProviders.length,
      open_disputes: disputeStats.open + disputeStats.investigating,
    };
  },

  // ====================
  // PROMOTIONAL CODES
  // ====================
  async getPromotionalCodes() {
    if (!isLiveMode()) {
      // Return demo data
      return Array.from({ length: 10 }, (_, i) => ({
        id: `promo-${i + 1}`,
        code: `PROMO${i + 1}`,
        discount_percent: 10 + (i * 5),
        max_uses: 100,
        times_used: i * 3,
        valid_from: new Date(Date.now() - 30 * 86400000).toISOString(),
        valid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
        is_active: i % 4 !== 0,
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
      }));
    }

    // TODO: Implement Supabase promo codes service
    const { data } = await import('@/lib/supabase').then(m => m.supabase
      .from('promotional_codes')
      .select('*')
      .order('created_at', { ascending: false })
    );
    return data || [];
  },

  // ====================
  // SUPPORT TICKETS
  // ====================
  async getSupportTickets(filters?: { status?: string; priority?: string; category?: string }) {
    if (!isLiveMode()) {
      // Return demo data
      return Array.from({ length: 15 }, (_, i) => ({
        id: `ticket-${i + 1}`,
        ticket_number: `TKT-2025-${String(i + 1).padStart(5, '0')}`,
        user_id: `user-${i + 1}`,
        user_name: `User ${i + 1}`,
        user_email: `user${i + 1}@example.com`,
        user_phone: `+237${600000000 + i}`,
        category: ['technical', 'payment', 'booking', 'account', 'general'][i % 5],
        subject: `Issue ${i + 1}: ${['App crashes', 'Payment not received', 'Booking issue', 'Account problem', 'General inquiry'][i % 5]}`,
        description: `Detailed description of issue ${i + 1}`,
        status: ['open', 'in_progress', 'waiting_user', 'resolved'][i % 4],
        priority: ['low', 'medium', 'high', 'urgent'][i % 4],
        assigned_to: i % 2 === 0 ? 'admin-1' : null,
        assigned_to_name: i % 2 === 0 ? 'Admin User' : null,
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        updated_at: new Date(Date.now() - i * 43200000).toISOString(),
      }));
    }

    // Live mode - use Supabase
    const result = await supportTicketsSupabase.listTickets({
      filters: {
        status: filters?.status as any,
        priority: filters?.priority as any,
        category: filters?.category as any,
      },
      limit: 100,
    });
    return result.items;
  },

  async getTicketById(id: string) {
    if (!isLiveMode()) {
      return null;
    }
    return supportTicketsSupabase.getTicket(id);
  },

  async getTicketStats() {
    if (!isLiveMode()) {
      return {
        total: 15,
        byStatus: { open: 4, in_progress: 4, waiting_user: 3, resolved: 3, closed: 1 },
        byPriority: { low: 3, medium: 6, high: 4, urgent: 2 },
        byCategory: { technical: 3, payment: 3, booking: 3, account: 3, general: 3, complaint: 0 },
      };
    }
    return supportTicketsSupabase.getTicketStats();
  },

  // ====================
  // BROADCASTS
  // ====================
  async getBroadcasts(filters?: { status?: string }) {
    if (!isLiveMode()) {
      // Return demo data
      return Array.from({ length: 10 }, (_, i) => ({
        id: `broadcast-${i + 1}`,
        title: `Broadcast ${i + 1}`,
        message: `Important announcement ${i + 1}`,
        target_audience: ['all', 'customers', 'providers'][i % 3],
        status: ['draft', 'scheduled', 'sent'][i % 3],
        total_recipients: 100 + (i * 50),
        successful_sends: 95 + (i * 45),
        failed_sends: 5,
        opened_count: 60 + (i * 20),
        clicked_count: 20 + (i * 5),
        sent_at: i % 3 === 2 ? new Date(Date.now() - i * 86400000).toISOString() : null,
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        created_by_name: 'Admin User',
      }));
    }

    // Live mode - use Supabase
    const result = await broadcastsSupabase.listBroadcasts({
      filters: {
        status: filters?.status as any,
      },
      limit: 100,
    });
    return result.items;
  },

  async getBroadcastStats() {
    if (!isLiveMode()) {
      return {
        total: 10,
        sent: 4,
        scheduled: 3,
        failed: 1,
        totalRecipients: 500,
        successfulSends: 475,
        totalOpens: 300,
        totalClicks: 100,
      };
    }
    return broadcastsSupabase.getBroadcastStats();
  },

  async sendBroadcast(broadcastId: string) {
    if (!isLiveMode()) {
      return { success: true, message: 'Demo mode - broadcast not actually sent' };
    }
    await broadcastsSupabase.sendBroadcast(broadcastId);
    return { success: true, message: 'Broadcast sent successfully' };
  },

  // ====================
  // FEATURE FLAGS
  // ====================
  async getFeatureFlags(filters?: { enabled?: boolean; category?: string }) {
    if (!isLiveMode()) {
      // Return demo data
      return Array.from({ length: 12 }, (_, i) => ({
        id: `flag-${i + 1}`,
        key: ['chat_feature', 'new_payment_flow', 'dark_mode', 'referral_program', 'advanced_search', 'booking_v2', 'analytics_dashboard', 'multi_language', 'push_notifications', 'social_login', 'video_calls', 'loyalty_points'][i],
        name: ['In-App Chat', 'New Payment Flow', 'Dark Mode', 'Referral Program', 'Advanced Search', 'Booking V2', 'Analytics Dashboard', 'Multi-Language', 'Push Notifications', 'Social Login', 'Video Calls', 'Loyalty Points'][i],
        description: `Feature flag for ${['chat', 'payments', 'UI', 'referrals', 'search', 'booking', 'analytics', 'i18n', 'notifications', 'auth', 'video', 'rewards'][i]}`,
        enabled: i % 3 !== 0,
        target_type: ['all', 'percentage', 'user_roles'][i % 3],
        rollout_percentage: i % 3 === 1 ? (20 + i * 10) : 100,
        category: ['experimental', 'beta', 'stable', 'stable'][i % 4],
        platforms: ['ios', 'android', 'web'],
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
      }));
    }

    // Live mode - use Supabase
    const result = await featureFlagsSupabase.listFlags({
      filters: {
        enabled: filters?.enabled,
        category: filters?.category as any,
      },
      limit: 100,
    });
    return result.items;
  },

  async getFlagStats() {
    if (!isLiveMode()) {
      return {
        total: 12,
        enabled: 8,
        disabled: 4,
        byTargetType: { all: 4, percentage: 4, user_ids: 2, user_roles: 2, custom: 0 },
        byCategory: { experimental: 3, beta: 3, stable: 5, deprecated: 1 },
      };
    }
    return featureFlagsSupabase.getFlagStats();
  },

  async toggleFlag(flagId: string, enabled: boolean) {
    if (!isLiveMode()) {
      return { success: true, message: 'Demo mode - flag not actually toggled' };
    }
    await featureFlagsSupabase.toggleFlag(flagId, enabled);
    return { success: true, message: 'Flag toggled successfully' };
  },

  // ====================
  // REFERRALS
  // ====================
  async getReferralStats() {
    if (!isLiveMode()) {
      return {
        totalShares: 250,
        completedShares: 180,
        totalConversions: 75,
        signupConversions: 75,
        bookingConversions: 45,
        paymentConversions: 30,
        totalRewards: 100,
        pendingRewards: 20,
        appliedRewards: 70,
        totalRewardAmount: 1500000,
        totalConversionValue: 1875000,
      };
    }
    return referralsSupabase.getReferralStats();
  },

  async getAllReferralStats(search?: string) {
    if (!isLiveMode()) {
      // Return demo data
      return Array.from({ length: 20 }, (_, i) => ({
        user_id: `user-${i + 1}`,
        full_name: `User ${i + 1}`,
        total_shares: 5 + (i * 2),
        total_points: 100 + (i * 50),
        referrals_signed_up: i,
        active_rewards: Math.floor(i / 2),
        total_credit: i * 25000,
      }));
    }

    const result = await referralsSupabase.getAllUserReferralStats({
      search,
      limit: 100,
    });
    return result.items;
  },

  async getTopReferrers(limit: number = 10) {
    if (!isLiveMode()) {
      return Array.from({ length: limit }, (_, i) => ({
        user_id: `user-${i + 1}`,
        full_name: `User ${i + 1}`,
        total_shares: 20 - i,
        total_points: 500 - (i * 50),
        referrals_signed_up: 15 - i,
        active_rewards: 5 - Math.floor(i / 2),
        total_credit: (15 - i) * 25000,
      }));
    }
    return referralsSupabase.getTopReferrers(limit);
  },

  async getPendingRewards() {
    if (!isLiveMode()) {
      return Array.from({ length: 15 }, (_, i) => ({
        id: `reward-${i + 1}`,
        user_id: `user-${i + 1}`,
        reward_type: ['points', 'discount', 'credit'][i % 3],
        amount: 25000 + (i * 5000),
        currency: 'FCFA',
        description: 'Référence de parrainage',
        status: 'pending',
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
      }));
    }
    return referralsSupabase.getPendingRewards();
  },
};
