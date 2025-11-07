import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Types for our database
export interface Profile {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  role: 'customer' | 'provider' | 'admin';
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
  availability: any;
  cni_number?: string;
  cni_image_url?: string;
  cni_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  payment_method: 'mtn_momo' | 'orange_money';
  escrow_released: boolean;
  customer_rating?: number;
  provider_rating?: number;
  customer_review?: string;
  provider_review?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  payment_method: 'mtn_momo' | 'orange_money';
  transaction_type: 'payment' | 'refund' | 'payout' | 'fee';
  status: 'pending' | 'completed' | 'failed';
  external_reference?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

// Re-export the unified admin API that handles both demo and live modes
export { adminAPI } from '@/lib/admin-api';
