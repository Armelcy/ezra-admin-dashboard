'use client';

import { useState } from 'react';
import { AlertTriangle, Search, Eye, CheckCircle, XCircle, DollarSign, X } from 'lucide-react';

interface Refund {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_email: string;
  provider_name: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  created_at: string;
  payment_method?: string;
  booking_date?: string;
}

export default function RefundsPage() {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const mockRefunds: Refund[] = [
    {
      id: '1',
      booking_number: 'BK-2025-00100',
      customer_name: 'Marie Dupont',
      customer_email: 'marie.dupont@example.com',
      provider_name: 'Jean Pierre',
      amount: 15000,
      reason: 'Provider did not show up',
      status: 'pending',
      created_at: '2025-01-15T10:00:00Z',
      payment_method: 'MTN Mobile Money',
      booking_date: '2025-01-14T09:00:00Z',
    },
    {
      id: '2',
      booking_number: 'BK-2025-00095',
      customer_name: 'Samuel Kamga',
      customer_email: 'samuel.k@example.com',
      provider_name: 'Alice Mbong',
      amount: 12000,
      reason: 'Poor service quality',
      status: 'approved',
      created_at: '2025-01-14T15:30:00Z',
      payment_method: 'Orange Money',
      booking_date: '2025-01-13T14:00:00Z',
    },
    {
      id: '3',
      booking_number: 'BK-2025-00085',
      customer_name: 'Paul Ateba',
      customer_email: 'paul.ateba@example.com',
      provider_name: 'Grace Ngono',
      amount: 20000,
      reason: 'Service not rendered',
      status: 'pending',
      created_at: '2025-01-13T11:20:00Z',
      payment_method: 'MTN Mobile Money',
      booking_date: '2025-01-12T10:00:00Z',
    },
    {
      id: '4',
      booking_number: 'BK-2025-00078',
      customer_name: 'Sophie Eba',
      customer_email: 'sophie.eba@example.com',
      provider_name: 'Thomas Bile',
      amount: 8500,
      reason: 'Duplicate charge',
      status: 'completed',
      created_at: '2025-01-12T09:15:00Z',
      payment_method: 'Orange Money',
      booking_date: '2025-01-11T15:00:00Z',
    },
  ];

  const [refunds, setRefunds] = useState(mockRefunds);

  const filteredRefunds = refunds.filter((refund) => {
    if (selectedStatus !== 'all' && refund.status !== selectedStatus) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleApproveRefund = (refund: Refund) => {
    setRefunds(refunds.map(r => r.id === refund.id ? { ...r, status: 'approved' } : r));
    showToast('success', `Refund ${refund.booking_number} approved`);
    setShowDetailsModal(false);
  };

  const handleRejectRefund = (refund: Refund) => {
    setRefunds(refunds.map(r => r.id === refund.id ? { ...r, status: 'rejected' } : r));
    showToast('success', `Refund ${refund.booking_number} rejected`);
    setShowDetailsModal(false);
  };

  const handleProcessRefund = (refund: Refund) => {
    setProcessingId(refund.id);
    // Simulate processing
    setTimeout(() => {
      setRefunds(refunds.map(r => r.id === refund.id ? { ...r, status: 'completed' } : r));
      showToast('success', `Refund processed successfully for ${refund.booking_number}`);
      setProcessingId(null);
      setShowProcessModal(false);
      setSelectedRefund(null);
    }, 2000);
  };

  const handleViewDetails = (refund: Refund) => {
    setSelectedRefund(refund);
    setShowDetailsModal(true);
  };

  const handleInitiateProcess = (refund: Refund) => {
    setSelectedRefund(refund);
    setShowProcessModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="h-7 w-7 text-orange-600" />
          Refunds & Disputes
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {filteredRefunds.filter(r => r.status === 'pending').length} pending
          </span>
          <span className="text-sm text-gray-600">•</span>
          <span className="text-sm text-gray-600">
            {filteredRefunds.filter(r => r.status === 'approved').length} approved
          </span>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by status:</label>
          <select
            className="block px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRefunds.map((refund) => (
              <tr key={refund.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {refund.booking_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{refund.customer_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{refund.provider_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {refund.amount.toLocaleString()} FCFA
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{refund.reason}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(refund.status)}`}>
                    {refund.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleViewDetails(refund)}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Details
                  </button>
                  {refund.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveRefund(refund)}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectRefund(refund)}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </button>
                    </>
                  )}
                  {refund.status === 'approved' && (
                    <button
                      onClick={() => handleInitiateProcess(refund)}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      Process Refund
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRefunds.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No refunds found</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRefund && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDetailsModal(false)} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Refund Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Booking Number</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedRefund.booking_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedRefund.status)}`}>
                        {selectedRefund.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer</label>
                    <p className="text-sm text-gray-900">{selectedRefund.customer_name}</p>
                    <p className="text-xs text-gray-500">{selectedRefund.customer_email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Provider</label>
                    <p className="text-sm text-gray-900">{selectedRefund.provider_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Refund Amount</label>
                    <p className="text-sm font-bold text-gray-900">{selectedRefund.amount.toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Method</label>
                    <p className="text-sm text-gray-900">{selectedRefund.payment_method}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Reason</label>
                    <p className="text-sm text-gray-900">{selectedRefund.reason}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Request Date</label>
                    <p className="text-sm text-gray-900">{new Date(selectedRefund.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Booking Date</label>
                    <p className="text-sm text-gray-900">{selectedRefund.booking_date ? new Date(selectedRefund.booking_date).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>

                {selectedRefund.status === 'pending' && (
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      onClick={() => handleRejectRefund(selectedRefund)}
                      className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md"
                    >
                      Reject Refund
                    </button>
                    <button
                      onClick={() => handleApproveRefund(selectedRefund)}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                    >
                      Approve Refund
                    </button>
                  </div>
                )}

                {selectedRefund.status === 'approved' && (
                  <div className="flex justify-end pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleInitiateProcess(selectedRefund);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
                    >
                      Process Refund
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Process Refund Modal */}
      {showProcessModal && selectedRefund && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => !processingId && setShowProcessModal(false)} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Process Refund</h3>

              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  You are about to process a refund of <span className="font-bold">{selectedRefund.amount.toLocaleString()} FCFA</span> to {selectedRefund.customer_name} via {selectedRefund.payment_method}.
                </p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> This will initiate the refund transaction. Ensure the customer's payment details are correct.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowProcessModal(false)}
                    disabled={!!processingId}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleProcessRefund(selectedRefund)}
                    disabled={!!processingId}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50 inline-flex items-center"
                  >
                    {processingId ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Confirm & Process'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
            <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600">×</button>
          </div>
        </div>
      )}
    </div>
  );
}
