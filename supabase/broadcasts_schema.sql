-- Broadcasts System with OneSignal Integration
-- Allows admins to send push notifications to users

-- Drop existing tables if exists
DROP TABLE IF EXISTS broadcast_recipients CASCADE;
DROP TABLE IF EXISTS broadcasts CASCADE;

-- Broadcasts table
CREATE TABLE broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'customers', 'providers', 'specific')),
  specific_user_ids UUID[] DEFAULT '{}',

  -- OneSignal integration
  onesignal_notification_id TEXT,
  onesignal_external_id TEXT,

  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled')),

  -- Statistics
  total_recipients INTEGER DEFAULT 0,
  successful_sends INTEGER DEFAULT 0,
  failed_sends INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,

  -- Additional data
  action_url TEXT,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',

  -- Error tracking
  error_message TEXT,

  -- Audit fields
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Broadcast Recipients table (for tracking individual deliveries)
CREATE TABLE broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES broadcasts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT,
  user_email TEXT,

  -- Delivery status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'opened', 'clicked')),

  -- OneSignal player ID for this user
  onesignal_player_id TEXT,

  -- Tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,

  -- Error tracking
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_broadcasts_status ON broadcasts(status);
CREATE INDEX idx_broadcasts_created_by ON broadcasts(created_by);
CREATE INDEX idx_broadcasts_scheduled ON broadcasts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_broadcasts_created_at ON broadcasts(created_at DESC);
CREATE INDEX idx_broadcast_recipients_broadcast ON broadcast_recipients(broadcast_id);
CREATE INDEX idx_broadcast_recipients_user ON broadcast_recipients(user_id);
CREATE INDEX idx_broadcast_recipients_status ON broadcast_recipients(status);

-- Function to update broadcast statistics
CREATE OR REPLACE FUNCTION update_broadcast_stats(broadcast_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE broadcasts
  SET
    total_recipients = (
      SELECT COUNT(*) FROM broadcast_recipients WHERE broadcast_id = broadcast_uuid
    ),
    successful_sends = (
      SELECT COUNT(*) FROM broadcast_recipients WHERE broadcast_id = broadcast_uuid AND status IN ('sent', 'delivered', 'opened', 'clicked')
    ),
    failed_sends = (
      SELECT COUNT(*) FROM broadcast_recipients WHERE broadcast_id = broadcast_uuid AND status = 'failed'
    ),
    opened_count = (
      SELECT COUNT(*) FROM broadcast_recipients WHERE broadcast_id = broadcast_uuid AND status IN ('opened', 'clicked')
    ),
    clicked_count = (
      SELECT COUNT(*) FROM broadcast_recipients WHERE broadcast_id = broadcast_uuid AND status = 'clicked'
    ),
    updated_at = NOW()
  WHERE id = broadcast_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update broadcast stats when recipient status changes
CREATE OR REPLACE FUNCTION trigger_update_broadcast_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_broadcast_stats(NEW.broadcast_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_on_recipient_change
  AFTER INSERT OR UPDATE ON broadcast_recipients
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_broadcast_stats();

-- Updated at trigger for broadcasts
CREATE TRIGGER update_broadcasts_updated_at
  BEFORE UPDATE ON broadcasts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get eligible recipients for a broadcast
CREATE OR REPLACE FUNCTION get_broadcast_recipients(
  p_target_audience TEXT,
  p_specific_user_ids UUID[] DEFAULT '{}'
)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  user_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.role::TEXT
  FROM profiles p
  WHERE
    p.is_active = true
    AND (
      (p_target_audience = 'all')
      OR (p_target_audience = 'customers' AND p.role = 'customer')
      OR (p_target_audience = 'providers' AND p.role = 'provider')
      OR (p_target_audience = 'specific' AND p.id = ANY(p_specific_user_ids))
    );
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_recipients ENABLE ROW LEVEL SECURITY;

-- Admins can view all broadcasts
CREATE POLICY "Admins can view all broadcasts"
  ON broadcasts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can create broadcasts
CREATE POLICY "Admins can create broadcasts"
  ON broadcasts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    AND created_by = auth.uid()
  );

-- Admins can update broadcasts
CREATE POLICY "Admins can update broadcasts"
  ON broadcasts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete broadcasts
CREATE POLICY "Admins can delete broadcasts"
  ON broadcasts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can view all broadcast recipients
CREATE POLICY "Admins can view all recipients"
  ON broadcast_recipients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can view their own broadcast receipts
CREATE POLICY "Users can view own receipts"
  ON broadcast_recipients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage broadcast recipients
CREATE POLICY "Admins can manage recipients"
  ON broadcast_recipients FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Sample seed data (optional - comment out for production)
-- INSERT INTO broadcasts (title, message, target_audience, status, created_by, created_by_name, sent_at, total_recipients, successful_sends) VALUES
-- ('Welcome to Ezra!', 'Thank you for joining Ezra Services. Book your first service today!', 'customers', 'sent', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), 'Admin User', NOW() - INTERVAL '2 days', 150, 148),
-- ('New Features Available', 'Check out our new chat feature and improved booking system!', 'all', 'sent', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), 'Admin User', NOW() - INTERVAL '5 days', 300, 295);
