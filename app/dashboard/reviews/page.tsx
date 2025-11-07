'use client';

import { useState } from 'react';
import { Star, Search, Eye, Trash2 } from 'lucide-react';

interface Review {
  id: string;
  customer_name: string;
  provider_name: string;
  rating: number;
  comment: string;
  booking_number: string;
  created_at: string;
  is_flagged: boolean;
}

export default function ReviewsPage() {
  const [selectedRating, setSelectedRating] = useState('all');

  const mockReviews: Review[] = [
    {
      id: '1',
      customer_name: 'Marie Dupont',
      provider_name: 'Jean Pierre',
      rating: 5,
      comment: 'Excellent service! Very professional and thorough.',
      booking_number: 'BK-2025-00123',
      created_at: '2025-01-15T10:00:00Z',
      is_flagged: false,
    },
    {
      id: '2',
      customer_name: 'Samuel Kamga',
      provider_name: 'Alice Mbong',
      rating: 4,
      comment: 'Good work, arrived on time',
      booking_number: 'BK-2025-00124',
      created_at: '2025-01-14T15:30:00Z',
      is_flagged: false,
    },
  ];

  const [reviews] = useState(mockReviews);

  const filteredReviews = reviews.filter((review) => {
    if (selectedRating !== 'all' && review.rating !== Number(selectedRating)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <select
          className="block w-full px-3 py-2 border-gray-300 rounded-md"
          value={selectedRating}
          onChange={(e) => setSelectedRating(e.target.value)}
        >
          <option value="all">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <div key={review.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium text-gray-900">{review.customer_name}</h3>
                  <div className="ml-4 flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500">Provider: {review.provider_name}</p>
                <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                <p className="mt-2 text-xs text-gray-500">Booking: {review.booking_number}</p>
              </div>
              <button className="ml-4 text-red-600 hover:text-red-900">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
