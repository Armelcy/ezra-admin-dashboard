'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/supabase';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  AlertCircle,
  RefreshCw,
  User,
  Building,
  MapPin,
  Star,
} from 'lucide-react';

interface ProviderWithProfile {
  id: string;
  user_id: string;
  business_name: string;
  category: string;
  description?: string;
  services: string[];
  rating: number;
  total_reviews: number;
  total_bookings: number;
  hourly_rate: number;
  cni_number?: string;
  cni_image_url?: string;
  cni_verified: boolean;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    location?: string;
  };
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<ProviderWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ProviderWithProfile | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingProviders();
  }, []);

  const loadPendingProviders = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getPendingProviders();
      setProviders(data || []);
    } catch (error) {
      console.error('Error loading pending providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (providerId: string, approved: boolean) => {
    try {
      setProcessing(true);
      await adminAPI.approveProvider(providerId, approved);

      // Reload the list
      await loadPendingProviders();

      // Close modal
      setShowDetailsModal(false);
      setSelectedProvider(null);
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Failed to process approval. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-CM', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
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
          <h1 className="text-2xl font-bold text-gray-900">Provider KYC Approvals</h1>
          <p className="mt-2 text-sm text-gray-700">
            Review and approve provider identity verification documents
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={loadPendingProviders}
            disabled={loading}
            className="inline-flex items-center gap-x-2 rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Alert for pending approvals */}
      {providers.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                You have <strong>{providers.length}</strong> pending provider approval
                {providers.length !== 1 ? 's' : ''} waiting for review.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Providers Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              {/* Provider Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <Building className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {provider.business_name}
                    </h3>
                    <p className="text-sm text-gray-500">{provider.category}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-x-1.5 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                  <Clock className="h-3 w-3" />
                  Pending
                </span>
              </div>

              {/* Provider Details */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{provider.profiles?.full_name || provider.user?.full_name || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{provider.profiles?.location || provider.user?.location || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Star className="h-4 w-4 mr-2 text-gray-400" />
                  <span>
                    {provider.rating.toFixed(1)} ({provider.total_reviews} reviews)
                  </span>
                </div>
              </div>

              {/* CNI Information */}
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">CNI Number</p>
                    <p className="text-sm font-mono text-gray-900">
                      {provider.cni_number || 'N/A'}
                    </p>
                  </div>
                  {provider.cni_image_url && (
                    <button
                      onClick={() => {
                        setSelectedProvider(provider);
                        setShowImageModal(true);
                      }}
                      className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm"
                    >
                      <FileText className="h-4 w-4" />
                      View CNI
                    </button>
                  )}
                </div>
              </div>

              {/* Submitted Date */}
              <div className="mt-3 text-xs text-gray-500">
                Submitted: {formatDate(provider.created_at)}
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedProvider(provider);
                    setShowDetailsModal(true);
                  }}
                  className="flex-1 inline-flex justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4" />
                  Review
                </button>
                <button
                  onClick={() => handleApproval(provider.id, true)}
                  disabled={processing}
                  className="flex-1 inline-flex justify-center items-center gap-x-1.5 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleApproval(provider.id, false)}
                  disabled={processing}
                  className="flex-1 inline-flex justify-center items-center gap-x-1.5 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {providers.length === 0 && !loading && (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">All caught up!</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no pending provider approvals at the moment.
          </p>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedProvider && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowDetailsModal(false)}
            />
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Provider Details
                  </h3>
                </div>
                <div className="mt-4 space-y-4">
                  {/* Business Info */}
                  <div className="border-b pb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Business Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Business Name</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedProvider.business_name}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Category</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedProvider.category}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Hourly Rate</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatCurrency(selectedProvider.hourly_rate)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Total Bookings</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedProvider.total_bookings}</p>
                      </div>
                    </div>
                    {selectedProvider.description && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-500">Description</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedProvider.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Personal Info */}
                  <div className="border-b pb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Personal Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Full Name</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedProvider.profiles.full_name}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Email</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedProvider.profiles.email}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Phone</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedProvider.profiles.phone}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500">Location</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedProvider.profiles.location || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CNI Info */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Identity Verification</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500">CNI Number</label>
                        <p className="mt-1 text-sm font-mono text-gray-900">
                          {selectedProvider.cni_number || 'N/A'}
                        </p>
                      </div>
                      {selectedProvider.cni_image_url && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-2">
                            CNI Document
                          </label>
                          <button
                            onClick={() => setShowImageModal(true)}
                            className="inline-flex items-center gap-x-2 rounded-md bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-100"
                          >
                            <FileText className="h-4 w-4" />
                            View CNI Document
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  className="flex-1 inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
                <button
                  onClick={() => handleApproval(selectedProvider.id, false)}
                  disabled={processing}
                  className="flex-1 inline-flex justify-center items-center gap-x-1.5 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
                <button
                  onClick={() => handleApproval(selectedProvider.id, true)}
                  disabled={processing}
                  className="flex-1 inline-flex justify-center items-center gap-x-1.5 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CNI Image Modal */}
      {showImageModal && selectedProvider?.cni_image_url && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-90 transition-opacity"
              onClick={() => setShowImageModal(false)}
            />
            <div className="inline-block align-middle bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl sm:w-full sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  CNI Document - {selectedProvider.profiles.full_name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  CNI Number: {selectedProvider.cni_number}
                </p>
              </div>
              <div className="mt-4">
                <img
                  src={selectedProvider.cni_image_url}
                  alt="CNI Document"
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  onClick={() => setShowImageModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
