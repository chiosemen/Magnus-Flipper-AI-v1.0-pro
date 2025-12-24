-- Phase 13: Automated Shipping Label Engine + Fulfillment Workflow
-- Agent G: Shipping & Fulfillment Engine

-- =============================================================================
-- SHIPPING REQUESTS TABLE
-- Stores shipping label requests
-- =============================================================================
CREATE TABLE IF NOT EXISTS shipping_requests (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  sale_id TEXT NOT NULL REFERENCES sold_items(id) ON DELETE CASCADE,
  inventory_item_id TEXT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marketplace TEXT NOT NULL,

  -- Addresses
  from_address JSONB NOT NULL,
  to_address JSONB NOT NULL,

  -- Package details
  dimensions JSONB NOT NULL,

  -- Preferences
  service_level TEXT DEFAULT 'standard',
  carrier_preference TEXT DEFAULT 'auto',

  -- Options
  insurance_value NUMERIC(10, 2),
  require_signature BOOLEAN DEFAULT FALSE,
  saturday_delivery BOOLEAN DEFAULT FALSE,

  -- Item details
  item_description TEXT NOT NULL,
  item_value NUMERIC(10, 2) NOT NULL,
  hs_code TEXT,

  -- Marketplace constraints
  marketplace_requirements JSONB,

  -- Status
  status TEXT DEFAULT 'pending',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  requested_by TEXT DEFAULT 'auto'
);

CREATE INDEX IF NOT EXISTS idx_shipping_requests_order ON shipping_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_requests_user ON shipping_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_requests_status ON shipping_requests(status);

-- =============================================================================
-- SHIPPING LABELS TABLE
-- Generated shipping labels with tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS shipping_labels (
  id TEXT PRIMARY KEY,
  shipping_request_id TEXT NOT NULL REFERENCES shipping_requests(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  carrier TEXT NOT NULL,
  service TEXT NOT NULL,
  tracking_number TEXT NOT NULL UNIQUE,
  tracking_url TEXT,

  -- Label files
  label_url TEXT NOT NULL,
  label_format TEXT DEFAULT 'pdf',

  -- Costs
  shipping_cost NUMERIC(10, 2) NOT NULL,
  insurance_cost NUMERIC(10, 2) DEFAULT 0,
  total_cost NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Delivery
  estimated_delivery_date TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'created',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  purchased_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,

  -- Raw response
  raw_response JSONB
);

CREATE INDEX IF NOT EXISTS idx_shipping_labels_request ON shipping_labels(shipping_request_id);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_order ON shipping_labels(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_tracking ON shipping_labels(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_status ON shipping_labels(status);

-- =============================================================================
-- TRACKING EVENTS TABLE
-- Shipment tracking updates
-- =============================================================================
CREATE TABLE IF NOT EXISTS tracking_events (
  id TEXT PRIMARY KEY,
  tracking_number TEXT NOT NULL,
  carrier TEXT NOT NULL,
  status TEXT NOT NULL,
  status_detail TEXT,
  location TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  estimated_delivery TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_tracking ON tracking_events(tracking_number);
CREATE INDEX IF NOT EXISTS idx_tracking_events_status ON tracking_events(status);
CREATE INDEX IF NOT EXISTS idx_tracking_events_timestamp ON tracking_events(timestamp);

-- =============================================================================
-- CARRIER CONFIGURATIONS TABLE
-- Carrier API settings per user
-- =============================================================================
CREATE TABLE IF NOT EXISTS carrier_configs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  api_key TEXT,
  account_number TEXT,
  test_mode BOOLEAN DEFAULT TRUE,
  supported_services TEXT[],
  max_weight INTEGER,
  max_dimensions JSONB,
  international_support BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, carrier)
);

CREATE INDEX IF NOT EXISTS idx_carrier_configs_user ON carrier_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_carrier_configs_carrier ON carrier_configs(carrier);

-- =============================================================================
-- PACKAGING RECOMMENDATIONS TABLE
-- Saved packaging advice
-- =============================================================================
CREATE TABLE IF NOT EXISTS packaging_recommendations (
  id SERIAL PRIMARY KEY,
  inventory_item_id TEXT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  package_type TEXT NOT NULL,
  dimensions JSONB NOT NULL,
  materials TEXT[],
  instructions TEXT[],
  fragile BOOLEAN DEFAULT FALSE,
  estimated_cost NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packaging_inventory ON packaging_recommendations(inventory_item_id);

-- =============================================================================
-- FULFILLMENT WORKFLOWS TABLE
-- Complete fulfillment process tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS fulfillment_workflows (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sold_items(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  current_step TEXT,
  steps JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fulfillment_workflows_sale ON fulfillment_workflows(sale_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_workflows_order ON fulfillment_workflows(order_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_workflows_user ON fulfillment_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_workflows_status ON fulfillment_workflows(status);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE shipping_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_workflows ENABLE ROW LEVEL SECURITY;

-- Shipping Requests Policies
DROP POLICY IF EXISTS "Users can view their own shipping requests" ON shipping_requests;
CREATE POLICY "Users can view their own shipping requests"
  ON shipping_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage shipping requests" ON shipping_requests;
CREATE POLICY "Service role can manage shipping requests"
  ON shipping_requests FOR ALL
  USING (true);

-- Shipping Labels Policies
DROP POLICY IF EXISTS "Service role can manage shipping labels" ON shipping_labels;
CREATE POLICY "Service role can manage shipping labels"
  ON shipping_labels FOR ALL
  USING (true);

-- Tracking Events Policies (public read for tracking pages)
DROP POLICY IF EXISTS "Anyone can view tracking events" ON tracking_events;
CREATE POLICY "Anyone can view tracking events"
  ON tracking_events FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can insert tracking events" ON tracking_events;
CREATE POLICY "Service role can insert tracking events"
  ON tracking_events FOR INSERT
  WITH CHECK (true);

-- Carrier Configs Policies
DROP POLICY IF EXISTS "Users can view their own carrier configs" ON carrier_configs;
CREATE POLICY "Users can view their own carrier configs"
  ON carrier_configs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own carrier configs" ON carrier_configs;
CREATE POLICY "Users can manage their own carrier configs"
  ON carrier_configs FOR ALL
  USING (auth.uid() = user_id);

-- Packaging Recommendations Policies
DROP POLICY IF EXISTS "Service role can manage packaging recommendations" ON packaging_recommendations;
CREATE POLICY "Service role can manage packaging recommendations"
  ON packaging_recommendations FOR ALL
  USING (true);

-- Fulfillment Workflows Policies
DROP POLICY IF EXISTS "Users can view their own workflows" ON fulfillment_workflows;
CREATE POLICY "Users can view their own workflows"
  ON fulfillment_workflows FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage workflows" ON fulfillment_workflows;
CREATE POLICY "Service role can manage workflows"
  ON fulfillment_workflows FOR ALL
  USING (true);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Update timestamp trigger
DROP TRIGGER IF EXISTS carrier_configs_updated_at ON carrier_configs;
CREATE TRIGGER carrier_configs_updated_at
  BEFORE UPDATE ON carrier_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Active shipments view
CREATE OR REPLACE VIEW active_shipments AS
SELECT
  sl.id as label_id,
  sl.tracking_number,
  sl.carrier,
  sl.service,
  sl.order_id,
  sl.status as label_status,
  sl.estimated_delivery_date,
  sl.created_at,
  te.status as current_tracking_status,
  te.location as current_location,
  te.timestamp as last_update
FROM shipping_labels sl
LEFT JOIN LATERAL (
  SELECT status, location, timestamp
  FROM tracking_events
  WHERE tracking_number = sl.tracking_number
  ORDER BY timestamp DESC
  LIMIT 1
) te ON true
WHERE sl.status IN ('purchased', 'shipped')
ORDER BY sl.created_at DESC;

GRANT SELECT ON active_shipments TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE shipping_requests IS 'Shipping label requests (Agent G)';
COMMENT ON TABLE shipping_labels IS 'Generated shipping labels with tracking numbers (Agent G)';
COMMENT ON TABLE tracking_events IS 'Shipment tracking updates from carriers (Agent G)';
COMMENT ON TABLE carrier_configs IS 'Carrier API configurations per user';
COMMENT ON TABLE packaging_recommendations IS 'AI-generated packaging recommendations';
COMMENT ON TABLE fulfillment_workflows IS 'End-to-end fulfillment process tracking';
