'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Shield,
  AlertTriangle,
  Flag,
  Eye,
  CheckCircle,
  XCircle,
  Ban,
  Trash2,
  RefreshCw,
  MessageSquare,
  User,
} from 'lucide-react';

interface Report {
  id: string;
  report_type: 'review' | 'user' | 'provider' | 'booking';
  reported_item_id: string;
  reporter_id: string;
  reporter_name: string;
  reported_user_name: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  content?: string;
  created_at: string;
  resolved_at?: string;
  admin_notes?: string;
}

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadReports();
  }, [statusFilter, typeFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      // Mock data for now
      const mockData: Report[] = [
        {
          id: '1',
          report_type: 'review',
          reported_item_id: 'rev-001',
          reporter_id: 'user-001',
          reporter_name: 'Marie Nguema',
          reported_user_name: 'Jean Fotso',
          reason: 'inappropriate_content',
          description: 'This review contains offensive language and false accusations.',
          status: 'pending',
          severity: 'high',
          content: 'This provider was terrible and unprofessional. Would never recommend!',
          created_at: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          report_type: 'user',
          reported_item_id: 'user-002',
          reporter_id: 'user-003',
          reporter_name: 'Paul Mbarga',
          reported_user_name: 'Sophie Kamga',
          reason: 'harassment',
          description: 'User has been sending inappropriate messages repeatedly.',
          status: 'reviewing',
          severity: 'critical',
          created_at: '2024-01-14T14:20:00Z',
        },
        {
          id: '3',
          report_type: 'provider',
          reported_item_id: 'prov-001',
          reporter_id: 'user-004',
          reporter_name: 'Daniel Soh',
          reported_user_name: 'Provider ABC Services',
          reason: 'fraud',
          description: 'Provider asked for payment outside the platform.',
          status: 'pending',
          severity: 'critical',
          created_at: '2024-01-13T11:45:00Z',
        },
        {
          id: '4',
          report_type: 'review',
          reported_item_id: 'rev-002',
          reporter_id: 'user-005',
          reporter_name: 'Alice Kameni',
          reported_user_name: 'Bob Provider',
          reason: 'spam',
          description: 'Review appears to be fake/spam.',
          status: 'resolved',
          severity: 'low',
          content: 'Great service! Highly recommend! Call me at...',
          created_at: '2024-01-12T09:15:00Z',
          resolved_at: '2024-01-13T16:30:00Z',
          admin_notes: 'Review removed - contained spam contact information',
        },
      ];
      setReports(mockData);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reportId: string, action: 'approve' | 'dismiss' | 'ban') => {
    // Add action logic here
    console.log('Action:', action, 'on report:', reportId);
    setShowDetailsModal(false);
    loadReports();
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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewing':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'review':
        return <MessageSquare className="h-5 w-5" />;
      case 'user':
      case 'provider':
        return <User className="h-5 w-5" />;
      default:
        return <Flag className="h-5 w-5" />;
    }
  };

  const filteredReports = reports.filter((report) => {
    if (statusFilter !== 'all' && report.status !== statusFilter) return false;
    if (typeFilter !== 'all' && report.report_type !== typeFilter) return false;
    return true;
  });

  const stats = {
    pending: reports.filter((r) => r.status === 'pending').length,
    reviewing: reports.filter((r) => r.status === 'reviewing').length,
    critical: reports.filter((r) => r.severity === 'critical').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
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
          <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>
          <p className="mt-2 text-sm text-gray-700">
            Review and moderate reported content, reviews, and user complaints
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={loadReports}
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
          <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
          <dd className="mt-1 text-3xl font-semibold text-yellow-600">{stats.pending}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Under Review</dt>
          <dd className="mt-1 text-3xl font-semibold text-blue-600">{stats.reviewing}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Critical Issues</dt>
          <dd className="mt-1 text-3xl font-semibold text-red-600">{stats.critical}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Resolved</dt>
          <dd className="mt-1 text-3xl font-semibold text-green-600">{stats.resolved}</dd>
        </div>
      </div>

      {/* Alert for critical reports */}
      {stats.critical > 0 && statusFilter === 'pending' && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                You have <strong>{stats.critical}</strong> critical report{stats.critical !== 1 ? 's' : ''} requiring immediate attention.
              </p>
            </div>
          </div>
        </div>
      )}

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
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
            >
              <option value="all">All Types</option>
              <option value="review">Reviews</option>
              <option value="user">Users</option>
              <option value="provider">Providers</option>
              <option value="booking">Bookings</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {filteredReports.map((report) => (
            <li key={report.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`p-2 rounded-lg ${
                    report.severity === 'critical' ? 'bg-red-100' :
                    report.severity === 'high' ? 'bg-orange-100' :
                    'bg-yellow-100'
                  }`}>
                    {getTypeIcon(report.report_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getSeverityColor(report.severity)}`}>
                        <span className="capitalize">{report.severity}</span>
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(report.status)}`}>
                        <span className="capitalize">{report.status}</span>
                      </span>
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                        <span className="capitalize">{report.report_type}</span>
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Report: {report.reason.replace('_', ' ')}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                    {report.content && (
                      <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Reported Content:</p>
                        <p className="text-sm text-gray-700 italic">"{report.content}"</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                      <span>Reported by: {report.reporter_name}</span>
                      <span>•</span>
                      <span>Against: {report.reported_user_name}</span>
                      <span>•</span>
                      <span>{formatDate(report.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      setAdminNotes(report.admin_notes || '');
                      setShowDetailsModal(true);
                    }}
                    className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" />
                    Review
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {filteredReports.length === 0 && !loading && (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No reports found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or check back later.
            </p>
          </div>
        )}
      </div>

      {/* Report Details Modal */}
      {showDetailsModal && selectedReport && (
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
                      Report Details
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Report ID: {selectedReport.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getSeverityColor(selectedReport.severity)}`}>
                      <span className="capitalize">{selectedReport.severity}</span>
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(selectedReport.status)}`}>
                      <span className="capitalize">{selectedReport.status}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-t border-b py-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Reason: {selectedReport.reason.replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-gray-600">{selectedReport.description}</p>
                  </div>

                  {selectedReport.content && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Reported Content</h4>
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm text-gray-700 italic">"{selectedReport.content}"</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Report Type</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">{selectedReport.report_type}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Severity</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">{selectedReport.severity}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Reporter</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedReport.reporter_name}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Reported User</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedReport.reported_user_name}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Reported On</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedReport.created_at)}</p>
                    </div>
                    {selectedReport.resolved_at && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Resolved On</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(selectedReport.resolved_at)}</p>
                      </div>
                    )}
                  </div>

                  {selectedReport.status !== 'resolved' && selectedReport.status !== 'dismissed' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Notes
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                        placeholder="Add notes about your decision..."
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>
                  )}

                  {selectedReport.admin_notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Previous Admin Notes
                      </label>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedReport.admin_notes}</p>
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
                {selectedReport.status !== 'resolved' && (
                  <>
                    <button
                      onClick={() => handleAction(selectedReport.id, 'dismiss')}
                      className="flex-1 inline-flex justify-center items-center gap-x-1.5 rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
                    >
                      <XCircle className="h-4 w-4" />
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleAction(selectedReport.id, 'ban')}
                      className="flex-1 inline-flex justify-center items-center gap-x-1.5 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                    >
                      <Ban className="h-4 w-4" />
                      Ban User
                    </button>
                    <button
                      onClick={() => handleAction(selectedReport.id, 'approve')}
                      className="flex-1 inline-flex justify-center items-center gap-x-1.5 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Take Action
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
