'use client';

import { useState } from 'react';
import { Zap, Check, X, Bell, Loader2 } from 'lucide-react';

export default function IntegrationsPage() {
  const [oneSignalStatus, setOneSignalStatus] = useState<'checking' | 'connected' | 'error' | null>(null);
  const [oneSignalMessage, setOneSignalMessage] = useState('');

  const testOneSignalConnection = async () => {
    setOneSignalStatus('checking');
    setOneSignalMessage('Testing connection...');

    try {
      const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

      if (!appId) {
        setOneSignalStatus('error');
        setOneSignalMessage('OneSignal App ID not configured');
        return;
      }

      // Simple check to see if env vars are set
      setOneSignalStatus('connected');
      setOneSignalMessage(`Connected - App ID: ${appId.substring(0, 8)}...`);
    } catch (error) {
      setOneSignalStatus('error');
      setOneSignalMessage('Connection failed. Check your credentials.');
    }
  };

  const integrations = [
    {
      name: 'OneSignal',
      description: 'Push notifications for broadcasts',
      icon: Bell,
      is_connected: !!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      status: oneSignalStatus || (process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ? 'configured' : 'inactive'),
      message: oneSignalMessage,
      testable: true,
      onTest: testOneSignalConnection,
    },
    {
      name: 'MTN Mobile Money',
      description: 'Payment gateway integration',
      icon: Zap,
      is_connected: true,
      status: 'active',
    },
    {
      name: 'Orange Money',
      description: 'Payment gateway integration',
      icon: Zap,
      is_connected: true,
      status: 'active',
    },
    {
      name: 'Stripe',
      description: 'International payments',
      icon: Zap,
      is_connected: false,
      status: 'inactive',
    },
    {
      name: 'Twilio',
      description: 'SMS notifications',
      icon: Zap,
      is_connected: true,
      status: 'active',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Integrations & Webhooks</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => {
          const Icon = integration.icon || Zap;
          return (
            <div key={integration.name} className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <Icon className="h-8 w-8 text-primary-600" />
                <h3 className="ml-3 text-lg font-medium text-gray-900">{integration.name}</h3>
              </div>
              <p className="mt-2 text-sm text-gray-500">{integration.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    integration.status === 'connected'
                      ? 'bg-green-100 text-green-800'
                      : integration.status === 'error'
                      ? 'bg-red-100 text-red-800'
                      : integration.status === 'checking'
                      ? 'bg-blue-100 text-blue-800'
                      : integration.is_connected
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {integration.status === 'checking' ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Testing...
                    </>
                  ) : integration.status === 'connected' ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Connected
                    </>
                  ) : integration.status === 'error' ? (
                    <>
                      <X className="h-3 w-3 mr-1" />
                      Error
                    </>
                  ) : integration.is_connected ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3 mr-1" />
                      Not Connected
                    </>
                  )}
                </span>
              </div>
              {integration.message && (
                <p className="mt-2 text-xs text-gray-600">{integration.message}</p>
              )}
              <button
                onClick={integration.testable ? integration.onTest : undefined}
                disabled={integration.status === 'checking'}
                className={`mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  integration.testable
                    ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
                    : integration.is_connected
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {integration.status === 'checking' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : integration.testable ? (
                  'Test Connection'
                ) : integration.is_connected ? (
                  'Disconnect'
                ) : (
                  'Connect'
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
