'use client';

import { useState } from 'react';
import { DollarSign, Search, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Payout {
  id: string;
  provider_name: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payment_method: string;
  requested_at: string;
}

export default function PayoutsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const mockPayouts: Payout[] = [
    {
      id: '1',
      provider_name: 'Jean Pierre',
      amount: 125000,
      status: 'pending',
      payment_method: 'MTN Mobile Money',
      requested_at: '2025-01-15T10:00:00Z',
    },
    {
      id: '2',
      provider_name: 'Alice Mbong',
      amount: 87500,
      status: 'completed',
      payment_method: 'Orange Money',
      requested_at: '2025-01-14T15:30:00Z',
    },
  ];

  const [payouts] = useState(mockPayouts);

  const filteredPayouts = payouts.filter((payout) => {
    if (selectedStatus !== 'all' && payout.status !== selectedStatus) return false;
    if (searchQuery && !payout.provider_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white p-5 shadow rounded-lg">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-yellow-400" />
            <div className="ml-5">
              <dt className="text-sm text-gray-500">Pending</dt>
              <dd className="text-lg font-semibold">{payouts.filter(p => p.status === 'pending').length}</dd>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 shadow rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-400" />
            <div className="ml-5">
              <dt className="text-sm text-gray-500">Completed</dt>
              <dd className="text-lg font-semibold">{payouts.filter(p => p.status === 'completed').length}</dd>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                placeholder="Search providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <select
            className="block w-full px-3 py-2 border-gray-300 rounded-md"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPayouts.map((payout) => (
              <tr key={payout.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {payout.provider_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {payout.amount.toLocaleString()} FCFA
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {payout.payment_method}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(payout.status)}`}>
                    {payout.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(payout.requested_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
