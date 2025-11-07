'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  RefreshCw,
  Filter,
  Send,
} from 'lucide-react';

interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  category: 'general' | 'payment' | 'booking' | 'technical' | 'account';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      // Mock data for now
      const mockData: SupportTicket[] = [
        {
          id: '1',
          ticket_number: 'TKT-001',
          user_id: '1',
          user_name: 'Marie Nguema',
          user_email: 'marie@example.com',
          subject: 'Payment not processed',
          message: 'I made a payment for my booking but it shows as pending. Please help.',
          category: 'payment',
          priority: 'high',
          status: 'open',
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          ticket_number: 'TKT-002',
          user_id: '2',
          user_name: 'Jean Fotso',
          user_email: 'jean@example.com',
          subject: 'Cannot upload CNI document',
          message: 'The CNI upload keeps failing. I\'ve tried multiple times.',
          category: 'technical',
          priority: 'medium',
          status: 'in_progress',
          assigned_to: 'Admin User',
          created_at: '2024-01-14T14:20:00Z',
          updated_at: '2024-01-15T09:15:00Z',
        },
        {
          id: '3',
          ticket_number: 'TKT-003',
          user_id: '3',
          user_name: 'Paul Mbarga',
          user_email: 'paul@example.com',
          subject: 'Question about promo codes',
          message: 'How do I apply a promo code to my booking?',
          category: 'general',
          priority: 'low',
          status: 'resolved',
          assigned_to: 'Admin User',
          created_at: '2024-01-13T11:45:00Z',
          updated_at: '2024-01-14T16:30:00Z',
          resolved_at: '2024-01-14T16:30:00Z',
        },
      ];
      setTickets(mockData);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    // Update the ticket status in local state
    setTickets(tickets.map(ticket =>
      ticket.id === ticketId
        ? {
            ...ticket,
            status: newStatus as any,
            updated_at: new Date().toISOString(),
            resolved_at: newStatus === 'resolved' ? new Date().toISOString() : ticket.resolved_at,
            assigned_to: newStatus === 'in_progress' && !ticket.assigned_to ? 'Admin User' : ticket.assigned_to
          }
        : ticket
    ));

    // Show toast notification
    const statusMessages: Record<string, string> = {
      'in_progress': 'Ticket started',
      'resolved': 'Ticket marked as resolved',
      'closed': 'Ticket closed'
    };

    if (showDetailsModal && selectedTicket?.id === ticketId) {
      setShowDetailsModal(false);
      setSelectedTicket(null);
    }

    // In real implementation, you would save to backend here
    console.log('Updating status:', ticketId, newStatus);
  };

  const handleSendResponse = async () => {
    if (!responseMessage.trim() || !selectedTicket) return;

    // In real implementation, you would send the response to backend here
    console.log('Sending response to', selectedTicket.id, responseMessage);

    // Update ticket status to in_progress if it's open
    if (selectedTicket.status === 'open') {
      handleStatusChange(selectedTicket.id, 'in_progress');
    }

    setResponseMessage('');
    setShowDetailsModal(false);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-CM', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'closed':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
    return true;
  });

  const stats = {
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    avgResponseTime: '2.5 hours',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage customer support requests and inquiries
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={loadTickets}
            disabled={loading}
            className="inline-flex items-center gap-x-2 rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Open Tickets</dt>
          <dd className="mt-1 text-3xl font-semibold text-yellow-600">{stats.open}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5">
          <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
          <dd className="mt-1 text-3xl font-semibold text-blue-600">{stats.inProgress}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Resolved</dt>
          <dd className="mt-1 text-3xl font-semibold text-green-600">{stats.resolved}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Avg Response Time</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.avgResponseTime}</dd>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {filteredTickets.map((ticket) => (
            <li key={ticket.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                    <span className={`inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      <span className="capitalize">{ticket.status.replace('_', ' ')}</span>
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      <span className="capitalize">{ticket.priority}</span>
                    </span>
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                      <span className="capitalize">{ticket.category}</span>
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{ticket.subject}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-1">{ticket.message}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>From: {ticket.user_name}</span>
                    <span>•</span>
                    <span>{formatDate(ticket.created_at)}</span>
                    {ticket.assigned_to && (
                      <>
                        <span>•</span>
                        <span>Assigned to: {ticket.assigned_to}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setShowDetailsModal(true);
                    }}
                    className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                  {ticket.status === 'open' && (
                    <button
                      onClick={() => handleStatusChange(ticket.id, 'in_progress')}
                      className="inline-flex items-center gap-x-1.5 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                    >
                      Start
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {filteredTickets.length === 0 && !loading && (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No tickets found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters to find what you're looking for.
            </p>
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {showDetailsModal && selectedTicket && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowDetailsModal(false)}
            />
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Ticket Details
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{selectedTicket.ticket_number}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                      {getStatusIcon(selectedTicket.status)}
                      <span className="capitalize">{selectedTicket.status.replace('_', ' ')}</span>
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                      <span className="capitalize">{selectedTicket.priority}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-t border-b py-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">{selectedTicket.subject}</h4>
                    <p className="text-sm text-gray-600">{selectedTicket.message}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Customer</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTicket.user_name}</p>
                      <p className="text-xs text-gray-500">{selectedTicket.user_email}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Category</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">{selectedTicket.category}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Created</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedTicket.created_at)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Last Updated</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedTicket.updated_at)}</p>
                    </div>
                  </div>

                  {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Send Response
                      </label>
                      <textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        rows={4}
                        placeholder="Type your response to the customer..."
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <button
                        onClick={handleSendResponse}
                        disabled={!responseMessage.trim()}
                        className="mt-2 inline-flex items-center gap-x-2 rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                        Send Response
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  className="flex-1 inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
                {selectedTicket.status !== 'resolved' && (
                  <button
                    onClick={() => handleStatusChange(selectedTicket.id, 'resolved')}
                    className="flex-1 inline-flex justify-center items-center gap-x-1.5 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark as Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
