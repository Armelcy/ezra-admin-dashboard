/**
 * Shared Database Types
 * Based on Ezra App Supabase Schema
 */

// Enums matching database types
export type UserRole = 'customer' | 'provider' | 'admin';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type PaymentMethod = 'mtn_momo' | 'orange_money';
export type TransactionType = 'payment' | 'refund' | 'payout' | 'fee';
export type TransactionStatus = 'pending' | 'completed' | 'failed';
export type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'closed';
export type MessageType = 'text' | 'image' | 'system';

// Core Tables
export interface Profile {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  location?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  user_id: string;
  business_name: string;
  category: string;
  description?: string;
  services: string[];
  rating: number;
  total_reviews: number;
  total_bookings: number;
  hourly_rate: number;
  availability: Record<string, any>;
  cni_number?: string;
  cni_image_url?: string;
  cni_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: Profile;
}

export interface Booking {
  id: string;
  customer_id: string;
  provider_id: string;
  service_name: string;
  description?: string;
  scheduled_date: string;
  duration_hours: number;
  hourly_rate: number;
  total_amount: number;
  service_fee: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  escrow_released: boolean;
  customer_rating?: number;
  provider_rating?: number;
  customer_review?: string;
  provider_review?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  customer?: Profile;
  provider?: Provider;
}

export interface Favorite {
  id: string;
  user_id: string;
  provider_id: string;
  created_at: string;
  // Joined data
  provider?: Provider;
}

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  read_at?: string;
  created_at: string;
  // Joined data
  sender?: Profile;
}

export interface Transaction {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  transaction_type: TransactionType;
  status: TransactionStatus;
  external_reference?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Joined data
  booking?: Booking;
}

export interface Dispute {
  id: string;
  booking_id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  admin_notes?: string;
  resolution?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  booking?: Booking;
  reporter?: Profile;
  reported?: Profile;
}

export interface AdminSetting {
  id: string;
  key: string;
  value: Record<string, any>;
  description?: string;
  updated_by: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  user_id?: string;
  created_at: string;
  // Joined data
  user?: Profile;
}

// View Types
export interface ProviderStats {
  provider_id: string;
  user_id: string;
  business_name: string;
  total_bookings: number;
  completed_bookings: number;
  average_rating: number;
  total_earnings: number;
  pending_payouts: number;
}

export interface AdminAnalytics {
  total_users: number;
  total_providers: number;
  total_bookings: number;
  total_revenue: number;
  pending_verifications: number;
  open_disputes: number;
}

// API Response Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// Filter Types for Common Queries
export interface UserFilters {
  role?: UserRole;
  is_active?: boolean;
  is_verified?: boolean;
}

export interface ProviderFilters {
  category?: string;
  is_active?: boolean;
  cni_verified?: boolean;
  min_rating?: number;
}

export interface BookingFilters {
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  customer_id?: string;
  provider_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  payment_method?: PaymentMethod;
  date_from?: string;
  date_to?: string;
}

export interface DisputeFilters {
  status?: DisputeStatus;
  reporter_id?: string;
  reported_id?: string;
}
