-- Feature Flags System
-- Toggle features on/off without deploying app
-- Enables A/B testing, gradual rollouts, emergency kill switches

-- Drop existing table if exists
DROP TABLE IF EXISTS feature_flag_history CASCADE;
DROP TABLE IF EXISTS feature_flags CASCADE;

-- Feature Flags table
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Flag state
  enabled BOOLEAN NOT NULL DEFAULT false,

  -- Targeting
  target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'percentage', 'user_ids', 'user_roles', 'custom')),

  -- Rollout percentage (0-100)
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),

  -- Specific user targeting
  target_user_ids UUID[] DEFAULT '{}',
  target_user_roles TEXT[] DEFAULT '{}',

  -- Custom targeting rules (JSON)
  custom_rules JSONB DEFAULT '{}',

  -- Feature metadata
  category TEXT CHECK (category IN ('experimental', 'beta', 'stable', 'deprecated')),
  version TEXT,
  min_app_version TEXT,
  max_app_version TEXT,

  -- Platform targeting
  platforms TEXT[] DEFAULT '{ios,android,web}' CHECK (platforms <@ ARRAY['ios', 'android', 'web']),

  -- Scheduling
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,

  -- Additional metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  -- Audit fields
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  last_modified_by UUID REFERENCES auth.users(id),
  last_modified_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feature Flag History table (tracks all changes)
CREATE TABLE feature_flag_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE NOT NULL,
  flag_key TEXT NOT NULL,

  -- What changed
  action TEXT NOT NULL CHECK (action IN ('created', 'enabled', 'disabled', 'updated', 'deleted')),
  previous_state JSONB,
  new_state JSONB,
  changes JSONB,

  -- Who changed it
  changed_by UUID REFERENCES auth.users(id),
  changed_by_name TEXT,

  -- Notes
  reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX idx_feature_flags_category ON feature_flags(category);
CREATE INDEX idx_feature_flags_created_at ON feature_flags(created_at DESC);
CREATE INDEX idx_feature_flag_history_flag ON feature_flag_history(flag_id);
CREATE INDEX idx_feature_flag_history_created_at ON feature_flag_history(created_at DESC);

-- Function to check if flag is enabled for a specific user
CREATE OR REPLACE FUNCTION is_flag_enabled_for_user(
  p_flag_key TEXT,
  p_user_id UUID,
  p_user_role TEXT DEFAULT NULL,
  p_platform TEXT DEFAULT 'mobile'
)
RETURNS BOOLEAN AS $$
DECLARE
  flag_record RECORD;
  random_value INTEGER;
BEGIN
  -- Get the flag
  SELECT * INTO flag_record FROM feature_flags WHERE key = p_flag_key;

  -- Flag doesn't exist or is globally disabled
  IF NOT FOUND OR NOT flag_record.enabled THEN
    RETURN false;
  END IF;

  -- Check date range
  IF flag_record.start_date IS NOT NULL AND NOW() < flag_record.start_date THEN
    RETURN false;
  END IF;

  IF flag_record.end_date IS NOT NULL AND NOW() > flag_record.end_date THEN
    RETURN false;
  END IF;

  -- Check platform
  IF NOT (p_platform = ANY(flag_record.platforms)) THEN
    RETURN false;
  END IF;

  -- Check targeting
  CASE flag_record.target_type
    WHEN 'all' THEN
      RETURN true;

    WHEN 'percentage' THEN
      -- Use consistent hashing based on user_id to ensure same user gets same result
      random_value := (('x' || substr(md5(p_user_id::text || p_flag_key), 1, 8))::bit(32)::int % 100);
      RETURN random_value < flag_record.rollout_percentage;

    WHEN 'user_ids' THEN
      RETURN p_user_id = ANY(flag_record.target_user_ids);

    WHEN 'user_roles' THEN
      RETURN p_user_role = ANY(flag_record.target_user_roles);

    WHEN 'custom' THEN
      -- For custom rules, you'd implement more complex logic here
      -- For now, just return the global enabled state
      RETURN true;

    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to log flag changes
CREATE OR REPLACE FUNCTION log_flag_change()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  prev_state JSONB;
  new_state JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
    prev_state := NULL;
    new_state := row_to_json(NEW)::JSONB;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.enabled = false AND NEW.enabled = true THEN
      action_type := 'enabled';
    ELSIF OLD.enabled = true AND NEW.enabled = false THEN
      action_type := 'disabled';
    ELSE
      action_type := 'updated';
    END IF;
    prev_state := row_to_json(OLD)::JSONB;
    new_state := row_to_json(NEW)::JSONB;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'deleted';
    prev_state := row_to_json(OLD)::JSONB;
    new_state := NULL;
  END IF;

  INSERT INTO feature_flag_history (
    flag_id,
    flag_key,
    action,
    previous_state,
    new_state,
    changed_by,
    changed_by_name
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.key, OLD.key),
    action_type,
    prev_state,
    new_state,
    COALESCE(NEW.last_modified_by, OLD.last_modified_by),
    COALESCE(NEW.last_modified_by_name, OLD.last_modified_by_name)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to log all flag changes
CREATE TRIGGER log_feature_flag_changes
  AFTER INSERT OR UPDATE OR DELETE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION log_flag_change();

-- Updated at trigger
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_history ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read flags
CREATE POLICY "All users can read flags"
  ON feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- Admins can manage flags
CREATE POLICY "Admins can manage flags"
  ON feature_flags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- All authenticated users can read flag history
CREATE POLICY "All users can read flag history"
  ON feature_flag_history FOR SELECT
  TO authenticated
  USING (true);

-- Admins can manage flag history
CREATE POLICY "Admins can manage flag history"
  ON feature_flag_history FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Sample seed data (optional - comment out for production)
-- INSERT INTO feature_flags (key, name, description, enabled, target_type, category, platforms) VALUES
-- ('chat_feature', 'In-App Chat', 'Enable real-time chat between customers and providers', true, 'all', 'stable', '{ios,android}'),
-- ('new_payment_flow', 'New Payment Flow', 'Enable redesigned payment checkout experience', true, 'percentage', 'beta', '{ios,android}'),
-- ('dark_mode', 'Dark Mode', 'Enable dark mode theme', false, 'all', 'experimental', '{ios,android}'),
-- ('referral_program', 'Referral Program', 'Enable user referral rewards program', true, 'all', 'stable', '{ios,android}'),
-- ('advanced_search', 'Advanced Search', 'Enable advanced search filters', true, 'user_roles', 'stable', '{ios,android}');

-- UPDATE feature_flags SET rollout_percentage = 20 WHERE key = 'new_payment_flow';
-- UPDATE feature_flags SET target_user_roles = '{provider}' WHERE key = 'advanced_search';
