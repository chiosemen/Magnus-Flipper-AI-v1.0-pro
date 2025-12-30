-- Market Agent Usage Metering Tables
-- Minimal viable schema for production

-- Usage events (append-only log)
CREATE TABLE IF NOT EXISTS market_agent_usage_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL CHECK (event_type IN ('run', 'refresh_tick', 'seed_ingest')),
  marketplace TEXT NOT NULL,
  query_norm TEXT NOT NULL,
  items_returned INTEGER NOT NULL DEFAULT 0,
  cache_status TEXT,
  strategy TEXT,
  latency_ms INTEGER,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_usage_events_user_timestamp ON market_agent_usage_events(user_id, timestamp DESC);
CREATE INDEX idx_usage_events_user_date ON market_agent_usage_events(user_id, DATE(timestamp));

-- Entitlement overrides (admin comps / kill switches)
CREATE TABLE IF NOT EXISTS entitlement_overrides (
  id BIGSERIAL PRIMARY KEY,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('user', 'workspace')),
  subject_id TEXT NOT NULL,
  feature TEXT NOT NULL DEFAULT 'market_agent',
  mode TEXT NOT NULL CHECK (mode IN ('force_on', 'force_off')),
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_by_admin_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_override UNIQUE (subject_type, subject_id, feature)
);

CREATE INDEX idx_overrides_subject ON entitlement_overrides(subject_type, subject_id, feature);

-- Daily rollups (optional, for performance)
CREATE TABLE IF NOT EXISTS market_agent_usage_rollups_daily (
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  runs INTEGER NOT NULL DEFAULT 0,
  refresh_ticks INTEGER NOT NULL DEFAULT 0,
  items_returned INTEGER NOT NULL DEFAULT 0,
  unique_queries INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date),
  CONSTRAINT fk_user_rollup FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_rollups_user_date ON market_agent_usage_rollups_daily(user_id, date DESC);

-- Add market_agent fields to existing users or profiles table
-- NOTE: Adjust table name if different in your schema
DO $$ 
BEGIN
  -- Check if columns exist before adding
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'market_agent_enabled') THEN
    ALTER TABLE profiles ADD COLUMN market_agent_enabled BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'market_agent_status') THEN
    ALTER TABLE profiles ADD COLUMN market_agent_status TEXT DEFAULT 'canceled';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'grace_until') THEN
    ALTER TABLE profiles ADD COLUMN grace_until TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'stripe_subscription_id') THEN
    ALTER TABLE profiles ADD COLUMN stripe_subscription_id TEXT;
  END IF;
END $$;

COMMENT ON TABLE market_agent_usage_events IS 'Append-only log of Market Agent activity for metering and limits';
COMMENT ON TABLE entitlement_overrides IS 'Admin overrides for comped accounts or kill switches';
COMMENT ON TABLE market_agent_usage_rollups_daily IS 'Daily usage rollups for fast limit checks';

