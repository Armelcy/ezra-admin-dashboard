'use client';

import { useState } from 'react';
import { Globe, Edit2, Plus } from 'lucide-react';

interface Translation {
  key: string;
  english: string;
  french: string;
}

export default function LocalizationPage() {
  const [translations] = useState<Translation[]>([
    { key: 'home.welcome', english: 'Welcome to Ezra', french: 'Bienvenue sur Ezra' },
    { key: 'booking.confirm', english: 'Confirm Booking', french: 'Confirmer la Réservation' },
    { key: 'payment.success', english: 'Payment Successful', french: 'Paiement Réussi' },
    { key: 'provider.not_available', english: 'Provider not available', french: 'Prestataire non disponible' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Localization Manager</h1>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Translation
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                English
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Français
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {translations.map((translation) => (
              <tr key={translation.key}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {translation.key}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{translation.english}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{translation.french}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-primary-600 hover:text-primary-900">
                    <Edit2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
