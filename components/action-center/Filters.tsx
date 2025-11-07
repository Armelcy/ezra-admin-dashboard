'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import type { Severity, Queue } from '@/types/action-center';
import { REASON_CODES } from '@/types/action-center';

interface FiltersProps {
  queue: Queue;
  onFilterChange: (filters: {
    assignedTo?: 'me' | 'unassigned' | 'all';
    overdue?: boolean;
    severity?: Severity[];
    reasonCode?: string[];
    search?: string;
  }) => void;
}

export function Filters({ queue, onFilterChange }: FiltersProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'me' | 'unassigned'>('all');
  const [showOverdue, setShowOverdue] = useState(false);
  const [selectedSeverities, setSelectedSeverities] = useState<Severity[]>([]);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (updates: Partial<FiltersProps['onFilterChange']>) => {
    const filters = {
      assignedTo: activeFilter === 'all' ? undefined : activeFilter,
      overdue: showOverdue || undefined,
      severity: selectedSeverities.length > 0 ? selectedSeverities : undefined,
      reasonCode: selectedReasons.length > 0 ? selectedReasons : undefined,
      search: search || undefined,
      ...updates,
    };
    onFilterChange(filters);
  };

  const handleAssignedToChange = (value: 'all' | 'me' | 'unassigned') => {
    setActiveFilter(value);
    handleFilterChange({ assignedTo: value === 'all' ? undefined : value });
  };

  const handleOverdueToggle = () => {
    const newValue = !showOverdue;
    setShowOverdue(newValue);
    handleFilterChange({ overdue: newValue || undefined });
  };

  const toggleSeverity = (severity: Severity) => {
    const newSeverities = selectedSeverities.includes(severity)
      ? selectedSeverities.filter((s) => s !== severity)
      : [...selectedSeverities, severity];
    setSelectedSeverities(newSeverities);
    handleFilterChange({ severity: newSeverities.length > 0 ? newSeverities : undefined });
  };

  const toggleReason = (reason: string) => {
    const newReasons = selectedReasons.includes(reason)
      ? selectedReasons.filter((r) => r !== reason)
      : [...selectedReasons, reason];
    setSelectedReasons(newReasons);
    handleFilterChange({ reasonCode: newReasons.length > 0 ? newReasons : undefined });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    handleFilterChange({ search: value || undefined });
  };

  const clearAllFilters = () => {
    setActiveFilter('all');
    setShowOverdue(false);
    setSelectedSeverities([]);
    setSelectedReasons([]);
    setSearch('');
    onFilterChange({});
  };

  const hasActiveFilters =
    activeFilter !== 'all' ||
    showOverdue ||
    selectedSeverities.length > 0 ||
    selectedReasons.length > 0 ||
    search;

  return (
    <div className="bg-white shadow rounded-lg p-4 space-y-4">
      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Assigned To */}
        <div className="flex items-center gap-2 border-r border-gray-200 pr-3">
          <span className="text-sm text-gray-600 font-medium">Show:</span>
          <button
            onClick={() => handleAssignedToChange('all')}
            className={`px-3 py-1 text-sm rounded-md ${
              activeFilter === 'all'
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleAssignedToChange('me')}
            className={`px-3 py-1 text-sm rounded-md ${
              activeFilter === 'me'
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Mine
          </button>
          <button
            onClick={() => handleAssignedToChange('unassigned')}
            className={`px-3 py-1 text-sm rounded-md ${
              activeFilter === 'unassigned'
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Unassigned
          </button>
        </div>

        {/* Overdue Toggle */}
        <button
          onClick={handleOverdueToggle}
          className={`px-3 py-1 text-sm rounded-md ${
            showOverdue
              ? 'bg-red-100 text-red-700 font-medium'
              : 'text-gray-600 hover:bg-gray-100 border border-gray-300'
          }`}
        >
          Overdue Only
        </button>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-3 py-1 text-sm rounded-md text-gray-600 hover:bg-gray-100 border border-gray-300 inline-flex items-center gap-1"
        >
          <Filter className="h-4 w-4" />
          Advanced
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="px-3 py-1 text-sm rounded-md text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear All
          </button>
        )}

        {/* Search */}
        <div className="ml-auto flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, name, phone..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-4 space-y-3">
          {/* Severity Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Severity:</label>
            <div className="flex gap-2">
              <button
                onClick={() => toggleSeverity('red')}
                className={`px-3 py-1 text-xs rounded-full border ${
                  selectedSeverities.includes('red')
                    ? 'bg-red-100 text-red-800 border-red-300'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                🔴 Critical
              </button>
              <button
                onClick={() => toggleSeverity('amber')}
                className={`px-3 py-1 text-xs rounded-full border ${
                  selectedSeverities.includes('amber')
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                🟠 Warning
              </button>
              <button
                onClick={() => toggleSeverity('green')}
                className={`px-3 py-1 text-xs rounded-full border ${
                  selectedSeverities.includes('green')
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                🟢 Normal
              </button>
            </div>
          </div>

          {/* Reason Codes Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Reason:</label>
            <div className="flex flex-wrap gap-2">
              {REASON_CODES[queue].map((reason) => (
                <button
                  key={reason}
                  onClick={() => toggleReason(reason)}
                  className={`px-3 py-1 text-xs rounded-md border ${
                    selectedReasons.includes(reason)
                      ? 'bg-primary-100 text-primary-800 border-primary-300'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {reason.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Active Filters:</span>
            {activeFilter !== 'all' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                {activeFilter === 'me' ? 'Assigned to Me' : 'Unassigned'}
              </span>
            )}
            {showOverdue && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                Overdue
              </span>
            )}
            {selectedSeverities.map((sev) => (
              <span
                key={sev}
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                  sev === 'red'
                    ? 'bg-red-100 text-red-800'
                    : sev === 'amber'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {sev}
              </span>
            ))}
            {selectedReasons.slice(0, 3).map((reason) => (
              <span
                key={reason}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800"
              >
                {reason.replace(/_/g, ' ')}
              </span>
            ))}
            {selectedReasons.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                +{selectedReasons.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
