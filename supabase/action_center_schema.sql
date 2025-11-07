-- Action Center Tables
-- This schema supports the unified action queue system for admin tasks

-- Drop existing tables if they exist
DROP TABLE IF EXISTS action_notes CASCADE;
DROP TABLE IF EXISTS action_items CASCADE;

-- Action Items table
CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue TEXT NOT NULL CHECK (queue IN ('kyc', 'bookings', 'refunds_disputes', 'payouts', 'webhooks', 'content_flags')),
  ref_type TEXT NOT NULL CHECK (ref_type IN ('provider', 'customer', 'booking', 'payout', 'webhook', 'review')),
  ref_id TEXT NOT NULL,
  title TEXT NOT NULL,
  who_name TEXT,
  who_phone TEXT,
  reason_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'snoozed', 'resolved')),
  sla_at TIMESTAMPTZ,
  severity TEXT NOT NULL CHECK (severity IN ('red', 'amber', 'green')),
  amount_at_risk INTEGER, -- in cents
  assignee_id UUID REFERENCES auth.users(id),
  assignee_name TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Action Notes table
CREATE TABLE action_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_item_id UUID NOT NULL REFERENCES action_items(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_action_items_queue ON action_items(queue);
CREATE INDEX idx_action_items_status ON action_items(status);
CREATE INDEX idx_action_items_assignee ON action_items(assignee_id);
CREATE INDEX idx_action_items_sla ON action_items(sla_at);
CREATE INDEX idx_action_items_created ON action_items(created_at DESC);
CREATE INDEX idx_action_notes_item ON action_notes(action_item_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_notes ENABLE ROW LEVEL SECURITY;

-- Admin users can see all action items
CREATE POLICY "Admins can view all action items"
  ON action_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin users can insert action items
CREATE POLICY "Admins can insert action items"
  ON action_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin users can update action items
CREATE POLICY "Admins can update action items"
  ON action_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin users can see all notes
CREATE POLICY "Admins can view all notes"
  ON action_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin users can insert notes
CREATE POLICY "Admins can insert notes"
  ON action_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to compute severity based on SLA
CREATE OR REPLACE FUNCTION compute_severity(sla_at TIMESTAMPTZ)
RETURNS TEXT AS $$
BEGIN
  IF sla_at IS NULL THEN
    RETURN 'green';
  END IF;

  IF sla_at < NOW() THEN
    RETURN 'red'; -- overdue
  ELSIF sla_at < NOW() + INTERVAL '2 hours' THEN
    RETURN 'red'; -- less than 2 hours
  ELSIF sla_at < NOW() + INTERVAL '24 hours' THEN
    RETURN 'amber'; -- less than 24 hours
  ELSE
    RETURN 'green'; -- more than 24 hours
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-update severity when SLA changes
CREATE OR REPLACE FUNCTION update_severity_on_sla_change()
RETURNS TRIGGER AS $$
BEGIN
  NEW.severity = compute_severity(NEW.sla_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_severity_trigger
  BEFORE INSERT OR UPDATE OF sla_at ON action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_severity_on_sla_change();

-- Sample seed data (optional - comment out for production)
-- INSERT INTO action_items (queue, ref_type, ref_id, title, who_name, who_phone, reason_code, severity, sla_at, amount_at_risk) VALUES
-- ('kyc', 'provider', 'PRV-1234', 'Provider KYC verification required', 'Jean Dupont', '+237671234567', 'ID_MISMATCH', 'red', NOW() + INTERVAL '1 hour', NULL),
-- ('bookings', 'booking', 'BK-2025-001', 'Provider needs to confirm booking', 'Alice Mbah', '+237670444444', 'PENDING_CONFIRM', 'red', NOW() + INTERVAL '3 hours', 1500000),
-- ('refunds_disputes', 'booking', 'BK-2025-100', 'Customer requesting full refund', 'Grace Ongola', '+237622222222', 'REFUND_REQUESTED', 'amber', NOW() + INTERVAL '6 hours', 5000000),
-- ('payouts', 'payout', 'PO-2025-001', 'Payout failed - bank details invalid', 'Lionel Onana', '+237677777777', 'BANK_DETAILS_INVALID', 'amber', NOW() + INTERVAL '8 hours', 15000000);
