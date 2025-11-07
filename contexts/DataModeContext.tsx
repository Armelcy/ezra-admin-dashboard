'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type DataMode = 'demo' | 'live';

interface DataModeContextType {
  mode: DataMode;
  toggleMode: () => void;
  setMode: (mode: DataMode) => void;
  isDemo: boolean;
  isLive: boolean;
}

const DataModeContext = createContext<DataModeContextType | undefined>(undefined);

export function DataModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<DataMode>('demo');
  const [mounted, setMounted] = useState(false);

  // Load saved mode from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem('ezra-admin-data-mode') as DataMode;
    if (savedMode && (savedMode === 'demo' || savedMode === 'live')) {
      setModeState(savedMode);
    }
  }, []);

  const setMode = (newMode: DataMode) => {
    setModeState(newMode);
    if (mounted) {
      localStorage.setItem('ezra-admin-data-mode', newMode);
    }
  };

  const toggleMode = () => {
    const newMode = mode === 'demo' ? 'live' : 'demo';
    setMode(newMode);
  };

  const value = {
    mode,
    toggleMode,
    setMode,
    isDemo: mode === 'demo',
    isLive: mode === 'live',
  };

  return <DataModeContext.Provider value={value}>{children}</DataModeContext.Provider>;
}

export function useDataMode() {
  const context = useContext(DataModeContext);
  if (context === undefined) {
    throw new Error('useDataMode must be used within a DataModeProvider');
  }
  return context;
}
