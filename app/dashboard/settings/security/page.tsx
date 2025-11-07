'use client';

import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Copy, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  generateTwoFactorSecret,
  enableTwoFactor,
  disableTwoFactor,
  getTwoFactorStatus,
  verifyTOTP,
  regenerateBackupCodes,
  getTwoFactorLogs,
} from '@/lib/services/two-factor-auth';

interface SetupState {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export default function SecurityPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [verifiedAt, setVerifiedAt] = useState<string | undefined>();

  // Setup flow states
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupData, setSetupData] = useState<SetupState | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [setupComplete, setSetupComplete] = useState(false);

  // Manage flow states
  const [isDisabling, setIsDisabling] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);

  // Activity log
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    loadSecurityStatus();
  }, [user]);

  async function loadSecurityStatus() {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const status = await getTwoFactorStatus(user.id);

      if (status) {
        setIs2FAEnabled(status.enabled);
        setVerifiedAt(status.verified_at);
      }
    } catch (error) {
      console.error('Error loading 2FA status:', error);
      // For development with mock users, this is expected
      setIs2FAEnabled(false);
    }

    setIsLoading(false);
  }

  async function startSetup() {
    if (!user?.email) return;

    setIsSettingUp(true);
    const setup = await generateTwoFactorSecret(user.email, 'Ezra Admin');
    setSetupData(setup);
  }

  async function verifyAndEnableTotp() {
    if (!setupData || !user?.id) return;

    setIsVerifying(true);
    setVerificationError('');

    // Verify the code first
    const isValid = verifyTOTP(verificationCode, setupData.secret);

    if (!isValid) {
      setVerificationError('Invalid code. Please try again.');
      setIsVerifying(false);
      return;
    }

    // Enable 2FA with the verified secret
    const result = await enableTwoFactor(user.id, setupData.secret, setupData.backupCodes);

    if (result.success) {
      setSetupComplete(true);
      setIs2FAEnabled(true);
      setVerifiedAt(new Date().toISOString());
    } else {
      setVerificationError(result.error || 'Failed to enable 2FA');
    }

    setIsVerifying(false);
  }

  async function disable2FA() {
    if (!user?.id) return;

    const confirmed = confirm(
      'Are you sure you want to disable Two-Factor Authentication? This will make your account less secure.'
    );

    if (!confirmed) return;

    setIsDisabling(true);
    const result = await disableTwoFactor(user.id);

    if (result.success) {
      setIs2FAEnabled(false);
      setVerifiedAt(undefined);
      setSetupData(null);
      setIsSettingUp(false);
    } else {
      alert(result.error || 'Failed to disable 2FA');
    }

    setIsDisabling(false);
  }

  async function regenerateCodes() {
    if (!user?.id) return;

    const confirmed = confirm(
      'This will generate new backup codes and invalidate the old ones. Make sure to save the new codes.'
    );

    if (!confirmed) return;

    setIsRegenerating(true);
    const result = await regenerateBackupCodes(user.id);

    if (result.success && result.backupCodes) {
      setNewBackupCodes(result.backupCodes);
    } else {
      alert(result.error || 'Failed to regenerate backup codes');
    }

    setIsRegenerating(false);
  }

  async function loadActivityLogs() {
    if (!user?.id) return;

    const logs = await getTwoFactorLogs(user.id, 20);
    setActivityLogs(logs);
    setShowLogs(true);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  function downloadBackupCodes(codes: string[]) {
    const content = `Ezra Admin - 2FA Backup Codes\n` +
      `Generated: ${new Date().toLocaleString()}\n` +
      `Email: ${user?.email}\n\n` +
      `IMPORTANT: Save these codes in a secure location.\n` +
      `Each code can only be used once.\n\n` +
      codes.map((code, i) => `${i + 1}. ${code}`).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ezra-admin-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account security and two-factor authentication
        </p>
      </div>

      {/* 2FA Status Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <Shield className={`h-12 w-12 ${is2FAEnabled ? 'text-green-600' : 'text-gray-400'}`} />
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Two-Factor Authentication (2FA)
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {is2FAEnabled
                  ? 'Your account is protected with 2FA'
                  : 'Add an extra layer of security to your account'}
              </p>
              {verifiedAt && (
                <p className="mt-1 text-xs text-gray-400">
                  Last verified: {new Date(verifiedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center">
            {is2FAEnabled ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircle className="h-4 w-4 mr-1" />
                Enabled
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                <XCircle className="h-4 w-4 mr-1" />
                Disabled
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          {!is2FAEnabled && !isSettingUp && (
            <button
              onClick={startSetup}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <Shield className="h-4 w-4 mr-2" />
              Enable 2FA
            </button>
          )}

          {is2FAEnabled && (
            <>
              <button
                onClick={regenerateCodes}
                disabled={isRegenerating}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100"
              >
                {isRegenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Regenerate Backup Codes
              </button>

              <button
                onClick={disable2FA}
                disabled={isDisabling}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:bg-gray-100"
              >
                {isDisabling ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Disable 2FA
              </button>

              <button
                onClick={loadActivityLogs}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                View Activity
              </button>
            </>
          )}
        </div>
      </div>

      {/* Setup Flow */}
      {isSettingUp && setupData && !setupComplete && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Set Up Two-Factor Authentication
          </h3>

          <div className="space-y-6">
            {/* Step 1: Scan QR Code */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Step 1: Scan QR Code
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                Open your authenticator app (Google Authenticator, Authy, 1Password, etc.) and scan this QR code:
              </p>
              <div className="flex justify-center bg-gray-50 p-6 rounded-lg">
                <img src={setupData.qrCodeUrl} alt="2FA QR Code" className="w-64 h-64" />
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-xs text-blue-800">
                  <strong>Manual Entry:</strong> If you can't scan the QR code, enter this secret key manually:
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded text-sm font-mono">
                    {setupData.secret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(setupData.secret)}
                    className="p-2 text-blue-600 hover:text-blue-800"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Verify Code */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Step 2: Verify Code
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                Enter the 6-digit code from your authenticator app:
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-center text-2xl font-mono tracking-widest"
                />
                <button
                  onClick={verifyAndEnableTotp}
                  disabled={verificationCode.length !== 6 || isVerifying}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isVerifying ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Verify & Enable'
                  )}
                </button>
              </div>
              {verificationError && (
                <p className="mt-2 text-sm text-red-600">{verificationError}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Setup Complete - Show Backup Codes */}
      {setupComplete && setupData && (
        <div className="bg-white shadow rounded-lg p-6 border-2 border-green-500">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              2FA Successfully Enabled!
            </h3>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">
                  Save Your Backup Codes
                </h4>
                <p className="mt-1 text-sm text-yellow-700">
                  Store these codes in a safe place. You can use them to access your account if you lose access to your authenticator app. Each code can only be used once.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2">
              {setupData.backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white px-3 py-2 rounded border border-gray-200"
                >
                  <span className="font-mono text-sm">{code}</span>
                  <button
                    onClick={() => copyToClipboard(code)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => downloadBackupCodes(setupData.backupCodes)}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Download Codes
            </button>
            <button
              onClick={() => {
                setSetupComplete(false);
                setSetupData(null);
                setIsSettingUp(false);
                setVerificationCode('');
              }}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* New Backup Codes */}
      {newBackupCodes.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 border-2 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            New Backup Codes Generated
          </h3>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <p className="text-sm text-yellow-700">
              Your old backup codes are now invalid. Save these new codes in a safe place.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2">
              {newBackupCodes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white px-3 py-2 rounded border border-gray-200"
                >
                  <span className="font-mono text-sm">{code}</span>
                  <button
                    onClick={() => copyToClipboard(code)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => downloadBackupCodes(newBackupCodes)}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Download Codes
            </button>
            <button
              onClick={() => setNewBackupCodes([])}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Activity Logs */}
      {showLogs && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent 2FA Activity
            </h3>
            <button
              onClick={() => setShowLogs(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Hide
            </button>
          </div>

          {activityLogs.length === 0 ? (
            <p className="text-sm text-gray-500">No activity logs found</p>
          ) : (
            <div className="space-y-2">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {log.event_type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      log.success
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {log.success ? 'Success' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
