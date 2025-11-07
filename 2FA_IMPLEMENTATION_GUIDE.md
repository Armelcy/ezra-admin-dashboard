# 2FA Implementation Guide

## Overview

Two-Factor Authentication (2FA) has been successfully implemented for the Ezra Admin Dashboard using TOTP (Time-based One-Time Passwords), compatible with Google Authenticator, Authy, 1Password, and other authenticator apps.

## Implementation Details

### Files Created

1. **supabase/admin_2fa_schema.sql** - Database schema
   - Added 2FA columns to profiles table
   - Created admin_2fa_logs table for audit trail
   - Added RLS policies and helper functions

2. **lib/services/two-factor-auth.ts** - 2FA Service
   - TOTP generation and verification
   - QR code generation
   - Backup codes management
   - Audit logging

3. **lib/auth-context.tsx** - Authentication Context
   - User state management
   - Profile loading
   - Sign out functionality

4. **app/dashboard/settings/security/page.tsx** - 2FA Setup UI
   - QR code display for setup
   - Code verification
   - Backup codes display
   - 2FA management (enable/disable/regenerate)

### Files Modified

1. **app/login/page.tsx**
   - Added 2FA verification step after password login
   - Shows 2FA code input for users with 2FA enabled
   - Supports both TOTP codes and backup codes

2. **app/dashboard/settings/page.tsx**
   - Added prominent link to 2FA security page in Security tab

3. **package.json**
   - Added otplib (TOTP library)
   - Added qrcode (QR code generation)
   - Added @types/qrcode (TypeScript types)

## Setup Instructions

### Step 1: Run Database Migration

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `supabase/admin_2fa_schema.sql`
4. Click "Run" to execute the schema

This will:
- Add 2FA columns to your profiles table
- Create the admin_2fa_logs table
- Set up RLS policies
- Create helper functions

### Step 2: Verify Installation

The required npm packages have already been installed. If you need to reinstall:

```bash
npm install otplib qrcode @types/qrcode
```

### Step 3: Test the Implementation

#### A. Enable 2FA for Your Admin Account

1. Start the dev server (if not already running):
   ```bash
   npm run dev
   ```

2. Login to the admin dashboard

3. Navigate to: **Settings → Security tab → Click "Manage 2FA"**

4. Click "Enable 2FA" button

5. You'll see:
   - A QR code to scan
   - A manual entry key (in case you can't scan)
   - Instructions

6. Open your authenticator app (Google Authenticator, Authy, etc.)

7. Scan the QR code OR manually enter the secret key

8. Enter the 6-digit code from your authenticator app

9. Click "Verify & Enable"

10. **IMPORTANT**: Save your backup codes!
    - You'll see 10 backup codes
    - Download them using the "Download Codes" button
    - Store them in a safe place
    - Each code can only be used once

#### B. Test 2FA Login

1. Sign out from the dashboard

2. Sign in with your email and password

3. You'll now see a 2FA verification screen

4. Enter the 6-digit code from your authenticator app

5. Click "Verify"

6. You should be logged in successfully!

#### C. Test Backup Codes

1. Sign out again

2. Start signing in with email and password

3. At the 2FA screen, enter one of your backup codes instead of the TOTP code

4. Click "Verify"

5. You should see an alert: "Backup code used successfully"

6. You'll be logged in, and that backup code is now invalid

#### D. Test 2FA Management

1. While logged in, go to **Settings → Security → Manage 2FA**

2. You should see:
   - 2FA status as "Enabled"
   - Last verified time
   - Options to:
     - Regenerate Backup Codes
     - Disable 2FA
     - View Activity logs

3. Test "Regenerate Backup Codes":
   - Click the button
   - Confirm the action
   - New backup codes will be generated
   - Old backup codes are now invalid

4. Test "View Activity":
   - Click "View Activity"
   - You'll see a log of all 2FA events:
     - Setup
     - Enabled
     - Verified (each login)
     - Failed attempts
     - Backup codes used

## Security Features

### TOTP-based Authentication
- Uses industry-standard RFC 6238 TOTP algorithm
- 30-second time windows
- 6-digit codes
- Compatible with all major authenticator apps

### Backup Codes
- 10 backup codes generated during setup
- Hashed using SHA-256 before storage
- Each code can only be used once
- Can be regenerated at any time

### Audit Logging
- All 2FA events are logged in admin_2fa_logs table
- Includes:
  - Event type (setup, enabled, disabled, verified, failed, backup_used)
  - Success/failure status
  - Timestamp
  - User ID
  - Optional metadata (IP address, user agent)

### Row Level Security (RLS)
- Admins can only view their own 2FA logs
- Super admins can view all 2FA logs
- Authenticated users can insert their own logs

## Troubleshooting

### "Invalid code" error
- Make sure your device's time is synchronized
- TOTP codes expire every 30 seconds
- Try generating a new code
- If still failing, use a backup code

### QR code not scanning
- Make sure there's good lighting
- Try the manual entry method instead
- Copy the secret key and enter it manually in your authenticator app

### Lost access to authenticator app
- Use one of your backup codes to login
- After logging in, disable 2FA and set it up again
- If you've lost both authenticator and backup codes, you'll need database-level access to disable 2FA

### Backup codes not working
- Make sure you haven't already used that code
- Codes are case-sensitive (they're shown in uppercase)
- Each code can only be used once

## Production Deployment Notes

### Before Deployment
1. Test thoroughly in development
2. Make sure database migrations are run on production Supabase
3. Ensure environment variables are set correctly

### After Deployment
1. Enable 2FA for all admin accounts
2. Make sure admins save their backup codes
3. Monitor the admin_2fa_logs table for suspicious activity
4. Consider making 2FA mandatory for all admins

### Best Practices
- Require 2FA for super admins immediately
- Recommend 2FA for all admin roles
- Regularly review 2FA activity logs
- Set up alerts for failed 2FA attempts
- Keep backup codes in a secure password manager

## Technical Details

### TOTP Configuration
- Algorithm: SHA-1 (standard for TOTP)
- Time step: 30 seconds
- Code length: 6 digits
- Window: 1 (allows 1 step before/after for clock drift)

### Database Schema
```sql
-- Profiles table additions
ALTER TABLE profiles
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN two_factor_secret TEXT,
ADD COLUMN backup_codes TEXT[],
ADD COLUMN two_factor_verified_at TIMESTAMPTZ;

-- Audit log table
CREATE TABLE admin_2fa_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  event_type TEXT CHECK (event_type IN ('setup', 'enabled', 'disabled', 'verified', 'failed', 'backup_used')),
  success BOOLEAN,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
);
```

### API Methods

```typescript
// Generate 2FA secret and QR code
const setup = await generateTwoFactorSecret(userEmail, 'Ezra Admin');

// Verify TOTP code
const isValid = verifyTOTP(code, secret);

// Enable 2FA
await enableTwoFactor(userId, secret, backupCodes);

// Disable 2FA
await disableTwoFactor(userId);

// Verify during login
const result = await verifyTwoFactorCode(userId, code);

// Regenerate backup codes
await regenerateBackupCodes(userId);

// Get 2FA status
const status = await getTwoFactorStatus(userId);

// Get activity logs
const logs = await getTwoFactorLogs(userId, limit);
```

## Next Steps

1. ✅ Database schema created
2. ✅ 2FA service implemented
3. ✅ Setup UI created
4. ✅ Login flow updated
5. ⏳ **TEST THE IMPLEMENTATION**
6. ⏳ Push to GitHub
7. ⏳ Deploy to Vercel
8. ⏳ Configure admin.ezraservice.com

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check the Supabase logs for database errors
3. Verify that all database migrations ran successfully
4. Ensure packages are installed correctly
5. Make sure the dev server was restarted after installing packages

## Summary

The 2FA implementation is complete and ready for testing. The system provides:
- TOTP-based authentication compatible with all major authenticator apps
- Secure backup codes for account recovery
- Comprehensive audit logging
- User-friendly setup and management interface
- Seamless integration with the existing login flow

All that's left is to test it thoroughly and then deploy to production!
