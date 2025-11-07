/**
 * Two-Factor Authentication Service
 * Handles TOTP (Time-based One-Time Password) authentication
 * Compatible with Google Authenticator, Authy, 1Password, etc.
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { supabase } from '@/lib/supabase';

// Configure TOTP settings
authenticator.options = {
  window: 1, // Allow 1 step before/after current time (30 seconds tolerance)
};

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorStatus {
  enabled: boolean;
  verified_at?: string;
}

/**
 * Generate a new TOTP secret and QR code for setup
 */
export async function generateTwoFactorSecret(
  userEmail: string,
  appName: string = 'Ezra Admin'
): Promise<TwoFactorSetup> {
  // Generate a random secret
  const secret = authenticator.generateSecret();

  // Create the otpauth URL for QR code
  const otpauthUrl = authenticator.keyuri(userEmail, appName, secret);

  // Generate QR code as data URL
  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

  // Generate backup codes
  const backupCodes = generateBackupCodes(10);

  return {
    secret,
    qrCodeUrl,
    backupCodes,
  };
}

/**
 * Verify a TOTP code
 */
export function verifyTOTP(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

/**
 * Generate backup codes for account recovery
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Hash backup codes for secure storage
 */
async function hashBackupCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash all backup codes
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map(code => hashBackupCode(code)));
}

/**
 * Verify a backup code
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<boolean> {
  const hashedInput = await hashBackupCode(code);
  return hashedCodes.includes(hashedInput);
}

/**
 * Enable 2FA for a user
 */
export async function enableTwoFactor(
  userId: string,
  secret: string,
  backupCodes: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Hash backup codes before storing
    const hashedCodes = await hashBackupCodes(backupCodes);

    const { error } = await supabase
      .from('profiles')
      .update({
        two_factor_enabled: true,
        two_factor_secret: secret,
        backup_codes: hashedCodes,
        two_factor_verified_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error enabling 2FA:', error);
      return { success: false, error: error.message };
    }

    // Log the event
    await log2FAEvent(userId, 'enabled', true);

    return { success: true };
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return { success: false, error: 'Failed to enable 2FA' };
  }
}

/**
 * Disable 2FA for a user
 */
export async function disableTwoFactor(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        backup_codes: null,
        two_factor_verified_at: null,
      })
      .eq('id', userId);

    if (error) {
      console.error('Error disabling 2FA:', error);
      return { success: false, error: error.message };
    }

    // Log the event
    await log2FAEvent(userId, 'disabled', true);

    return { success: true };
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return { success: false, error: 'Failed to disable 2FA' };
  }
}

/**
 * Get 2FA status for a user
 */
export async function getTwoFactorStatus(
  userId: string
): Promise<TwoFactorStatus | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('two_factor_enabled, two_factor_verified_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error getting 2FA status:', error);
      return null;
    }

    return {
      enabled: data.two_factor_enabled || false,
      verified_at: data.two_factor_verified_at || undefined,
    };
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    return null;
  }
}

/**
 * Verify 2FA code during login
 */
export async function verifyTwoFactorCode(
  userId: string,
  code: string
): Promise<{ success: boolean; usedBackupCode?: boolean; error?: string }> {
  try {
    // Get user's 2FA secret and backup codes
    const { data: user, error } = await supabase
      .from('profiles')
      .select('two_factor_secret, backup_codes')
      .eq('id', userId)
      .single();

    if (error || !user) {
      await log2FAEvent(userId, 'failed', false);
      return { success: false, error: 'User not found' };
    }

    // Try to verify TOTP code first
    if (user.two_factor_secret && verifyTOTP(code, user.two_factor_secret)) {
      // Update last verified time
      await supabase
        .from('profiles')
        .update({ two_factor_verified_at: new Date().toISOString() })
        .eq('id', userId);

      await log2FAEvent(userId, 'verified', true);
      return { success: true };
    }

    // If TOTP fails, try backup code
    if (user.backup_codes && user.backup_codes.length > 0) {
      const isValidBackupCode = await verifyBackupCode(code, user.backup_codes);

      if (isValidBackupCode) {
        // Remove used backup code
        const hashedCode = await hashBackupCode(code);
        const remainingCodes = user.backup_codes.filter((c: string) => c !== hashedCode);

        await supabase
          .from('profiles')
          .update({
            backup_codes: remainingCodes,
            two_factor_verified_at: new Date().toISOString(),
          })
          .eq('id', userId);

        await log2FAEvent(userId, 'backup_used', true);
        return { success: true, usedBackupCode: true };
      }
    }

    // Both methods failed
    await log2FAEvent(userId, 'failed', false);
    return { success: false, error: 'Invalid code' };
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    await log2FAEvent(userId, 'failed', false);
    return { success: false, error: 'Verification failed' };
  }
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(
  userId: string
): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
  try {
    // Generate new backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedCodes = await hashBackupCodes(backupCodes);

    const { error } = await supabase
      .from('profiles')
      .update({ backup_codes: hashedCodes })
      .eq('id', userId);

    if (error) {
      console.error('Error regenerating backup codes:', error);
      return { success: false, error: error.message };
    }

    return { success: true, backupCodes };
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    return { success: false, error: 'Failed to regenerate backup codes' };
  }
}

/**
 * Log 2FA event for audit trail
 */
async function log2FAEvent(
  userId: string,
  eventType: string,
  success: boolean,
  metadata: any = {}
): Promise<void> {
  try {
    await supabase.from('admin_2fa_logs').insert([
      {
        user_id: userId,
        event_type: eventType,
        success,
        metadata,
      },
    ]);
  } catch (error) {
    console.error('Error logging 2FA event:', error);
  }
}

/**
 * Get 2FA logs for a user
 */
export async function getTwoFactorLogs(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('admin_2fa_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting 2FA logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting 2FA logs:', error);
    return [];
  }
}
