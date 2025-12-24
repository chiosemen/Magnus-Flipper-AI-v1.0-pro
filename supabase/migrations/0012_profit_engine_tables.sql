

-- =============================================================================
-- INVENTORY TABLE (dependency for profit engine)
-- =============================================================================
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  category TEXT,
  acquisition_price NUMERIC(10,2),
  acquired_at TIMESTAMPTZ,
  marketplace TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 12: Auto-Sell & Profit Ledger Engine Database Schema
-- Agent E: Auto-Sell Engine
-- Agent F: Profit Ledger Engine

-- =============================================================================
-- SALE EVENTS TABLE
-- Stores raw sale events from marketplace polling
-- =============================================================================
CREATE TABLE IF NOT EXISTS sale_events (
  sale_event_id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  inventory_item_id TEXT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marketplace TEXT NOT NULL,
  sale_price NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  buyer_id TEXT NOT NULL,
  buyer_name TEXT,
  buyer_location TEXT,
  sold_at TIMESTAMPTZ NOT NULL,
  shipping_required BOOLEAN DEFAULT TRUE,
  shipping_address JSONB,
  raw_event JSONB,
  status TEXT DEFAULT 'pending_finalization',
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_events_inventory ON sale_events(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_sale_events_user ON sale_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sale_events_marketplace ON sale_events(marketplace);
CREATE INDEX IF NOT EXISTS idx_sale_events_status ON sale_events(status);
CREATE INDEX IF NOT EXISTS idx_sale_events_sold_at ON sale_events(sold_at);

-- =============================================================================
-- SOLD ITEMS TABLE
-- Finalized sales with complete P&L calculations
-- =============================================================================
CREATE TABLE IF NOT EXISTS sold_items (
  id TEXT PRIMARY KEY,
  sale_event_id TEXT NOT NULL REFERENCES sale_events(sale_event_id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL,
  inventory_item_id TEXT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marketplace TEXT NOT NULL,
  sale_price NUMERIC(10, 2) NOT NULL,
  acquired_price NUMERIC(10, 2) NOT NULL,
  marketplace_fees NUMERIC(10, 2) DEFAULT 0,
  shipping_cost NUMERIC(10, 2) DEFAULT 0,
  other_costs NUMERIC(10, 2) DEFAULT 0,
  gross_profit NUMERIC(10, 2) NOT NULL,
  net_profit NUMERIC(10, 2) NOT NULL,
  roi NUMERIC(10, 2) NOT NULL,
  holding_time INTEGER NOT NULL, -- days
  sold_at TIMESTAMPTZ NOT NULL,
  finalized_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending_shipment',
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  refund_amount NUMERIC(10, 2),
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sold_items_inventory ON sold_items(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_sold_items_user ON sold_items(user_id);
CREATE INDEX IF NOT EXISTS idx_sold_items_marketplace ON sold_items(marketplace);
CREATE INDEX IF NOT EXISTS idx_sold_items_sold_at ON sold_items(sold_at);
CREATE INDEX IF NOT EXISTS idx_sold_items_status ON sold_items(status);
CREATE INDEX IF NOT EXISTS idx_sold_items_roi ON sold_items(roi);
CREATE INDEX IF NOT EXISTS idx_sold_items_net_profit ON sold_items(net_profit);

-- =============================================================================
-- LEDGER ENTRIES TABLE
-- Double-entry accounting ledger for all transactions
-- =============================================================================
CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inventory_item_id TEXT REFERENCES inventory(id) ON DELETE SET NULL,
  sale_id TEXT REFERENCES sold_items(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- acquisition, sale, fee, shipping, refund, adjustment, tax
  amount NUMERIC(10, 2) NOT NULL, -- positive for revenue, negative for costs
  currency TEXT DEFAULT 'USD',
  description TEXT NOT NULL,
  transaction_date TIMESTAMPTZ NOT NULL,
  marketplace TEXT,
  category TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_user ON ledger_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_type ON ledger_entries(type);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_date ON ledger_entries(transaction_date);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_sale ON ledger_entries(sale_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_marketplace ON ledger_entries(marketplace);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_category ON ledger_entries(category);

-- =============================================================================
-- EV CORRECTIONS TABLE
-- Learning loop for improving resale predictions
-- =============================================================================
CREATE TABLE IF NOT EXISTS ev_corrections (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sold_items(id) ON DELETE CASCADE,
  inventory_item_id TEXT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  marketplace TEXT NOT NULL,
  expected_value NUMERIC(10, 2) NOT NULL,
  actual_value NUMERIC(10, 2) NOT NULL,
  variance NUMERIC(10, 2) NOT NULL,
  variance_percent NUMERIC(10, 2) NOT NULL,
  original_confidence INTEGER NOT NULL,
  correction_factor NUMERIC(10, 4) NOT NULL,
  learning_weight INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ev_corrections_category ON ev_corrections(category);
CREATE INDEX IF NOT EXISTS idx_ev_corrections_marketplace ON ev_corrections(marketplace);
CREATE INDEX IF NOT EXISTS idx_ev_corrections_created ON ev_corrections(created_at);

-- =============================================================================
-- HISTORICAL STATS TABLE
-- Bayesian priors for EV correction
-- =============================================================================
CREATE TABLE IF NOT EXISTS historical_stats (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  marketplace TEXT NOT NULL,
  avg_expected_value NUMERIC(10, 2) NOT NULL,
  avg_actual_value NUMERIC(10, 2) NOT NULL,
  avg_variance NUMERIC(10, 2) NOT NULL,
  std_deviation NUMERIC(10, 2) NOT NULL,
  sample_size INTEGER NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, marketplace)
);

CREATE INDEX IF NOT EXISTS idx_historical_stats_category ON historical_stats(category);
CREATE INDEX IF NOT EXISTS idx_historical_stats_marketplace ON historical_stats(marketplace);

-- =============================================================================
-- PORTFOLIO SNAPSHOTS TABLE
-- Daily/periodic portfolio state captures
-- =============================================================================
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date TIMESTAMPTZ NOT NULL,
  total_inventory_value NUMERIC(10, 2) NOT NULL,
  total_invested_capital NUMERIC(10, 2) NOT NULL,
  total_realized_profit NUMERIC(10, 2) NOT NULL,
  total_unrealized_profit NUMERIC(10, 2) NOT NULL,
  active_listings INTEGER NOT NULL,
  sold_items INTEGER NOT NULL,
  avg_holding_time NUMERIC(10, 2) NOT NULL,
  portfolio_roi NUMERIC(10, 2) NOT NULL,
  win_rate NUMERIC(10, 2) NOT NULL,
  best_performing_category TEXT,
  worst_performing_category TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user ON portfolio_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_date ON portfolio_snapshots(snapshot_date);

-- =============================================================================
-- PLATFORM LOCK EVENTS TABLE
-- Audit trail for cross-platform listing locks
-- =============================================================================
CREATE TABLE IF NOT EXISTS platform_lock_events (
  id SERIAL PRIMARY KEY,
  inventory_item_id TEXT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  sale_event_id TEXT NOT NULL REFERENCES sale_events(sale_event_id) ON DELETE CASCADE,
  sold_marketplace TEXT NOT NULL,
  locked_listings TEXT[] NOT NULL,
  failed_listings JSONB,
  total_locked INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_lock_events_inventory ON platform_lock_events(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_platform_lock_events_sale ON platform_lock_events(sale_event_id);

-- =============================================================================
-- MARKETPLACE CREDENTIALS TABLE
-- Secure storage for marketplace API keys and tokens
-- =============================================================================
CREATE TABLE IF NOT EXISTS marketplace_credentials (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marketplace TEXT NOT NULL,
  api_key TEXT,
  access_token TEXT,
  refresh_token TEXT,
  session_cookie TEXT,
  session_cookies TEXT,
  auth_token TEXT,
  expires_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, marketplace)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_credentials_user ON marketplace_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_credentials_marketplace ON marketplace_credentials(marketplace);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE sale_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sold_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ev_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_lock_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_credentials ENABLE ROW LEVEL SECURITY;

-- Sale Events Policies
DROP POLICY IF EXISTS "Users can view their own sale events" ON sale_events;
CREATE POLICY "Users can view their own sale events"
  ON sale_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert sale events" ON sale_events;
CREATE POLICY "Service role can insert sale events"
  ON sale_events FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update sale events" ON sale_events;
CREATE POLICY "Service role can update sale events"
  ON sale_events FOR UPDATE
  USING (true);

-- Sold Items Policies
DROP POLICY IF EXISTS "Users can view their own sold items" ON sold_items;
CREATE POLICY "Users can view their own sold items"
  ON sold_items FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert sold items" ON sold_items;
CREATE POLICY "Service role can insert sold items"
  ON sold_items FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update sold items" ON sold_items;
CREATE POLICY "Service role can update sold items"
  ON sold_items FOR UPDATE
  USING (true);

-- Ledger Entries Policies
DROP POLICY IF EXISTS "Users can view their own ledger entries" ON ledger_entries;
CREATE POLICY "Users can view their own ledger entries"
  ON ledger_entries FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own ledger entries" ON ledger_entries;
CREATE POLICY "Users can insert their own ledger entries"
  ON ledger_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all ledger entries" ON ledger_entries;
CREATE POLICY "Service role can manage all ledger entries"
  ON ledger_entries FOR ALL
  USING (true);

-- EV Corrections Policies (read-only for users, admin access for analysis)
DROP POLICY IF EXISTS "Service role can manage EV corrections" ON ev_corrections;
CREATE POLICY "Service role can manage EV corrections"
  ON ev_corrections FOR ALL
  USING (true);

-- Portfolio Snapshots Policies
DROP POLICY IF EXISTS "Users can view their own portfolio snapshots" ON portfolio_snapshots;
CREATE POLICY "Users can view their own portfolio snapshots"
  ON portfolio_snapshots FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage portfolio snapshots" ON portfolio_snapshots;
CREATE POLICY "Service role can manage portfolio snapshots"
  ON portfolio_snapshots FOR ALL
  USING (true);

-- Platform Lock Events Policies (audit only, service role access)
DROP POLICY IF EXISTS "Service role can manage platform lock events" ON platform_lock_events;
CREATE POLICY "Service role can manage platform lock events"
  ON platform_lock_events FOR ALL
  USING (true);

-- Marketplace Credentials Policies (highly sensitive)
DROP POLICY IF EXISTS "Users can view their own credentials" ON marketplace_credentials;
CREATE POLICY "Users can view their own credentials"
  ON marketplace_credentials FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own credentials" ON marketplace_credentials;
CREATE POLICY "Users can insert their own credentials"
  ON marketplace_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own credentials" ON marketplace_credentials;
CREATE POLICY "Users can update their own credentials"
  ON marketplace_credentials FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own credentials" ON marketplace_credentials;
CREATE POLICY "Users can delete their own credentials"
  ON marketplace_credentials FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
DROP TRIGGER IF EXISTS sale_events_updated_at ON sale_events;
CREATE TRIGGER sale_events_updated_at
  BEFORE UPDATE ON sale_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS sold_items_updated_at ON sold_items;
CREATE TRIGGER sold_items_updated_at
  BEFORE UPDATE ON sold_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS marketplace_credentials_updated_at ON marketplace_credentials;
CREATE TRIGGER marketplace_credentials_updated_at
  BEFORE UPDATE ON marketplace_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- User P&L Summary View
CREATE OR REPLACE VIEW user_pnl_summary AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE type = 'sale') AS total_sales,
  SUM(amount) FILTER (WHERE type = 'sale') AS total_revenue,
  SUM(amount) FILTER (WHERE type = 'acquisition') AS total_costs,
  SUM(amount) FILTER (WHERE type = 'fee') AS total_fees,
  SUM(amount) FILTER (WHERE type = 'shipping') AS total_shipping,
  SUM(amount) AS net_profit
FROM ledger_entries
GROUP BY user_id;

-- Marketplace Performance View
CREATE OR REPLACE VIEW marketplace_performance AS
SELECT
  marketplace,
  COUNT(*) AS sales_count,
  SUM(sale_price) AS total_revenue,
  SUM(net_profit) AS total_profit,
  AVG(roi) AS avg_roi,
  AVG(holding_time) AS avg_holding_time,
  COUNT(*) FILTER (WHERE net_profit > 0)::NUMERIC / COUNT(*) * 100 AS win_rate
FROM sold_items
GROUP BY marketplace;

-- Category Performance View
CREATE OR REPLACE VIEW category_performance AS
SELECT
  i.category,
  COUNT(*) AS sales_count,
  SUM(s.sale_price) AS total_revenue,
  SUM(s.net_profit) AS total_profit,
  AVG(s.roi) AS avg_roi,
  AVG(s.holding_time) AS avg_holding_time
FROM sold_items s
JOIN inventory i ON s.inventory_item_id = i.id
GROUP BY i.category;

-- Grant access to views
GRANT SELECT ON user_pnl_summary TO authenticated;
GRANT SELECT ON marketplace_performance TO authenticated;
GRANT SELECT ON category_performance TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE sale_events IS 'Raw sale events from marketplace polling (Agent E)';
COMMENT ON TABLE sold_items IS 'Finalized sales with P&L calculations (Agent E)';
COMMENT ON TABLE ledger_entries IS 'Double-entry accounting ledger (Agent F)';
COMMENT ON TABLE ev_corrections IS 'EV learning loop for prediction improvement (Agent F)';
COMMENT ON TABLE historical_stats IS 'Bayesian priors for category/marketplace accuracy (Agent F)';
COMMENT ON TABLE portfolio_snapshots IS 'Portfolio state snapshots for trend analysis (Agent F)';
COMMENT ON TABLE platform_lock_events IS 'Audit trail for cross-platform locks (Agent E)';
COMMENT ON TABLE marketplace_credentials IS 'Encrypted marketplace API credentials';
