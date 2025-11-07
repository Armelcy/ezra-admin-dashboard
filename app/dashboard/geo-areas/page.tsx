'use client';

import { useState } from 'react';
import { MapPin, Plus, Edit2, Trash2 } from 'lucide-react';

interface ServiceArea {
  id: string;
  city: string;
  neighborhoods: string[];
  is_active: boolean;
  provider_count: number;
}

export default function GeoAreasPage() {
  const mockAreas: ServiceArea[] = [
    {
      id: '1',
      city: 'Douala',
      neighborhoods: ['Bonapriso', 'Akwa', 'Bonanjo', 'Deido'],
      is_active: true,
      provider_count: 145,
    },
    {
      id: '2',
      city: 'Yaounde',
      neighborhoods: ['Bastos', 'Essos', 'Mvan', 'Nlongkak'],
      is_active: true,
      provider_count: 98,
    },
  ];

  const [areas] = useState(mockAreas);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Geo & Service Areas</h1>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Area
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {areas.map((area) => (
          <div key={area.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <MapPin className="h-6 w-6 text-primary-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">{area.city}</h3>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-500 font-medium">Neighborhoods:</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {area.neighborhoods.map((neighborhood) => (
                      <span
                        key={neighborhood}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {neighborhood}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {area.provider_count} providers
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      area.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {area.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="ml-4 flex flex-col space-y-2">
                <button className="text-primary-600 hover:text-primary-900">
                  <Edit2 className="h-5 w-5" />
                </button>
                <button className="text-red-600 hover:text-red-900">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
