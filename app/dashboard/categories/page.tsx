'use client';

import { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
  Save,
  X,
} from 'lucide-react';

interface ServiceCategory {
  id: string;
  name: string;
  name_fr: string;
  description: string;
  description_fr: string;
  icon: string;
  image_url?: string;
  is_active: boolean;
  order_index: number;
  parent_category_id?: string;
  total_services: number;
  total_bookings: number;
  created_at: string;
  updated_at: string;
}

interface CategorySuggestion {
  id: string;
  category_name: string;
  category_name_fr: string;
  description: string;
  suggested_by: string;
  provider_id: string;
  provider_name: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  pendingSuggestions: number;
  mostPopularCategory: string;
}

export default function ServiceCategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Mock stats data
  const stats: CategoryStats = {
    totalCategories: 24,
    activeCategories: 22,
    pendingSuggestions: 8,
    mostPopularCategory: 'Home Cleaning',
  };

  // Mock categories data
  const mockCategories: ServiceCategory[] = [
    {
      id: '1',
      name: 'Home Cleaning',
      name_fr: 'Nettoyage à Domicile',
      description: 'Professional home cleaning services',
      description_fr: 'Services de nettoyage professionnel à domicile',
      icon: '🧹',
      is_active: true,
      order_index: 1,
      total_services: 45,
      total_bookings: 1234,
      created_at: '2024-01-15',
      updated_at: '2024-01-15',
    },
    {
      id: '2',
      name: 'Plumbing',
      name_fr: 'Plomberie',
      description: 'Plumbing repairs and installations',
      description_fr: 'Réparations et installations de plomberie',
      icon: '🔧',
      is_active: true,
      order_index: 2,
      total_services: 38,
      total_bookings: 987,
      created_at: '2024-01-15',
      updated_at: '2024-01-15',
    },
    {
      id: '3',
      name: 'Electrical',
      name_fr: 'Électricité',
      description: 'Electrical repairs and installations',
      description_fr: 'Réparations et installations électriques',
      icon: '⚡',
      is_active: true,
      order_index: 3,
      total_services: 32,
      total_bookings: 856,
      created_at: '2024-01-15',
      updated_at: '2024-01-15',
    },
    {
      id: '4',
      name: 'Carpentry',
      name_fr: 'Menuiserie',
      description: 'Furniture making and wood repairs',
      description_fr: 'Fabrication de meubles et réparations en bois',
      icon: '🪚',
      is_active: true,
      order_index: 4,
      total_services: 28,
      total_bookings: 654,
      created_at: '2024-01-15',
      updated_at: '2024-01-15',
    },
    {
      id: '5',
      name: 'Painting',
      name_fr: 'Peinture',
      description: 'Interior and exterior painting',
      description_fr: 'Peinture intérieure et extérieure',
      icon: '🎨',
      is_active: true,
      order_index: 5,
      total_services: 25,
      total_bookings: 543,
      created_at: '2024-01-15',
      updated_at: '2024-01-15',
    },
    {
      id: '6',
      name: 'Garden & Landscaping',
      name_fr: 'Jardin & Aménagement Paysager',
      description: 'Garden maintenance and landscaping',
      description_fr: 'Entretien de jardin et aménagement paysager',
      icon: '🌿',
      is_active: true,
      order_index: 6,
      total_services: 22,
      total_bookings: 432,
      created_at: '2024-01-15',
      updated_at: '2024-01-15',
    },
    {
      id: '7',
      name: 'Car Wash',
      name_fr: 'Lavage Auto',
      description: 'Professional car washing and detailing',
      description_fr: 'Lavage et detailing automobile professionnel',
      icon: '🚗',
      is_active: false,
      order_index: 7,
      total_services: 18,
      total_bookings: 321,
      created_at: '2024-01-15',
      updated_at: '2024-01-15',
    },
    {
      id: '8',
      name: 'Tutoring',
      name_fr: 'Tutorat',
      description: 'Educational tutoring services',
      description_fr: 'Services de tutorat éducatif',
      icon: '📚',
      is_active: true,
      order_index: 8,
      total_services: 42,
      total_bookings: 876,
      created_at: '2024-01-15',
      updated_at: '2024-01-15',
    },
  ];

  // Mock suggestions data
  const mockSuggestions: CategorySuggestion[] = [
    {
      id: '1',
      category_name: 'Pool Cleaning',
      category_name_fr: 'Nettoyage de Piscine',
      description: 'Professional pool cleaning and maintenance services',
      suggested_by: 'provider',
      provider_id: 'prov123',
      provider_name: 'Jean Pierre',
      reason: 'I have expertise in pool maintenance and many clients have been asking for this service',
      status: 'pending',
      created_at: '2025-01-14T10:00:00Z',
    },
    {
      id: '2',
      category_name: 'Pet Grooming',
      category_name_fr: 'Toilettage pour Animaux',
      description: 'Professional pet grooming and care',
      suggested_by: 'provider',
      provider_id: 'prov456',
      provider_name: 'Marie Dupont',
      reason: 'There is high demand for pet grooming services in the area',
      status: 'pending',
      created_at: '2025-01-13T15:30:00Z',
    },
    {
      id: '3',
      category_name: 'Event Planning',
      category_name_fr: 'Organisation d\'Événements',
      description: 'Professional event planning and coordination',
      suggested_by: 'provider',
      provider_id: 'prov789',
      provider_name: 'Samuel Kamga',
      reason: 'I have 5 years experience organizing events and would like to offer this on the platform',
      status: 'pending',
      created_at: '2025-01-12T09:15:00Z',
    },
  ];

  const [categories, setCategories] = useState<ServiceCategory[]>(mockCategories);
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>(mockSuggestions);

  // Filter categories based on search
  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.name_fr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleActive = (categoryId: string) => {
    setCategories(
      categories.map((cat) =>
        cat.id === categoryId ? { ...cat, is_active: !cat.is_active } : cat
      )
    );
    console.log('Toggled category:', categoryId);
    // TODO: Implement actual API call
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      setCategories(categories.filter((cat) => cat.id !== categoryId));
      console.log('Deleted category:', categoryId);
      // TODO: Implement actual API call
    }
  };

  const handleEditCategory = (category: ServiceCategory) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleApproveSuggestion = (suggestionId: string) => {
    setSuggestions(
      suggestions.map((sug) =>
        sug.id === suggestionId ? { ...sug, status: 'approved' } : sug
      )
    );
    console.log('Approved suggestion:', suggestionId);
    // TODO: Implement actual API call to create category
  };

  const handleRejectSuggestion = (suggestionId: string) => {
    setSuggestions(
      suggestions.map((sug) =>
        sug.id === suggestionId ? { ...sug, status: 'rejected' } : sug
      )
    );
    console.log('Rejected suggestion:', suggestionId);
    // TODO: Implement actual API call
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Categories</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage service categories and review provider suggestions
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Suggestions ({suggestions.filter((s) => s.status === 'pending').length})
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Layers className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Categories</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.totalCategories}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Categories</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.activeCategories}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Suggestions</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.pendingSuggestions}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Most Popular</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.mostPopularCategory}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions Panel */}
      {showSuggestions && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Provider Suggestions</h2>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {suggestions.filter((s) => s.status === 'pending').length === 0 ? (
              <div className="px-6 py-12 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No pending suggestions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  All provider suggestions have been reviewed
                </p>
              </div>
            ) : (
              suggestions
                .filter((s) => s.status === 'pending')
                .map((suggestion) => (
                  <div key={suggestion.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-medium text-gray-900">
                            {suggestion.category_name}
                          </h3>
                          <span className="text-sm text-gray-500">
                            ({suggestion.category_name_fr})
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{suggestion.description}</p>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                          <span>Suggested by: {suggestion.provider_name}</span>
                          <span>•</span>
                          <span>{formatDate(suggestion.created_at)}</span>
                        </div>
                        <div className="mt-2 bg-gray-50 rounded p-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Reason:</span> {suggestion.reason}
                          </p>
                        </div>
                      </div>
                      <div className="ml-4 flex gap-2">
                        <button
                          onClick={() => handleApproveSuggestion(suggestion.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectSuggestion(suggestion.id)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-4xl">{category.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{category.name_fr}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActive(category.id)}
                  className="flex-shrink-0"
                >
                  {category.is_active ? (
                    <ToggleRight className="h-6 w-6 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-gray-400" />
                  )}
                </button>
              </div>

              <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                {category.description}
              </p>

              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-gray-500">
                    <span className="font-medium">{category.total_services}</span>
                    <span className="ml-1">services</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <span className="font-medium">{category.total_bookings}</span>
                    <span className="ml-1">bookings</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    category.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {category.is_active ? 'Active' : 'Inactive'}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <Layers className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No categories found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search query or create a new category
          </p>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">Category Management Tips</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Review provider suggestions regularly to expand service offerings</li>
                <li>Inactive categories are hidden from users but data is preserved</li>
                <li>Popular categories should be placed higher in the order</li>
                <li>Always provide both English and French translations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal would go here */}
      {/* TODO: Implement create/edit modal with form fields */}
    </div>
  );
}
