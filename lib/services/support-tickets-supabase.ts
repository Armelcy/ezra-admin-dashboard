/**
 * Support Tickets Supabase Service
 * Handles all operations for the support tickets system
 */

import { supabase } from '@/lib/supabase';
import { listFromTable, getById, updateRecord, type PaginatedResponse, type ListParams } from '@/lib/supabase-base';

// Types
export type TicketCategory = 'technical' | 'payment' | 'booking' | 'account' | 'general' | 'complaint';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type MessageSenderType = 'user' | 'admin' | 'system';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to?: string;
  assigned_to_name?: string;
  booking_id?: string;
  attachments: any[];
  metadata: Record<string, any>;
  resolved_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  sender_type: MessageSenderType;
  message: string;
  attachments: any[];
  is_internal: boolean;
  created_at: string;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigned_to?: string;
  user_id?: string;
}

export interface CreateTicketData {
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  category: TicketCategory;
  subject: string;
  description: string;
  priority?: TicketPriority;
  booking_id?: string;
  attachments?: any[];
}

export interface CreateMessageData {
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  sender_type: MessageSenderType;
  message: string;
  attachments?: any[];
  is_internal?: boolean;
}

/**
 * List all support tickets with filters and pagination
 */
export async function listTickets(
  params: ListParams & { filters?: TicketFilters } = {}
): Promise<PaginatedResponse<SupportTicket>> {
  const { page = 1, limit = 20, search, sortBy = 'created_at', sortOrder = 'desc', filters } = params;

  let query = supabase
    .from('support_tickets')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters) {
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.priority) query = query.eq('priority', filters.priority);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
    if (filters.user_id) query = query.eq('user_id', filters.user_id);
  }

  // Search
  if (search) {
    query = query.or(`ticket_number.ilike.%${search}%,subject.ilike.%${search}%,user_name.ilike.%${search}%,user_email.ilike.%${search}%`);
  }

  // Sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error listing tickets:', error);
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
 * Get a single ticket by ID
 */
export async function getTicket(ticketId: string): Promise<SupportTicket | null> {
  return getById<SupportTicket>('support_tickets', ticketId);
}

/**
 * Get a ticket by ticket number
 */
export async function getTicketByNumber(ticketNumber: string): Promise<SupportTicket | null> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('ticket_number', ticketNumber)
    .single();

  if (error) {
    console.error('Error getting ticket by number:', error);
    return null;
  }

  return data;
}

/**
 * Create a new support ticket
 */
export async function createTicket(ticketData: CreateTicketData): Promise<SupportTicket> {
  const { data, error } = await supabase
    .from('support_tickets')
    .insert([{
      ...ticketData,
      priority: ticketData.priority || 'medium',
      status: 'open',
      attachments: ticketData.attachments || [],
      metadata: {},
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }

  return data;
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  adminId?: string
): Promise<SupportTicket> {
  const updates: any = { status };

  if (status === 'resolved') {
    updates.resolved_at = new Date().toISOString();
  }

  if (status === 'closed') {
    updates.closed_at = new Date().toISOString();
  }

  return updateRecord<SupportTicket>('support_tickets', ticketId, updates);
}

/**
 * Assign ticket to an admin
 */
export async function assignTicket(
  ticketId: string,
  adminId: string,
  adminName: string
): Promise<SupportTicket> {
  return updateRecord<SupportTicket>('support_tickets', ticketId, {
    assigned_to: adminId,
    assigned_to_name: adminName,
    status: 'in_progress',
  });
}

/**
 * Update ticket priority
 */
export async function updateTicketPriority(
  ticketId: string,
  priority: TicketPriority
): Promise<SupportTicket> {
  return updateRecord<SupportTicket>('support_tickets', ticketId, { priority });
}

/**
 * Get all messages for a ticket
 */
export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const { data, error } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error getting ticket messages:', error);
    throw error;
  }

  return data || [];
}

/**
 * Add a message to a ticket
 */
export async function addTicketMessage(messageData: CreateMessageData): Promise<TicketMessage> {
  const { data, error } = await supabase
    .from('ticket_messages')
    .insert([{
      ...messageData,
      attachments: messageData.attachments || [],
      is_internal: messageData.is_internal || false,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding ticket message:', error);
    throw error;
  }

  // Update ticket status to in_progress if it was open
  if (messageData.sender_type === 'admin') {
    const ticket = await getTicket(messageData.ticket_id);
    if (ticket && ticket.status === 'open') {
      await updateTicketStatus(messageData.ticket_id, 'in_progress');
    }
  }

  return data;
}

/**
 * Get ticket statistics
 */
export async function getTicketStats() {
  const { data: tickets, error } = await supabase
    .from('support_tickets')
    .select('status, priority, category, created_at');

  if (error) {
    console.error('Error getting ticket stats:', error);
    throw error;
  }

  const stats = {
    total: tickets?.length || 0,
    byStatus: {
      open: tickets?.filter((t) => t.status === 'open').length || 0,
      in_progress: tickets?.filter((t) => t.status === 'in_progress').length || 0,
      waiting_user: tickets?.filter((t) => t.status === 'waiting_user').length || 0,
      resolved: tickets?.filter((t) => t.status === 'resolved').length || 0,
      closed: tickets?.filter((t) => t.status === 'closed').length || 0,
    },
    byPriority: {
      low: tickets?.filter((t) => t.priority === 'low').length || 0,
      medium: tickets?.filter((t) => t.priority === 'medium').length || 0,
      high: tickets?.filter((t) => t.priority === 'high').length || 0,
      urgent: tickets?.filter((t) => t.priority === 'urgent').length || 0,
    },
    byCategory: {
      technical: tickets?.filter((t) => t.category === 'technical').length || 0,
      payment: tickets?.filter((t) => t.category === 'payment').length || 0,
      booking: tickets?.filter((t) => t.category === 'booking').length || 0,
      account: tickets?.filter((t) => t.category === 'account').length || 0,
      general: tickets?.filter((t) => t.category === 'general').length || 0,
      complaint: tickets?.filter((t) => t.category === 'complaint').length || 0,
    },
    avgResponseTime: 0, // Calculate based on first response
    avgResolutionTime: 0, // Calculate based on resolution time
  };

  return stats;
}

/**
 * Get open/unassigned tickets
 */
export async function getUnassignedTickets(): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('status', 'open')
    .is('assigned_to', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting unassigned tickets:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get urgent tickets
 */
export async function getUrgentTickets(): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('priority', 'urgent')
    .in('status', ['open', 'in_progress'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting urgent tickets:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get tickets assigned to a specific admin
 */
export async function getAdminTickets(adminId: string): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('assigned_to', adminId)
    .in('status', ['open', 'in_progress', 'waiting_user'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting admin tickets:', error);
    throw error;
  }

  return data || [];
}

/**
 * Search tickets
 */
export async function searchTickets(searchTerm: string): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .or(`ticket_number.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%,user_name.ilike.%${searchTerm}%,user_email.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error searching tickets:', error);
    throw error;
  }

  return data || [];
}
