'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Users,
  UserCheck,
  Clock,
  CreditCard,
  TrendingUp,
  AlertCircle,
  DollarSign,
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeProviders: number;
  pendingApprovals: number;
  totalTransactions: number;
  platformRevenue: number;
  activeBookings: number;
  pendingPayouts: number;
}

interface Activity {
  id: string;
  type: string;
  message: string;
  time: string;
  status: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeProviders: 0,
    pendingApprovals: 0,
    totalTransactions: 0,
    platformRevenue: 0,
    activeBookings: 0,
    pendingPayouts: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load stats
      const [usersData, providersData, bookingsData, transactionsData] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('providers').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*'),
        supabase.from('transactions').select('*'),
      ]);

      const pendingProviders = await supabase
        .from('providers')
        .select('*', { count: 'exact', head: true })
        .eq('cni_verified', false)
        .not('cni_number', 'is', null);

      const activeBookings = bookingsData.data?.filter(
        (b) => b.status === 'confirmed' || b.status === 'in_progress'
      ).length || 0;

      const completedBookings = bookingsData.data?.filter(
        (b) => b.status === 'completed'
      ) || [];

      const platformRevenue = completedBookings.reduce(
        (sum, b) => sum + (b.service_fee || 0),
        0
      );

      const pendingPayouts = completedBookings.filter(
        (b) => !b.escrow_released
      ).length;

      setStats({
        totalUsers: usersData.count || 0,
        activeProviders: providersData.count || 0,
        pendingApprovals: pendingProviders.count || 0,
        totalTransactions: transactionsData.data?.length || 0,
        platformRevenue,
        activeBookings,
        pendingPayouts,
      });

      // Mock activity feed
      setActivities([
        {
          id: '1',
          type: 'user',
          message: 'New user registration: Marie Nguema',
          time: '2 hours ago',
          status: 'completed',
        },
        {
          id: '2',
          type: 'kyc',
          message: 'Provider KYC submitted by Jean Fotso',
          time: '3 hours ago',
          status: 'pending',
        },
        {
          id: '3',
          type: 'payment',
          message: 'Payment of 25,000 FCFA processed',
          time: '5 hours ago',
          status: 'completed',
        },
        {
          id: '4',
          type: 'booking',
          message: 'New booking created',
          time: '1 day ago',
          status: 'completed',
        },
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  const statCards = [
    {
      name: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      name: 'Active Providers',
      value: stats.activeProviders.toLocaleString(),
      icon: UserCheck,
      color: 'bg-green-500',
      change: '+8%',
    },
    {
      name: 'Pending Approvals',
      value: stats.pendingApprovals.toLocaleString(),
      icon: AlertCircle,
      color: 'bg-orange-500',
      urgent: stats.pendingApprovals > 0,
    },
    {
      name: 'Active Bookings',
      value: stats.activeBookings.toLocaleString(),
      icon: Clock,
      color: 'bg-purple-500',
    },
    {
      name: 'Total Transactions',
      value: stats.totalTransactions.toLocaleString(),
      icon: CreditCard,
      color: 'bg-indigo-500',
    },
    {
      name: 'Platform Revenue',
      value: formatCurrency(stats.platformRevenue),
      icon: DollarSign,
      color: 'bg-emerald-500',
      change: '+15%',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className={`bg-white overflow-hidden shadow rounded-lg ${
                stat.urgent ? 'ring-2 ring-orange-500' : ''
              }`}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${stat.color} rounded-md p-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </div>
                        {stat.change && (
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <TrendingUp className="h-4 w-4 mr-0.5" />
                            {stat.change}
                          </div>
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending Payouts Alert */}
      {stats.pendingPayouts > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You have <strong>{stats.pendingPayouts}</strong> pending escrow payouts waiting to be released.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Activity
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Latest platform activity and events
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {activities.map((activity) => (
            <li key={activity.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`
                    w-2 h-2 rounded-full mr-3
                    ${activity.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}
                  `} />
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                </div>
                <div className="ml-2 flex-shrink-0 flex">
                  <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {activity.time}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
