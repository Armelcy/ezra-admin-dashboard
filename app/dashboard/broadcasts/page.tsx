'use client';

import { useState } from 'react';
import { MessageSquare, Send, Users } from 'lucide-react';

export default function BroadcastsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');

  const handleSend = () => {
    console.log('Broadcasting:', { title, message, audience });
    // TODO: Implement broadcast
    setTitle('');
    setMessage('');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Broadcasts</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Send Notification</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Notification title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Your message here..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Users</option>
              <option value="customers">Customers Only</option>
              <option value="providers">Providers Only</option>
            </select>
          </div>
          <button
            onClick={handleSend}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Broadcast
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Broadcasts</h2>
        <div className="space-y-3">
          <div className="border-l-4 border-primary-500 pl-4 py-2">
            <h3 className="text-sm font-medium text-gray-900">Platform Update</h3>
            <p className="text-sm text-gray-600">Sent to All Users • Jan 15, 2025</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <h3 className="text-sm font-medium text-gray-900">New Features Available</h3>
            <p className="text-sm text-gray-600">Sent to Providers • Jan 14, 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}
