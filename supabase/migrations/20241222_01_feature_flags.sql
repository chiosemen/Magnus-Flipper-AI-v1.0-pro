-- Feature Flags Table
-- Enables runtime feature control without code changes

CREATE TABLE IF NOT EXISTS feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  rollout INTEGER CHECK (rollout >= 0 AND rollout <= 100), -- Percentage rollout (0-100)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled) WHERE enabled = true;

-- RLS Policies
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Service role can read/write (for workers and API)
CREATE POLICY "service_role_all" ON feature_flags
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anon can read (for web app)
CREATE POLICY "anon_read" ON feature_flags
  FOR SELECT
  TO anon
  USING (true);

-- Authenticated users cannot modify (admin-only via service role)
CREATE POLICY "authenticated_read_only" ON feature_flags
  FOR SELECT
  TO authenticated
  USING (true);

-- Initial flags
INSERT INTO feature_flags (key, enabled, description, rollout) VALUES
  ('FEATURE_ELITE_POOL_DISPATCH', false, 'Enable Elite pool scraping dispatch', 100),
  ('FEATURE_SCRAPE_DISPATCH', true, 'Enable general scraping dispatch', 100),
  ('FEATURE_ECONOMICS_PIPELINE', true, 'Enable economics computation pipeline', 100),
  ('FEATURE_UI_CAR_FLIPPER', true, 'Show Car Flipper UI section', 100),
  ('FEATURE_UI_MARKETPLACE_MONITOR_STYLE', true, 'Show Marketplace Monitor style UI', 100),
  ('FEATURE_DEV_PLACEHOLDERS_ALWAYS_ON', true, 'Always show placeholders in dev mode', 100)
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE feature_flags IS 'Runtime feature flags for controlling system behavior without code changes';
COMMENT ON COLUMN feature_flags.rollout IS 'Percentage rollout (0-100). NULL means use enabled flag only.';

