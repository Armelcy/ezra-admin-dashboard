'use client';

import { useDataMode } from '@/contexts/DataModeContext';

export default function DataModeToggle() {
  const { mode, toggleMode, isDemo, isLive } = useDataMode();

  return (
    <button
      onClick={toggleMode}
      className="relative inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      title={`Currently using ${mode} data. Click to switch.`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${
            isDemo ? 'bg-amber-500' : 'bg-green-500'
          }`}
        />
        <span className="font-medium">{isDemo ? 'Demo' : 'Live'}</span>
      </div>

      {/* Switch indicator */}
      <div className="relative h-5 w-9 rounded-full bg-gray-200 transition-colors">
        <div
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            isLive ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </div>
    </button>
  );
}
