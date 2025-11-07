'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  RefreshCw,
  Percent,
  Calendar,
} from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value?: number;
  max_uses?: number;
  current_uses: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  description?: string;
  created_at: string;
}

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    min_order_value: 0,
    max_uses: 0,
    valid_from: '',
    valid_until: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    try {
      setLoading(true);
      // Mock data for now
      const mockData: PromoCode[] = [
        {
          id: '1',
          code: 'WELCOME50',
          discount_type: 'percentage',
          discount_value: 50,
          min_order_value: 0,
          max_uses: 100,
          current_uses: 45,
          valid_from: '2024-01-01',
          valid_until: '2024-12-31',
          is_active: true,
          description: 'Welcome discount for new users',
          created_at: '2024-01-01',
        },
        {
          id: '2',
          code: 'SAVE5000',
          discount_type: 'fixed',
          discount_value: 5000,
          min_order_value: 20000,
          max_uses: 50,
          current_uses: 23,
          valid_from: '2024-01-15',
          valid_until: '2024-06-30',
          is_active: true,
          description: 'Fixed discount on orders above 20,000 FCFA',
          created_at: '2024-01-15',
        },
        {
          id: '3',
          code: 'SUMMER25',
          discount_type: 'percentage',
          discount_value: 25,
          min_order_value: 10000,
          max_uses: 200,
          current_uses: 198,
          valid_from: '2024-06-01',
          valid_until: '2024-08-31',
          is_active: false,
          description: 'Summer seasonal discount',
          created_at: '2024-06-01',
        },
      ];
      setPromoCodes(mockData);
    } catch (error) {
      console.error('Error loading promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    // Reset form
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_order_value: 0,
      max_uses: 0,
      valid_from: '',
      valid_until: '',
      description: '',
      is_active: true,
    });
    setShowCreateModal(true);
  };

  const handleEdit = (code: PromoCode) => {
    setSelectedCode(code);
    setFormData({
      code: code.code,
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      min_order_value: code.min_order_value || 0,
      max_uses: code.max_uses || 0,
      valid_from: code.valid_from,
      valid_until: code.valid_until,
      description: code.description || '',
      is_active: code.is_active,
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Add create/update logic here
    console.log('Submitting:', formData);
    setShowCreateModal(false);
    setShowEditModal(false);
    loadPromoCodes();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this promo code?')) {
      // Add delete logic here
      console.log('Deleting:', id);
      loadPromoCodes();
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`Code "${code}" copied to clipboard!`);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-CM', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const formatDiscount = (code: PromoCode) => {
    if (code.discount_type === 'percentage') {
      return `${code.discount_value}%`;
    }
    return `${code.discount_value.toLocaleString()} FCFA`;
  };

  const filteredCodes = promoCodes.filter((code) =>
    code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    code.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: promoCodes.length,
    active: promoCodes.filter((c) => c.is_active).length,
    totalUses: promoCodes.reduce((sum, c) => sum + c.current_uses, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotional Codes</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage discount codes for customers
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
          <button
            onClick={loadPromoCodes}
            className="inline-flex items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-x-2 rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
          >
            <Plus className="h-4 w-4" />
            Create Code
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Codes</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.total}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Active Codes</dt>
          <dd className="mt-1 text-3xl font-semibold text-green-600">{stats.active}</dd>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Uses</dt>
          <dd className="mt-1 text-3xl font-semibold text-blue-600">{stats.totalUses}</dd>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search promo codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      {/* Promo Codes Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filteredCodes.map((code) => (
          <div
            key={code.id}
            className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <Percent className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{code.code}</h3>
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-500">{code.description}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium ${
                    code.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {code.is_active ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {code.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Discount Badge */}
              <div className="mt-4 inline-flex items-center rounded-md bg-primary-50 px-3 py-2">
                <span className="text-2xl font-bold text-primary-700">
                  {formatDiscount(code)}
                </span>
                <span className="ml-2 text-sm text-primary-600">discount</span>
              </div>

              {/* Details Grid */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Min. Order Value</p>
                  <p className="text-sm font-medium text-gray-900">
                    {code.min_order_value ? `${code.min_order_value.toLocaleString()} FCFA` : 'None'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Usage</p>
                  <p className="text-sm font-medium text-gray-900">
                    {code.current_uses} / {code.max_uses || '∞'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Valid From</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(code.valid_from)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Valid Until</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(code.valid_until)}</p>
                </div>
              </div>

              {/* Progress Bar */}
              {code.max_uses && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Usage Progress</span>
                    <span>{Math.round((code.current_uses / code.max_uses) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((code.current_uses / code.max_uses) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEdit(code)}
                  className="flex-1 inline-flex justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(code.id)}
                  className="flex-1 inline-flex justify-center items-center gap-x-1.5 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCodes.length === 0 && !loading && (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <Percent className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No promo codes found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new promotional code.
          </p>
          <div className="mt-6">
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-x-2 rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
            >
              <Plus className="h-4 w-4" />
              Create Code
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
              }}
            />
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <form onSubmit={handleSubmit}>
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {showCreateModal ? 'Create Promo Code' : 'Edit Promo Code'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Code</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Discount Type</label>
                        <select
                          value={formData.discount_type}
                          onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="percentage">Percentage</option>
                          <option value="fixed">Fixed Amount</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Discount Value</label>
                        <input
                          type="number"
                          value={formData.discount_value}
                          onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Min. Order Value</label>
                        <input
                          type="number"
                          value={formData.min_order_value}
                          onChange={(e) => setFormData({ ...formData, min_order_value: Number(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Uses</label>
                        <input
                          type="number"
                          value={formData.max_uses}
                          onChange={(e) => setFormData({ ...formData, max_uses: Number(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Valid From</label>
                        <input
                          type="date"
                          value={formData.valid_from}
                          onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Valid Until</label>
                        <input
                          type="date"
                          value={formData.valid_until}
                          onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label className="ml-2 block text-sm text-gray-900">Active</label>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 flex gap-3">
                  <button
                    type="button"
                    className="flex-1 inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 inline-flex justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                  >
                    {showCreateModal ? 'Create' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
