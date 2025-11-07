'use client';

import { useState } from 'react';
import {
  FileText,
  Download,
  Search,
  Filter,
  Shield,
  Activity,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  admin_id: string;
  admin_name: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'approve' | 'reject' | 'ban' | 'unban' | 'export';
  target_type: 'user' | 'provider' | 'booking' | 'transaction' | 'promo_code' | 'support_ticket' | 'system';
  target_id: string;
  target_name: string;
  description: string;
  ip_address: string;
  user_agent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: any;
}

interface AuditStats {
  totalLogs: number;
  todayActions: number;
  criticalActions: number;
  recentActions: number;
}

export default function AuditLogsPage() {
  const [selectedDateRange, setSelectedDateRange] = useState<string>('7days');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedAdmin, setSelectedAdmin] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock stats data
  const stats: AuditStats = {
    totalLogs: 1247,
    todayActions: 89,
    criticalActions: 12,
    recentActions: 156,
  };

  // Mock audit logs data
  const mockLogs: AuditLog[] = [
    {
      id: '1',
      timestamp: '2025-01-15T14:30:00Z',
      admin_id: 'admin1',
      admin_name: 'Admin User',
      action: 'approve',
      target_type: 'provider',
      target_id: 'prov123',
      target_name: 'Jean Pierre Kamga',
      description: 'Approved provider KYC verification',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 Chrome/120.0',
      severity: 'medium',
    },
    {
      id: '2',
      timestamp: '2025-01-15T14:25:00Z',
      admin_id: 'admin2',
      admin_name: 'Sarah Admin',
      action: 'ban',
      target_type: 'user',
      target_id: 'user456',
      target_name: 'Suspicious Account',
      description: 'Banned user for fraudulent activity',
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0 Safari/17.0',
      severity: 'critical',
    },
    {
      id: '3',
      timestamp: '2025-01-15T14:20:00Z',
      admin_id: 'admin1',
      admin_name: 'Admin User',
      action: 'create',
      target_type: 'promo_code',
      target_id: 'promo789',
      target_name: 'WINTER2025',
      description: 'Created new promotional code',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 Chrome/120.0',
      severity: 'low',
    },
    {
      id: '4',
      timestamp: '2025-01-15T14:15:00Z',
      admin_id: 'admin3',
      admin_name: 'Tech Admin',
      action: 'delete',
      target_type: 'transaction',
      target_id: 'txn101',
      target_name: 'Transaction #101',
      description: 'Deleted failed transaction',
      ip_address: '192.168.1.102',
      user_agent: 'Mozilla/5.0 Firefox/121.0',
      severity: 'high',
    },
    {
      id: '5',
      timestamp: '2025-01-15T14:10:00Z',
      admin_id: 'admin1',
      admin_name: 'Admin User',
      action: 'update',
      target_type: 'support_ticket',
      target_id: 'ticket555',
      target_name: 'Ticket #555',
      description: 'Updated ticket status to resolved',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 Chrome/120.0',
      severity: 'low',
    },
    {
      id: '6',
      timestamp: '2025-01-15T14:05:00Z',
      admin_id: 'admin2',
      admin_name: 'Sarah Admin',
      action: 'reject',
      target_type: 'provider',
      target_id: 'prov456',
      target_name: 'Invalid Documents Provider',
      description: 'Rejected provider due to invalid CNI documents',
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0 Safari/17.0',
      severity: 'medium',
    },
    {
      id: '7',
      timestamp: '2025-01-15T14:00:00Z',
      admin_id: 'admin1',
      admin_name: 'Admin User',
      action: 'login',
      target_type: 'system',
      target_id: 'sys1',
      target_name: 'Admin Dashboard',
      description: 'Admin logged into dashboard',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 Chrome/120.0',
      severity: 'low',
    },
    {
      id: '8',
      timestamp: '2025-01-15T13:55:00Z',
      admin_id: 'admin3',
      admin_name: 'Tech Admin',
      action: 'export',
      target_type: 'transaction',
      target_id: 'export123',
      target_name: 'Transaction Report',
      description: 'Exported transaction data for January 2025',
      ip_address: '192.168.1.102',
      user_agent: 'Mozilla/5.0 Firefox/121.0',
      severity: 'medium',
    },
    {
      id: '9',
      timestamp: '2025-01-15T13:50:00Z',
      admin_id: 'admin2',
      admin_name: 'Sarah Admin',
      action: 'unban',
      target_type: 'user',
      target_id: 'user789',
      target_name: 'Restored Account',
      description: 'Unbanned user after appeal review',
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0 Safari/17.0',
      severity: 'high',
    },
    {
      id: '10',
      timestamp: '2025-01-15T13:45:00Z',
      admin_id: 'admin1',
      admin_name: 'Admin User',
      action: 'update',
      target_type: 'booking',
      target_id: 'book321',
      target_name: 'Booking #321',
      description: 'Updated booking status and refunded payment',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 Chrome/120.0',
      severity: 'medium',
    },
  ];

  const [logs, setLogs] = useState<AuditLog[]>(mockLogs);

  // Filter logs based on selections
  const filteredLogs = logs.filter((log) => {
    if (selectedAction !== 'all' && log.action !== selectedAction) return false;
    if (selectedAdmin !== 'all' && log.admin_id !== selectedAdmin) return false;
    if (searchQuery && !log.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.target_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'login':
        return 'bg-gray-100 text-gray-800';
      case 'logout':
        return 'bg-gray-100 text-gray-800';
      case 'approve':
        return 'bg-green-100 text-green-800';
      case 'reject':
        return 'bg-orange-100 text-orange-800';
      case 'ban':
        return 'bg-red-100 text-red-800';
      case 'unban':
        return 'bg-yellow-100 text-yellow-800';
      case 'export':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExportLogs = () => {
    console.log('Exporting audit logs...');
    // TODO: Implement actual export functionality
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track and review all system activity and admin actions
          </p>
        </div>
        <button
          onClick={handleExportLogs}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Logs</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.totalLogs}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Today's Actions</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.todayActions}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Critical Actions</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.criticalActions}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Recent (24h)</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.recentActions}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              Search logs
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Search by description or target..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="sm:w-48">
            <label htmlFor="dateRange" className="sr-only">
              Date Range
            </label>
            <select
              id="dateRange"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="sm:w-48">
            <label htmlFor="action" className="sr-only">
              Action Type
            </label>
            <select
              id="action"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
              <option value="ban">Ban</option>
              <option value="unban">Unban</option>
              <option value="export">Export</option>
            </select>
          </div>

          <div className="sm:w-48">
            <label htmlFor="admin" className="sr-only">
              Admin User
            </label>
            <select
              id="admin"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={selectedAdmin}
              onChange={(e) => setSelectedAdmin(e.target.value)}
            >
              <option value="all">All Admins</option>
              <option value="admin1">Admin User</option>
              <option value="admin2">Sarah Admin</option>
              <option value="admin3">Tech Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Activity Log ({filteredLogs.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No logs found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your filters or search query
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {log.admin_name[0]}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{log.admin_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.target_name}</div>
                      <div className="text-xs text-gray-500">{log.target_type}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {log.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityBadgeColor(
                          log.severity
                        )}`}
                      >
                        {log.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ip_address}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Shield className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">Audit Log Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>All admin actions are automatically logged and tracked</li>
                <li>Logs are retained for 90 days and can be exported for compliance</li>
                <li>Critical actions trigger immediate notifications to super admins</li>
                <li>IP addresses and user agents are recorded for security purposes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
