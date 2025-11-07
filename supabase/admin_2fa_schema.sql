-- Admin 2FA (Two-Factor Authentication) Schema
-- Adds TOTP support for admin accounts

-- Add 2FA columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS backup_codes TEXT[], -- Array of backup codes
ADD COLUMN IF NOT EXISTS two_factor_verified_at TIMESTAMPTZ;

-- Create index for 2FA lookups
CREATE INDEX IF NOT EXISTS idx_profiles_2fa_enabled ON profiles(two_factor_enabled) WHERE role = 'admin';

-- Create 2FA audit log table for tracking 2FA events
CREATE TABLE IF NOT EXISTS admin_2fa_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('setup', 'enabled', 'disabled', 'verified', 'failed', 'backup_used')),
  success BOOLEAN NOT NULL DEFAULT true,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for 2FA logs
CREATE INDEX IF NOT EXISTS idx_2fa_logs_user ON admin_2fa_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_logs_created ON admin_2fa_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_2fa_logs_event ON admin_2fa_logs(event_type);

-- Enable RLS
ALTER TABLE admin_2fa_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 2FA logs
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view own 2FA logs" ON admin_2fa_logs;
DROP POLICY IF EXISTS "System can insert 2FA logs" ON admin_2fa_logs;
DROP POLICY IF EXISTS "Super admins can view all 2FA logs" ON admin_2fa_logs;

-- Admins can view their own 2FA logs
CREATE POLICY "Admins can view own 2FA logs" ON admin_2fa_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- System can insert 2FA logs
CREATE POLICY "System can insert 2FA logs" ON admin_2fa_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only super admins can view all 2FA logs
CREATE POLICY "Super admins can view all 2FA logs" ON admin_2fa_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.email IN (
        -- Add your super admin emails here
        'admin@ezraservice.com'
      )
    )
  );

-- Function to generate backup codes
CREATE OR REPLACE FUNCTION generate_backup_codes(count INTEGER DEFAULT 10)
RETURNS TEXT[] AS $$
DECLARE
  codes TEXT[] := '{}';
  code TEXT;
  i INTEGER;
BEGIN
  FOR i IN 1..count LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    codes := array_append(codes, code);
  END LOOP;
  RETURN codes;
END;
$$ LANGUAGE plpgsql;

-- Function to log 2FA events
CREATE OR REPLACE FUNCTION log_2fa_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_success BOOLEAN DEFAULT true,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO admin_2fa_logs (user_id, event_type, success, ip_address, user_agent, metadata)
  VALUES (p_user_id, p_event_type, p_success, p_ip_address, p_user_agent, p_metadata)
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON COLUMN profiles.two_factor_enabled IS 'Whether 2FA is enabled for this user';
COMMENT ON COLUMN profiles.two_factor_secret IS 'TOTP secret (base32 encoded) - should be encrypted at application level';
COMMENT ON COLUMN profiles.backup_codes IS 'Array of hashed backup codes for account recovery';
COMMENT ON COLUMN profiles.two_factor_verified_at IS 'When 2FA was last successfully verified';

COMMENT ON TABLE admin_2fa_logs IS 'Audit log for all 2FA-related events';
COMMENT ON COLUMN admin_2fa_logs.event_type IS 'Type of 2FA event: setup, enabled, disabled, verified, failed, backup_used';
