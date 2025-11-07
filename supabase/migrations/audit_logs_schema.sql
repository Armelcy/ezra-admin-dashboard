-- Audit Logs Schema
-- Comprehensive logging for all security-relevant events

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Event information
  event_type TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,

  -- Actor (who performed the action)
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  actor_name TEXT,

  -- Target (who/what was affected)
  target_id UUID,
  target_type TEXT,
  target_email TEXT,

  -- Request context
  ip_address TEXT,
  user_agent TEXT,

  -- Additional data
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON admin_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON admin_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON admin_audit_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON admin_audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON admin_audit_logs(success) WHERE success = false;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON admin_audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_type_created ON admin_audit_logs(event_type, created_at DESC);

-- RLS Policies
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY admin_read_audit_logs ON admin_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.is_active = true
    )
  );

-- Only system can insert audit logs (via service role)
CREATE POLICY system_insert_audit_logs ON admin_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE admin_audit_logs IS 'Comprehensive audit log for all security-relevant events in the admin dashboard';
COMMENT ON COLUMN admin_audit_logs.event_type IS 'Type of event (login_success, role_changed, etc.)';
COMMENT ON COLUMN admin_audit_logs.actor_id IS 'User who performed the action';
COMMENT ON COLUMN admin_audit_logs.target_id IS 'User or entity affected by the action';
COMMENT ON COLUMN admin_audit_logs.metadata IS 'Additional contextual data specific to the event type';

-- Function to automatically clean up old audit logs (optional)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete audit logs older than 2 years
  DELETE FROM admin_audit_logs
  WHERE created_at < NOW() - INTERVAL '2 years';
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON admin_audit_logs TO authenticated;
GRANT INSERT ON admin_audit_logs TO service_role;
