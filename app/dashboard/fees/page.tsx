'use client';

import { useState } from 'react';
import { Receipt, DollarSign, Percent } from 'lucide-react';

export default function FeesPage() {
  const [commissionRate, setCommissionRate] = useState(15);
  const [paymentFee, setPaymentFee] = useState(2.5);

  const stats = {
    totalRevenue: 6850000,
    platformFees: 1027500,
    paymentFees: 171250,
    netRevenue: 5651250,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Fees & Taxes</h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white p-5 shadow rounded-lg">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-blue-400" />
            <div className="ml-5">
              <dt className="text-sm text-gray-500">Total Revenue</dt>
              <dd className="text-lg font-semibold">{stats.totalRevenue.toLocaleString()} FCFA</dd>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 shadow rounded-lg">
          <div className="flex items-center">
            <Percent className="h-6 w-6 text-green-400" />
            <div className="ml-5">
              <dt className="text-sm text-gray-500">Platform Fees</dt>
              <dd className="text-lg font-semibold">{stats.platformFees.toLocaleString()} FCFA</dd>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 shadow rounded-lg">
          <div className="flex items-center">
            <Receipt className="h-6 w-6 text-purple-400" />
            <div className="ml-5">
              <dt className="text-sm text-gray-500">Payment Fees</dt>
              <dd className="text-lg font-semibold">{stats.paymentFees.toLocaleString()} FCFA</dd>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 shadow rounded-lg">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-orange-400" />
            <div className="ml-5">
              <dt className="text-sm text-gray-500">Net Revenue</dt>
              <dd className="text-lg font-semibold">{stats.netRevenue.toLocaleString()} FCFA</dd>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Fee Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Platform Commission Rate (%)
            </label>
            <input
              type="number"
              value={commissionRate}
              onChange={(e) => setCommissionRate(Number(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Processing Fee (%)
            </label>
            <input
              type="number"
              value={paymentFee}
              onChange={(e) => setPaymentFee(Number(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
