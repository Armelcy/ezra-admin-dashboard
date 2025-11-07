'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getTwoFactorStatus, verifyTwoFactorCode } from '@/lib/services/two-factor-auth';
import { logAuthEvent } from '@/lib/services/audit-log';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 2FA states
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Get client info for audit logging
    const ipAddress = 'unknown'; // Will be set by middleware in production
    const userAgent = navigator.userAgent;

    try {
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Log failed login attempt
        await logAuthEvent('login_failed', undefined, email, ipAddress, userAgent, 'Authentication failed');

        // Use generic error message - don't reveal if email exists
        throw new Error('Invalid credentials. Please check your email and password.');
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_active, two_factor_enabled')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        await supabase.auth.signOut();
        await logAuthEvent('login_failed', authData.user.id, email, ipAddress, userAgent, 'Profile not found');
        throw new Error('Invalid credentials. Please check your email and password.');
      }

      if (profile.role !== 'admin') {
        await supabase.auth.signOut();
        await logAuthEvent('login_failed', authData.user.id, email, ipAddress, userAgent, 'Not an admin user');
        throw new Error('Invalid credentials. Please check your email and password.');
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();
        await logAuthEvent('login_failed', authData.user.id, email, ipAddress, userAgent, 'Account disabled');
        throw new Error('Your account has been disabled. Please contact support.');
      }

      // Check if 2FA is enabled
      if (profile.two_factor_enabled) {
        setUserId(authData.user.id);
        setShow2FA(true);
        setLoading(false);
        return;
      }

      // Success - log and redirect
      await logAuthEvent('login_success', authData.user.id, email, ipAddress, userAgent);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setVerifying2FA(true);
    setError('');

    try {
      const result = await verifyTwoFactorCode(userId, twoFactorCode);

      if (result.success) {
        // 2FA verified - redirect to dashboard
        if (result.usedBackupCode) {
          alert('Backup code used successfully. You have fewer backup codes remaining.');
        }
        router.push('/dashboard');
      } else {
        setError(result.error || 'Invalid code');
        setTwoFactorCode('');
      }
    } catch (err: any) {
      console.error('2FA verification error:', err);
      setError('Verification failed');
      setTwoFactorCode('');
    } finally {
      setVerifying2FA(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center bg-white rounded-full shadow-lg">
            <span className="text-3xl font-bold text-primary-600">E</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Ezra Admin Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            {show2FA ? 'Two-Factor Authentication' : 'Sign in to manage your platform'}
          </p>
        </div>

        {/* Login Form */}
        {!show2FA ? (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        ) : (
          /* 2FA Verification Form */
          <form className="mt-8 space-y-6" onSubmit={handleVerify2FA}>
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-primary-100 rounded-full p-3">
                  <Shield className="h-8 w-8 text-primary-600" />
                </div>
              </div>

              <h3 className="text-center text-lg font-semibold text-gray-900 mb-2">
                Enter Authentication Code
              </h3>
              <p className="text-center text-sm text-gray-500 mb-6">
                Enter the 6-digit code from your authenticator app or use a backup code
              </p>

              {error && (
                <div className="rounded-md bg-red-50 p-4 mb-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="2fa-code" className="sr-only">
                  Authentication Code
                </label>
                <input
                  id="2fa-code"
                  name="2fa-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={8}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                  disabled={verifying2FA}
                  autoFocus
                />
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="submit"
                  disabled={verifying2FA || twoFactorCode.length < 6}
                  className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying2FA ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Verify'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShow2FA(false);
                    setTwoFactorCode('');
                    setError('');
                    setUserId(null);
                    // Sign out to start fresh
                    supabase.auth.signOut();
                  }}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </form>
        )}

        {!show2FA && (
          <div className="text-center text-sm text-gray-300">
            <p>Admin access only</p>
          </div>
        )}
      </div>
    </div>
  );
}
