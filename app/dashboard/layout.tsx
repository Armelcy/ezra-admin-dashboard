'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSummary } from '@/lib/services/action-center';
import { DataModeProvider } from '@/contexts/DataModeContext';
import { AuthProvider } from '@/lib/auth-context';
import DataModeToggle from '@/components/DataModeToggle';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CreditCard,
  BarChart3,
  Shield,
  Ticket,
  Gift,
  Settings,
  FileText,
  HeadphonesIcon,
  LogOut,
  Menu,
  X,
  Layers,
  Calendar,
  List,
  DollarSign,
  AlertTriangle,
  Receipt,
  Download,
  Star,
  MessageSquare,
  Image,
  MapPin,
  Zap,
  ToggleLeft,
  Globe,
  Bell,
} from 'lucide-react';

const navigation = [
  // OPERATIONS
  { name: 'Action Center', href: '/dashboard/action-center', icon: Bell, section: 'operations', showBadge: true },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'operations' },
  { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar, section: 'operations' },
  { name: 'Users', href: '/dashboard/users', icon: Users, section: 'operations' },
  { name: 'Providers', href: '/dashboard/providers', icon: UserCheck, section: 'operations' },
  { name: 'Service Categories', href: '/dashboard/categories', icon: Layers, section: 'operations' },
  { name: 'Service Listings', href: '/dashboard/services', icon: List, section: 'operations' },

  // FINANCE
  { name: 'Transactions', href: '/dashboard/transactions', icon: CreditCard, section: 'finance' },
  { name: 'Payouts', href: '/dashboard/payouts', icon: DollarSign, section: 'finance' },
  { name: 'Refunds & Disputes', href: '/dashboard/refunds', icon: AlertTriangle, section: 'finance' },
  { name: 'Fees & Taxes', href: '/dashboard/fees', icon: Receipt, section: 'finance' },
  { name: 'Exports', href: '/dashboard/exports', icon: Download, section: 'finance' },

  // TRUST & SAFETY
  { name: 'Reviews & Ratings', href: '/dashboard/reviews', icon: Star, section: 'safety' },
  { name: 'Content Moderation', href: '/dashboard/moderation', icon: Shield, section: 'safety' },
  { name: 'Audit Logs', href: '/dashboard/audit-logs', icon: FileText, section: 'safety' },

  // GROWTH
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, section: 'growth' },
  { name: 'Promo Codes', href: '/dashboard/promo-codes', icon: Ticket, section: 'growth' },
  { name: 'Referrals', href: '/dashboard/referrals', icon: Gift, section: 'growth' },
  { name: 'Broadcasts', href: '/dashboard/broadcasts', icon: MessageSquare, section: 'growth' },
  { name: 'Banners & CMS', href: '/dashboard/banners', icon: Image, section: 'growth' },

  // PLATFORM
  { name: 'Geo & Service Areas', href: '/dashboard/geo-areas', icon: MapPin, section: 'platform' },
  { name: 'Integrations', href: '/dashboard/integrations', icon: Zap, section: 'platform' },
  { name: 'Feature Flags', href: '/dashboard/feature-flags', icon: ToggleLeft, section: 'platform' },
  { name: 'Localization', href: '/dashboard/localization', icon: Globe, section: 'platform' },
  { name: 'Support Tickets', href: '/dashboard/support', icon: HeadphonesIcon, section: 'platform' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, section: 'platform' },
];

const sections = [
  { id: 'operations', name: 'OPERATIONS', emoji: '📊' },
  { id: 'finance', name: 'FINANCE', emoji: '💰' },
  { id: 'safety', name: 'TRUST & SAFETY', emoji: '🛡️' },
  { id: 'growth', name: 'GROWTH', emoji: '📈' },
  { id: 'platform', name: 'PLATFORM', emoji: '⚙️' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionCenterBadge, setActionCenterBadge] = useState<number>(0);

  useEffect(() => {
    checkUser();
    loadActionCenterBadge();

    // Reload badge every 30 seconds
    const interval = setInterval(loadActionCenterBadge, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadActionCenterBadge = async () => {
    try {
      const summary = await getSummary();
      setActionCenterBadge(summary.totalOpen);
    } catch (error) {
      console.error('Failed to load action center badge:', error);
    }
  };

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut();
        router.push('/login');
        return;
      }

      setUser(profile);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <DataModeProvider>
        <div className="flex min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-navy-900 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative lg:inset-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 bg-navy-800">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <span className="ml-3 text-white font-semibold text-lg">Ezra Admin</span>
            </div>
            <button
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {sections.map((section) => (
              <div key={section.id} className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {section.emoji} {section.name}
                </div>
                {navigation
                  .filter((item) => item.section === section.id)
                  .map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors
                          ${
                            isActive
                              ? 'bg-navy-800 text-white'
                              : 'text-gray-300 hover:bg-navy-800 hover:text-white'
                          }
                        `}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <div className="flex items-center">
                          <Icon className="mr-3 h-5 w-5" />
                          {item.name}
                        </div>
                        {item.showBadge && actionCenterBadge > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                            {actionCenterBadge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
              </div>
            ))}
          </nav>

          {/* User info and logout */}
          <div className="p-4 bg-navy-800">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                {user?.full_name?.[0] || 'A'}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">{user?.full_name || 'Admin'}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-navy-700 rounded-md transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 w-full">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              {navigation.find((item) => item.href === pathname)?.name || 'Dashboard'}
            </h1>
            <div className="flex items-center space-x-4">
              <DataModeToggle />
              <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Admin
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-100">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
      </DataModeProvider>
    </AuthProvider>
  );
}
