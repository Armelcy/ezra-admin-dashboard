'use client';

import { Download, FileText, Calendar } from 'lucide-react';

export default function ExportsPage() {
  const exportTypes = [
    { name: 'Users', description: 'Export all user data', icon: FileText },
    { name: 'Bookings', description: 'Export all bookings', icon: Calendar },
    { name: 'Transactions', description: 'Export financial transactions', icon: FileText },
    { name: 'Providers', description: 'Export provider information', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Data Exports</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {exportTypes.map((type) => {
          const Icon = type.icon;
          return (
            <div key={type.name} className="bg-white shadow rounded-lg p-6">
              <Icon className="h-8 w-8 text-primary-600 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">{type.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{type.description}</p>
              <button className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Date Range</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">From</label>
            <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">To</label>
            <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
