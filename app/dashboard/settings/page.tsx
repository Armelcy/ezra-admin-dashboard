'use client';

import { useState } from 'react';
import {
  Settings,
  CreditCard,
  Shield,
  Bell,
  Mail,
  Users,
  Globe,
  Percent,
  DollarSign,
  Save,
  AlertCircle,
  UserPlus,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';

interface PlatformSettings {
  commission: {
    providerCommissionRate: number;
    referralRewardAmount: number;
    minimumPayoutAmount: number;
    paymentProcessingFee: number;
  };
  payments: {
    mtnMomoEnabled: boolean;
    orangeMoneyEnabled: boolean;
    autoPayoutEnabled: boolean;
    payoutSchedule: 'instant' | 'daily' | 'weekly';
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    adminAlerts: boolean;
  };
  security: {
    requireKYCForProviders: boolean;
    requireKYCForCustomers: boolean;
    minimumAge: number;
    sessionTimeout: number;
    twoFactorRequired: boolean;
  };
  general: {
    platformName: string;
    supportEmail: string;
    supportPhone: string;
    maintenanceMode: boolean;
    defaultLanguage: 'en' | 'fr';
    timezone: string;
  };
}

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: 'super_admin' | 'finance_admin' | 'operations_admin' | 'support_admin' | 'content_admin';
  permissions: string[];
  is_active: boolean;
  created_at: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export default function SettingsPage() {
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'commission' | 'notifications' | 'security' | 'admins'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);

  // Mock settings data
  const [settings, setSettings] = useState<PlatformSettings>({
    commission: {
      providerCommissionRate: 15,
      referralRewardAmount: 5000,
      minimumPayoutAmount: 10000,
      paymentProcessingFee: 2.5,
    },
    payments: {
      mtnMomoEnabled: true,
      orangeMoneyEnabled: true,
      autoPayoutEnabled: false,
      payoutSchedule: 'weekly',
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      adminAlerts: true,
    },
    security: {
      requireKYCForProviders: true,
      requireKYCForCustomers: false,
      minimumAge: 18,
      sessionTimeout: 30,
      twoFactorRequired: true,
    },
    general: {
      platformName: 'Ezra Services',
      supportEmail: 'support@ezraservices.com',
      supportPhone: '+237 6XX XXX XXX',
      maintenanceMode: false,
      defaultLanguage: 'fr',
      timezone: 'Africa/Douala',
    },
  });

  const handleSaveSettings = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
    console.log('Settings saved:', settings);
    // TODO: Implement actual save to Supabase
  };

  const updateSetting = (category: keyof PlatformSettings, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  // Mock admins data
  const [admins, setAdmins] = useState<AdminUser[]>([
    {
      id: '1',
      full_name: 'Super Admin',
      email: 'admin@ezra.com',
      role: 'super_admin',
      permissions: ['all'],
      is_active: true,
      created_at: '2025-01-01',
    },
    {
      id: '2',
      full_name: 'Finance Manager',
      email: 'finance@ezra.com',
      role: 'finance_admin',
      permissions: ['transactions', 'payouts', 'refunds', 'fees'],
      is_active: true,
      created_at: '2025-01-10',
    },
    {
      id: '3',
      full_name: 'Operations Manager',
      email: 'ops@ezra.com',
      role: 'operations_admin',
      permissions: ['bookings', 'users', 'providers', 'services'],
      is_active: true,
      created_at: '2025-01-12',
    },
  ]);

  const availablePermissions: Permission[] = [
    { id: 'dashboard', name: 'Dashboard', description: 'View dashboard metrics', category: 'operations' },
    { id: 'bookings', name: 'Bookings', description: 'Manage bookings', category: 'operations' },
    { id: 'users', name: 'Users', description: 'Manage users', category: 'operations' },
    { id: 'providers', name: 'Providers', description: 'Manage providers & KYC', category: 'operations' },
    { id: 'services', name: 'Services', description: 'Manage service listings', category: 'operations' },
    { id: 'categories', name: 'Categories', description: 'Manage service categories', category: 'operations' },
    { id: 'transactions', name: 'Transactions', description: 'View transactions', category: 'finance' },
    { id: 'payouts', name: 'Payouts', description: 'Process payouts', category: 'finance' },
    { id: 'refunds', name: 'Refunds & Disputes', description: 'Handle refunds', category: 'finance' },
    { id: 'fees', name: 'Fees & Taxes', description: 'Configure fees', category: 'finance' },
    { id: 'exports', name: 'Data Exports', description: 'Export data', category: 'finance' },
    { id: 'reviews', name: 'Reviews', description: 'Moderate reviews', category: 'safety' },
    { id: 'moderation', name: 'Content Moderation', description: 'Review reports', category: 'safety' },
    { id: 'audit', name: 'Audit Logs', description: 'View audit logs', category: 'safety' },
    { id: 'analytics', name: 'Analytics', description: 'View analytics', category: 'growth' },
    { id: 'promo', name: 'Promo Codes', description: 'Manage promo codes', category: 'growth' },
    { id: 'referrals', name: 'Referrals', description: 'Manage referrals', category: 'growth' },
    { id: 'broadcasts', name: 'Broadcasts', description: 'Send notifications', category: 'growth' },
    { id: 'banners', name: 'Banners & CMS', description: 'Manage banners', category: 'growth' },
    { id: 'support', name: 'Support Tickets', description: 'Handle support', category: 'platform' },
    { id: 'settings', name: 'Settings', description: 'Manage settings', category: 'platform' },
  ];

  const roleDefinitions = {
    super_admin: {
      name: 'Super Admin',
      description: 'Full access to all features',
      color: 'bg-purple-100 text-purple-800',
    },
    finance_admin: {
      name: 'Finance Admin',
      description: 'Manage payments, payouts, refunds',
      color: 'bg-green-100 text-green-800',
    },
    operations_admin: {
      name: 'Operations Admin',
      description: 'Manage bookings, users, providers',
      color: 'bg-blue-100 text-blue-800',
    },
    support_admin: {
      name: 'Support Admin',
      description: 'Handle support tickets and customer issues',
      color: 'bg-yellow-100 text-yellow-800',
    },
    content_admin: {
      name: 'Content Admin',
      description: 'Moderate content and reviews',
      color: 'bg-orange-100 text-orange-800',
    },
  };

  const handleDeleteAdmin = (id: string) => {
    if (confirm('Are you sure you want to delete this admin?')) {
      setAdmins(admins.filter((admin) => admin.id !== id));
    }
  };

  const handleEditAdmin = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setShowEditAdminModal(true);
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Globe },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'commission', name: 'Commission', icon: Percent },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'admins', name: 'Admin Roles', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure platform-wide settings and preferences
          </p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Unsaved Changes Alert */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Unsaved Changes</h3>
              <p className="mt-1 text-sm text-yellow-700">
                You have unsaved changes. Don't forget to click "Save Changes" to apply them.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      isActive
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon
                    className={`
                      -ml-0.5 mr-2 h-5 w-5
                      ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                  />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="platformName" className="block text-sm font-medium text-gray-700">
                      Platform Name
                    </label>
                    <input
                      type="text"
                      id="platformName"
                      value={settings.general.platformName}
                      onChange={(e) => updateSetting('general', 'platformName', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="supportEmail" className="block text-sm font-medium text-gray-700">
                      Support Email
                    </label>
                    <input
                      type="email"
                      id="supportEmail"
                      value={settings.general.supportEmail}
                      onChange={(e) => updateSetting('general', 'supportEmail', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="supportPhone" className="block text-sm font-medium text-gray-700">
                      Support Phone
                    </label>
                    <input
                      type="tel"
                      id="supportPhone"
                      value={settings.general.supportPhone}
                      onChange={(e) => updateSetting('general', 'supportPhone', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="defaultLanguage" className="block text-sm font-medium text-gray-700">
                      Default Language
                    </label>
                    <select
                      id="defaultLanguage"
                      value={settings.general.defaultLanguage}
                      onChange={(e) => updateSetting('general', 'defaultLanguage', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                      Timezone
                    </label>
                    <select
                      id="timezone"
                      value={settings.general.timezone}
                      onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="Africa/Douala">Africa/Douala (GMT+1)</option>
                      <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                      <option value="UTC">UTC (GMT+0)</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={settings.general.maintenanceMode}
                      onChange={(e) => updateSetting('general', 'maintenanceMode', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900">
                      Enable Maintenance Mode
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Settings</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="mtnMomo" className="text-sm font-medium text-gray-900">
                        MTN Mobile Money
                      </label>
                      <p className="text-sm text-gray-500">Enable MTN MoMo as a payment method</p>
                    </div>
                    <input
                      type="checkbox"
                      id="mtnMomo"
                      checked={settings.payments.mtnMomoEnabled}
                      onChange={(e) => updateSetting('payments', 'mtnMomoEnabled', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="orangeMoney" className="text-sm font-medium text-gray-900">
                        Orange Money
                      </label>
                      <p className="text-sm text-gray-500">Enable Orange Money as a payment method</p>
                    </div>
                    <input
                      type="checkbox"
                      id="orangeMoney"
                      checked={settings.payments.orangeMoneyEnabled}
                      onChange={(e) => updateSetting('payments', 'orangeMoneyEnabled', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="autoPayout" className="text-sm font-medium text-gray-900">
                        Automatic Payouts
                      </label>
                      <p className="text-sm text-gray-500">Automatically process provider payouts</p>
                    </div>
                    <input
                      type="checkbox"
                      id="autoPayout"
                      checked={settings.payments.autoPayoutEnabled}
                      onChange={(e) => updateSetting('payments', 'autoPayoutEnabled', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label htmlFor="payoutSchedule" className="block text-sm font-medium text-gray-700">
                      Payout Schedule
                    </label>
                    <select
                      id="payoutSchedule"
                      value={settings.payments.payoutSchedule}
                      onChange={(e) => updateSetting('payments', 'payoutSchedule', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="instant">Instant</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Commission Settings */}
          {activeTab === 'commission' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Commission & Fees</h3>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="providerCommission" className="block text-sm font-medium text-gray-700">
                      Provider Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      id="providerCommission"
                      min="0"
                      max="100"
                      step="0.1"
                      value={settings.commission.providerCommissionRate}
                      onChange={(e) => updateSetting('commission', 'providerCommissionRate', parseFloat(e.target.value))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Platform commission on each completed booking
                    </p>
                  </div>

                  <div>
                    <label htmlFor="referralReward" className="block text-sm font-medium text-gray-700">
                      Referral Reward Amount (FCFA)
                    </label>
                    <input
                      type="number"
                      id="referralReward"
                      min="0"
                      step="100"
                      value={settings.commission.referralRewardAmount}
                      onChange={(e) => updateSetting('commission', 'referralRewardAmount', parseFloat(e.target.value))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Reward amount for successful referrals
                    </p>
                  </div>

                  <div>
                    <label htmlFor="minimumPayout" className="block text-sm font-medium text-gray-700">
                      Minimum Payout Amount (FCFA)
                    </label>
                    <input
                      type="number"
                      id="minimumPayout"
                      min="0"
                      step="1000"
                      value={settings.commission.minimumPayoutAmount}
                      onChange={(e) => updateSetting('commission', 'minimumPayoutAmount', parseFloat(e.target.value))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Minimum amount required for provider payout
                    </p>
                  </div>

                  <div>
                    <label htmlFor="processingFee" className="block text-sm font-medium text-gray-700">
                      Payment Processing Fee (%)
                    </label>
                    <input
                      type="number"
                      id="processingFee"
                      min="0"
                      max="10"
                      step="0.1"
                      value={settings.commission.paymentProcessingFee}
                      onChange={(e) => updateSetting('commission', 'paymentProcessingFee', parseFloat(e.target.value))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Payment gateway processing fee
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="emailNotif" className="text-sm font-medium text-gray-900">
                        Email Notifications
                      </label>
                      <p className="text-sm text-gray-500">Send email notifications to users</p>
                    </div>
                    <input
                      type="checkbox"
                      id="emailNotif"
                      checked={settings.notifications.emailNotifications}
                      onChange={(e) => updateSetting('notifications', 'emailNotifications', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="smsNotif" className="text-sm font-medium text-gray-900">
                        SMS Notifications
                      </label>
                      <p className="text-sm text-gray-500">Send SMS notifications to users</p>
                    </div>
                    <input
                      type="checkbox"
                      id="smsNotif"
                      checked={settings.notifications.smsNotifications}
                      onChange={(e) => updateSetting('notifications', 'smsNotifications', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="pushNotif" className="text-sm font-medium text-gray-900">
                        Push Notifications
                      </label>
                      <p className="text-sm text-gray-500">Send push notifications to mobile apps</p>
                    </div>
                    <input
                      type="checkbox"
                      id="pushNotif"
                      checked={settings.notifications.pushNotifications}
                      onChange={(e) => updateSetting('notifications', 'pushNotifications', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="adminAlerts" className="text-sm font-medium text-gray-900">
                        Admin Alerts
                      </label>
                      <p className="text-sm text-gray-500">Receive alerts for critical platform events</p>
                    </div>
                    <input
                      type="checkbox"
                      id="adminAlerts"
                      checked={settings.notifications.adminAlerts}
                      onChange={(e) => updateSetting('notifications', 'adminAlerts', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>

                {/* 2FA Link */}
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Shield className="h-8 w-8 text-primary-600 mr-3" />
                      <div>
                        <h4 className="text-sm font-semibold text-primary-900">Two-Factor Authentication</h4>
                        <p className="text-sm text-primary-700 mt-1">
                          Secure your admin account with TOTP-based 2FA using Google Authenticator, Authy, or similar apps
                        </p>
                      </div>
                    </div>
                    <a
                      href="/dashboard/settings/security"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Manage 2FA
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="providerKYC" className="text-sm font-medium text-gray-900">
                        Require KYC for Providers
                      </label>
                      <p className="text-sm text-gray-500">Providers must complete KYC verification</p>
                    </div>
                    <input
                      type="checkbox"
                      id="providerKYC"
                      checked={settings.security.requireKYCForProviders}
                      onChange={(e) => updateSetting('security', 'requireKYCForProviders', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="customerKYC" className="text-sm font-medium text-gray-900">
                        Require KYC for Customers
                      </label>
                      <p className="text-sm text-gray-500">Customers must complete KYC verification</p>
                    </div>
                    <input
                      type="checkbox"
                      id="customerKYC"
                      checked={settings.security.requireKYCForCustomers}
                      onChange={(e) => updateSetting('security', 'requireKYCForCustomers', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="twoFactor" className="text-sm font-medium text-gray-900">
                        Two-Factor Authentication
                      </label>
                      <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                    </div>
                    <input
                      type="checkbox"
                      id="twoFactor"
                      checked={settings.security.twoFactorRequired}
                      onChange={(e) => updateSetting('security', 'twoFactorRequired', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label htmlFor="minimumAge" className="block text-sm font-medium text-gray-700">
                      Minimum Age Requirement
                    </label>
                    <input
                      type="number"
                      id="minimumAge"
                      min="13"
                      max="25"
                      value={settings.security.minimumAge}
                      onChange={(e) => updateSetting('security', 'minimumAge', parseInt(e.target.value))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Minimum age to use the platform
                    </p>
                  </div>

                  <div>
                    <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      id="sessionTimeout"
                      min="5"
                      max="1440"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Automatic logout after inactivity
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Roles Management */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Admin Users & Roles</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage sub-admins and their access permissions
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateAdminModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Admin
                </button>
              </div>

              {/* Admin List Table */}
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permissions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {admins.map((admin) => (
                      <tr key={admin.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{admin.full_name}</div>
                              <div className="text-sm text-gray-500">{admin.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              roleDefinitions[admin.role].color
                            }`}
                          >
                            {roleDefinitions[admin.role].name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {admin.permissions.includes('all') ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                All Permissions
                              </span>
                            ) : (
                              admin.permissions.slice(0, 3).map((perm) => (
                                <span
                                  key={perm}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {perm}
                                </span>
                              ))
                            )}
                            {admin.permissions.length > 3 && !admin.permissions.includes('all') && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                +{admin.permissions.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              admin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {admin.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEditAdmin(admin)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {admin.role !== 'super_admin' && (
                            <button
                              onClick={() => handleDeleteAdmin(admin.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Role Definitions Info */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Role Definitions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(roleDefinitions).map(([key, role]) => (
                    <div key={key} className="flex items-start">
                      <div className="flex-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role.color}`}>
                          {role.name}
                        </span>
                        <p className="mt-1 text-sm text-gray-600">{role.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowCreateAdminModal(false)} />

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setShowCreateAdminModal(false)}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Create New Admin</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="john@ezra.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <select className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                        {Object.entries(roleDefinitions).map(([key, role]) => (
                          <option key={key} value={key}>
                            {role.name} - {role.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                      <div className="border border-gray-200 rounded-md p-4 max-h-64 overflow-y-auto">
                        {['operations', 'finance', 'safety', 'growth', 'platform'].map((category) => (
                          <div key={category} className="mb-4">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{category}</h4>
                            <div className="space-y-2">
                              {availablePermissions
                                .filter((p) => p.category === category)
                                .map((permission) => (
                                  <div key={permission.id} className="flex items-start">
                                    <input
                                      type="checkbox"
                                      id={`perm-${permission.id}`}
                                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
                                    />
                                    <label htmlFor={`perm-${permission.id}`} className="ml-2 text-sm">
                                      <span className="font-medium text-gray-900">{permission.name}</span>
                                      <span className="text-gray-500"> - {permission.description}</span>
                                    </label>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowCreateAdminModal(false)}
                      className="inline-flex justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // Add save logic here
                        setShowCreateAdminModal(false);
                      }}
                      className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Create Admin
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditAdminModal && selectedAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowEditAdminModal(false)} />

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setShowEditAdminModal(false)}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Admin</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input
                        type="text"
                        defaultValue={selectedAdmin.full_name}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        defaultValue={selectedAdmin.email}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <select
                        defaultValue={selectedAdmin.role}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        {Object.entries(roleDefinitions).map(([key, role]) => (
                          <option key={key} value={key}>
                            {role.name} - {role.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                      <div className="border border-gray-200 rounded-md p-4 max-h-64 overflow-y-auto">
                        {['operations', 'finance', 'safety', 'growth', 'platform'].map((category) => (
                          <div key={category} className="mb-4">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{category}</h4>
                            <div className="space-y-2">
                              {availablePermissions
                                .filter((p) => p.category === category)
                                .map((permission) => (
                                  <div key={permission.id} className="flex items-start">
                                    <input
                                      type="checkbox"
                                      id={`edit-perm-${permission.id}`}
                                      defaultChecked={selectedAdmin.permissions.includes(permission.id) || selectedAdmin.permissions.includes('all')}
                                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
                                    />
                                    <label htmlFor={`edit-perm-${permission.id}`} className="ml-2 text-sm">
                                      <span className="font-medium text-gray-900">{permission.name}</span>
                                      <span className="text-gray-500"> - {permission.description}</span>
                                    </label>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        defaultChecked={selectedAdmin.is_active}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-900">
                        Active Status
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowEditAdminModal(false)}
                      className="inline-flex justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // Add update logic here
                        setShowEditAdminModal(false);
                      }}
                      className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">Settings Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Changes to settings take effect immediately after saving</li>
                <li>Commission changes only apply to new bookings</li>
                <li>Maintenance mode will display a notice to all users</li>
                <li>Some settings may require app restart for users</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
