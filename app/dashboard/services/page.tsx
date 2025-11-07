'use client';

import { useState } from 'react';
import { List, Search, Edit2, Trash2, ToggleLeft, ToggleRight, Eye, Plus } from 'lucide-react';

interface ServiceListing {
  id: string;
  provider_id: string;
  provider_name: string;
  service_name: string;
  category_name: string;
  description: string;
  base_price: number;
  duration_minutes: number;
  is_active: boolean;
  total_bookings: number;
  average_rating: number;
  created_at: string;
}

export default function ServiceListingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const mockServices: ServiceListing[] = [
    {
      id: '1',
      provider_id: 'prov1',
      provider_name: 'Jean Pierre',
      service_name: 'Home Deep Cleaning',
      category_name: 'Home Cleaning',
      description: 'Complete deep cleaning service for your home',
      base_price: 15000,
      duration_minutes: 180,
      is_active: true,
      total_bookings: 234,
      average_rating: 4.8,
      created_at: '2025-01-10',
    },
    {
      id: '2',
      provider_id: 'prov2',
      provider_name: 'Alice Mbong',
      service_name: 'Emergency Plumbing',
      category_name: 'Plumbing',
      description: '24/7 emergency plumbing repair service',
      base_price: 12000,
      duration_minutes: 120,
      is_active: true,
      total_bookings: 187,
      average_rating: 4.6,
      created_at: '2025-01-08',
    },
  ];

  const [services] = useState(mockServices);

  const filteredServices = services.filter((service) => {
    if (selectedCategory !== 'all' && service.category_name !== selectedCategory) return false;
    if (searchQuery && !service.service_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !service.provider_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Listings</h1>
          <p className="mt-2 text-sm text-gray-700">Manage all service offerings on the platform</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <select
            className="block w-full pl-3 pr-10 py-2 border-gray-300 rounded-md"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Home Cleaning">Home Cleaning</option>
            <option value="Plumbing">Plumbing</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredServices.map((service) => (
          <div key={service.id} className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">{service.service_name}</h3>
            <p className="text-sm text-gray-500">{service.provider_name}</p>
            <p className="mt-2 text-sm text-gray-600">{service.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">
                {service.base_price.toLocaleString()} FCFA
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {service.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
