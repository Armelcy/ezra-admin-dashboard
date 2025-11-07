'use client';

import { useState } from 'react';
import { Image as ImageIcon, Plus, Edit2, Trash2, Eye } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  order_index: number;
}

export default function BannersPage() {
  const mockBanners: Banner[] = [
    {
      id: '1',
      title: 'Winter Special Offer',
      description: '20% off all cleaning services',
      image_url: '/banners/winter.jpg',
      link_url: '/promotions/winter',
      is_active: true,
      order_index: 1,
    },
    {
      id: '2',
      title: 'New Provider Rewards',
      description: 'Join now and earn bonus rewards',
      image_url: '/banners/provider.jpg',
      link_url: '/become-provider',
      is_active: true,
      order_index: 2,
    },
  ];

  const [banners] = useState(mockBanners);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Banners & CMS</h1>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Banner
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-gray-400" />
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{banner.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{banner.description}</p>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        banner.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {banner.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex flex-col space-y-2">
                  <button className="text-primary-600 hover:text-primary-900">
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
