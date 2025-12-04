-- Marketplace settings table
CREATE TABLE IF NOT EXISTS marketplace_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  last_sync TIMESTAMP WITH TIME ZONE,
  api_health TEXT CHECK (api_health IN ('healthy', 'degraded', 'down')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Scanner telemetry table
CREATE TABLE IF NOT EXISTS scanner_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace TEXT NOT NULL,
  event TEXT NOT NULL,
  payload JSONB,
  latency_ms INTEGER,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Job queue table
CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'failed')),
  marketplace TEXT,
  payload JSONB,
  worker_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Worker heartbeat table
CREATE TABLE IF NOT EXISTS worker_heartbeat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline')),
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scanner_telemetry_marketplace ON scanner_telemetry(marketplace);
CREATE INDEX IF NOT EXISTS idx_scanner_telemetry_created_at ON scanner_telemetry(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_created_at ON job_queue(created_at DESC);

-- Insert default marketplace settings
INSERT INTO marketplace_settings (marketplace, enabled, api_health) VALUES
  ('craigslist', true, 'healthy'),
  ('gumtree', true, 'healthy'),
  ('facebook', true, 'healthy'),
  ('offerup', false, 'degraded'),
  ('vinted', true, 'healthy'),
  ('ebay', true, 'healthy')
ON CONFLICT (marketplace) DO NOTHING;
