'use client';

import { useState } from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  is_enabled: boolean;
  environment: 'production' | 'staging' | 'development';
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([
    {
      id: '1',
      name: 'new_booking_flow',
      description: 'Enable new booking checkout flow',
      is_enabled: true,
      environment: 'production',
    },
    {
      id: '2',
      name: 'provider_ratings_v2',
      description: 'New provider rating system',
      is_enabled: false,
      environment: 'staging',
    },
    {
      id: '3',
      name: 'chat_feature',
      description: 'In-app messaging between users and providers',
      is_enabled: false,
      environment: 'development',
    },
  ]);

  const toggleFlag = (id: string) => {
    setFlags(flags.map((flag) => (flag.id === id ? { ...flag, is_enabled: !flag.is_enabled } : flag)));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>

      <div className="space-y-4">
        {flags.map((flag) => (
          <div key={flag.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{flag.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{flag.description}</p>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      flag.environment === 'production'
                        ? 'bg-green-100 text-green-800'
                        : flag.environment === 'staging'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {flag.environment.toUpperCase()}
                  </span>
                </div>
              </div>
              <button onClick={() => toggleFlag(flag.id)} className="ml-4">
                {flag.is_enabled ? (
                  <ToggleRight className="h-8 w-8 text-green-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
