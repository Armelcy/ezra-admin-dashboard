'use client';

import { useState } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Eye,
  X,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  User,
  DollarSign,
  Phone,
  Mail,
} from 'lucide-react';

interface Booking {
  id: string;
  booking_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  provider_id: string;
  provider_name: string;
  provider_phone: string;
  service_name: string;
  category_name: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  payment_status: 'pending' | 'paid' | 'refunded';
  total_amount: number;
  service_fee: number;
  address: string;
  city: string;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
}

export default function BookingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Mock stats data
  const stats: BookingStats = {
    totalBookings: 3456,
    pendingBookings: 87,
    completedBookings: 2987,
    cancelledBookings: 234,
    totalRevenue: 45678000,
    averageBookingValue: 13200,
  };

  // Mock bookings data
  const mockBookings: Booking[] = [
    {
      id: '1',
      booking_number: 'BK-2025-00123',
      customer_id: 'cust1',
      customer_name: 'Marie Dupont',
      customer_phone: '+237 671234567',
      customer_email: 'marie@email.com',
      provider_id: 'prov1',
      provider_name: 'Jean Pierre',
      provider_phone: '+237 679876543',
      service_name: 'Home Deep Cleaning',
      category_name: 'Home Cleaning',
      booking_date: '2025-01-18',
      booking_time: '10:00',
      status: 'confirmed',
      payment_status: 'paid',
      total_amount: 15000,
      service_fee: 2250,
      address: '123 Rue de la Paix, Bonapriso',
      city: 'Douala',
      special_instructions: 'Please bring eco-friendly cleaning products',
      created_at: '2025-01-15T10:30:00Z',
      updated_at: '2025-01-15T11:00:00Z',
    },
    {
      id: '2',
      booking_number: 'BK-2025-00124',
      customer_id: 'cust2',
      customer_name: 'Samuel Kamga',
      customer_phone: '+237 651234567',
      customer_email: 'samuel@email.com',
      provider_id: 'prov2',
      provider_name: 'Alice Mbong',
      provider_phone: '+237 699876543',
      service_name: 'Plumbing Repair',
      category_name: 'Plumbing',
      booking_date: '2025-01-16',
      booking_time: '14:00',
      status: 'in_progress',
      payment_status: 'paid',
      total_amount: 12000,
      service_fee: 1800,
      address: '45 Boulevard du President',
      city: 'Yaounde',
      created_at: '2025-01-15T12:00:00Z',
      updated_at: '2025-01-16T13:50:00Z',
    },
    {
      id: '3',
      booking_number: 'BK-2025-00125',
      customer_id: 'cust3',
      customer_name: 'Grace Ndi',
      customer_phone: '+237 641234567',
      customer_email: 'grace@email.com',
      provider_id: 'prov3',
      provider_name: 'Paul Ndongo',
      provider_phone: '+237 689876543',
      service_name: 'Electrical Installation',
      category_name: 'Electrical',
      booking_date: '2025-01-20',
      booking_time: '09:00',
      status: 'pending',
      payment_status: 'pending',
      total_amount: 25000,
      service_fee: 3750,
      address: '78 Quartier Bastos',
      city: 'Yaounde',
      special_instructions: 'Installing ceiling fans in 3 rooms',
      created_at: '2025-01-15T15:00:00Z',
      updated_at: '2025-01-15T15:00:00Z',
    },
    {
      id: '4',
      booking_number: 'BK-2025-00126',
      customer_id: 'cust4',
      customer_name: 'Eric Fotso',
      customer_phone: '+237 631234567',
      customer_email: 'eric@email.com',
      provider_id: 'prov4',
      provider_name: 'Christine Bella',
      provider_phone: '+237 679876543',
      service_name: 'Garden Maintenance',
      category_name: 'Garden & Landscaping',
      booking_date: '2025-01-14',
      booking_time: '08:00',
      status: 'completed',
      payment_status: 'paid',
      total_amount: 18000,
      service_fee: 2700,
      address: '12 Avenue des Cocotiers',
      city: 'Douala',
      created_at: '2025-01-12T09:00:00Z',
      updated_at: '2025-01-14T17:00:00Z',
    },
    {
      id: '5',
      booking_number: 'BK-2025-00127',
      customer_id: 'cust5',
      customer_name: 'Celine Mballa',
      customer_phone: '+237 621234567',
      customer_email: 'celine@email.com',
      provider_id: 'prov5',
      provider_name: 'Thomas Abega',
      provider_phone: '+237 669876543',
      service_name: 'Painting Service',
      category_name: 'Painting',
      booking_date: '2025-01-19',
      booking_time: '10:00',
      status: 'cancelled',
      payment_status: 'refunded',
      total_amount: 35000,
      service_fee: 5250,
      address: '56 Rue Joss',
      city: 'Douala',
      special_instructions: 'Cancelled due to material unavailability',
      created_at: '2025-01-13T14:00:00Z',
      updated_at: '2025-01-15T10:00:00Z',
    },
  ];

  const [bookings, setBookings] = useState<Booking[]>(mockBookings);

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    if (selectedStatus !== 'all' && booking.status !== selectedStatus) return false;
    if (selectedPaymentStatus !== 'all' && booking.payment_status !== selectedPaymentStatus)
      return false;
    if (
      searchQuery &&
      !booking.booking_number.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !booking.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !booking.provider_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !booking.service_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'disputed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
        <p className="mt-2 text-sm text-gray-700">
          View and manage all bookings on the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.totalBookings}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.pendingBookings}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.completedBookings}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cancelled</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.cancelledBookings}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Revenue</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {formatCurrency(stats.totalRevenue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Value</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {formatCurrency(stats.averageBookingValue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="search" className="sr-only">
              Search bookings
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Search by booking #, customer, provider, or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="sr-only">
              Status
            </label>
            <select
              id="status"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>

          <div>
            <label htmlFor="payment_status" className="sr-only">
              Payment Status
            </label>
            <select
              id="payment_status"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Bookings ({filteredBookings.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No bookings found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your filters or search query
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {booking.booking_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.customer_name}</div>
                      <div className="text-xs text-gray-500">{booking.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.provider_name}</div>
                      <div className="text-xs text-gray-500">{booking.provider_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.service_name}</div>
                      <div className="text-xs text-gray-500">{booking.category_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(booking.booking_date)}</div>
                      <div className="text-xs text-gray-500">{booking.booking_time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(booking.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          booking.status
                        )}`}
                      >
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusBadgeColor(
                          booking.payment_status
                        )}`}
                      >
                        {booking.payment_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Booking Details - {selectedBooking.booking_number}
                  </h3>
                  <div className="mt-6 border-t border-gray-200 pt-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 uppercase">Customer</h4>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-900">{selectedBooking.customer_name}</p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {selectedBooking.customer_phone}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {selectedBooking.customer_email}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 uppercase">Provider</h4>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-900">{selectedBooking.provider_name}</p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {selectedBooking.provider_phone}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase">Service Details</h4>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-900">{selectedBooking.service_name}</p>
                        <p className="text-sm text-gray-600">{selectedBooking.category_name}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(selectedBooking.booking_date)} at {selectedBooking.booking_time}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase">Location</h4>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-900 flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {selectedBooking.address}
                        </p>
                        <p className="text-sm text-gray-600">{selectedBooking.city}</p>
                      </div>
                    </div>

                    {selectedBooking.special_instructions && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 uppercase">
                          Special Instructions
                        </h4>
                        <p className="mt-2 text-sm text-gray-900">
                          {selectedBooking.special_instructions}
                        </p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase">Payment</h4>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="text-gray-900">
                            {formatCurrency(selectedBooking.total_amount - selectedBooking.service_fee)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Service Fee (15%):</span>
                          <span className="text-gray-900">
                            {formatCurrency(selectedBooking.service_fee)}
                          </span>
                        </div>
                        <div className="flex justify-between text-base font-medium border-t pt-2">
                          <span className="text-gray-900">Total:</span>
                          <span className="text-gray-900">
                            {formatCurrency(selectedBooking.total_amount)}
                          </span>
                        </div>
                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusBadgeColor(
                              selectedBooking.payment_status
                            )}`}
                          >
                            {selectedBooking.payment_status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                          selectedBooking.status
                        )}`}
                      >
                        Status: {selectedBooking.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
