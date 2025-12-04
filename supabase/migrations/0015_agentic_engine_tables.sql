-- =====================================================
-- AGENTIC ENGINE TABLES
-- Auto-Buyer + Auto-Lister Database Schema
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- =====================================================
-- BUY OPPORTUNITIES
-- =====================================================

CREATE TABLE IF NOT EXISTS buy_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id TEXT NOT NULL, -- Reference to scraped_listings
  marketplace TEXT NOT NULL CHECK (marketplace IN ('ebay', 'facebook', 'craigslist', 'vinted', 'depop', 'gumtree', 'offerup')),
  link TEXT NOT NULL,

  -- Listing details
  title TEXT NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  estimated_resale_price DECIMAL(10, 2) NOT NULL,
  estimated_roi DECIMAL(5, 2) NOT NULL,
  estimated_profit DECIMAL(10, 2) GENERATED ALWAYS AS (estimated_resale_price - current_price) STORED,

  -- Risk assessment
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Seller info
  seller_name TEXT,
  seller_rating DECIMAL(3, 2),
  seller_reviews_count INTEGER,

  -- Evaluation metadata
  ai_reasoning JSONB, -- DeepSeek R1 reasoning
  ai_provider TEXT DEFAULT 'deepseek',
  evaluation_duration_ms INTEGER,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'purchased', 'rejected', 'expired', 'failed')),
  status_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Indexes
  CONSTRAINT buy_opportunities_listing_marketplace_unique UNIQUE (listing_id, marketplace)
);

-- Indexes for buy_opportunities
CREATE INDEX idx_buy_opportunities_user ON buy_opportunities(user_id);
CREATE INDEX idx_buy_opportunities_status ON buy_opportunities(status) WHERE status IN ('pending', 'queued');
CREATE INDEX idx_buy_opportunities_roi ON buy_opportunities(estimated_roi DESC);
CREATE INDEX idx_buy_opportunities_created ON buy_opportunities(created_at DESC);
CREATE INDEX idx_buy_opportunities_marketplace ON buy_opportunities(marketplace);
CREATE INDEX idx_buy_opportunities_risk ON buy_opportunities(risk_score);
CREATE INDEX idx_buy_opportunities_confidence ON buy_opportunities(confidence_score DESC);

-- =====================================================
-- BUY EXECUTIONS (Purchase Attempts)
-- =====================================================

CREATE TABLE IF NOT EXISTS buy_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES buy_opportunities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Execution details
  marketplace TEXT NOT NULL,
  execution_type TEXT NOT NULL CHECK (execution_type IN ('automated', 'manual_approved')),

  -- Purchase details
  purchase_price DECIMAL(10, 2),
  purchase_currency TEXT DEFAULT 'USD',
  transaction_id TEXT,
  payment_method TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'processing', 'completed', 'failed', 'refunded')),
  error_message TEXT,

  -- Browser automation metadata
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  execution_duration_ms INTEGER,
  screenshots JSONB, -- Array of screenshot URLs

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT buy_executions_opportunity_unique UNIQUE (opportunity_id)
);

-- Indexes for buy_executions
CREATE INDEX idx_buy_executions_user ON buy_executions(user_id);
CREATE INDEX idx_buy_executions_opportunity ON buy_executions(opportunity_id);
CREATE INDEX idx_buy_executions_status ON buy_executions(status);
CREATE INDEX idx_buy_executions_created ON buy_executions(created_at DESC);
CREATE INDEX idx_buy_executions_marketplace ON buy_executions(marketplace);

-- =====================================================
-- LISTING DRAFTS (Auto-Generated Listings)
-- =====================================================

CREATE TABLE IF NOT EXISTS listing_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  inventory_item_id TEXT, -- Reference to purchased item
  buy_execution_id UUID REFERENCES buy_executions(id) ON DELETE SET NULL,

  -- Target marketplace
  target_marketplace TEXT NOT NULL CHECK (target_marketplace IN ('ebay', 'facebook', 'poshmark', 'mercari', 'depop', 'vinted', 'grailed')),

  -- Listing content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Listing details
  category TEXT,
  condition TEXT,
  brand TEXT,
  size TEXT,
  color TEXT,
  tags TEXT[], -- Array of tags

  -- Media
  images TEXT[], -- Array of image URLs
  primary_image_url TEXT,

  -- Shipping
  shipping_method TEXT,
  shipping_cost DECIMAL(10, 2),
  handling_days INTEGER,
  ships_from TEXT, -- Location/ZIP

  -- AI generation metadata
  ai_provider TEXT DEFAULT 'deepseek',
  ai_confidence DECIMAL(3, 2),
  generation_duration_ms INTEGER,
  seo_score INTEGER CHECK (seo_score >= 0 AND seo_score <= 100),

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'listed', 'rejected', 'failed')),
  review_notes TEXT,

  -- Marketplace-specific data
  marketplace_metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  listed_at TIMESTAMPTZ
);

-- Indexes for listing_drafts
CREATE INDEX idx_listing_drafts_user ON listing_drafts(user_id);
CREATE INDEX idx_listing_drafts_status ON listing_drafts(status) WHERE status IN ('draft', 'approved');
CREATE INDEX idx_listing_drafts_marketplace ON listing_drafts(target_marketplace);
CREATE INDEX idx_listing_drafts_created ON listing_drafts(created_at DESC);
CREATE INDEX idx_listing_drafts_buy_execution ON listing_drafts(buy_execution_id);
CREATE INDEX idx_listing_drafts_inventory ON listing_drafts(inventory_item_id);

-- =====================================================
-- LISTING EXECUTIONS (Actual Listing Attempts)
-- =====================================================

CREATE TABLE IF NOT EXISTS listing_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draft_id UUID REFERENCES listing_drafts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Execution details
  marketplace TEXT NOT NULL,
  execution_type TEXT NOT NULL CHECK (execution_type IN ('automated', 'manual')),

  -- Marketplace response
  marketplace_listing_id TEXT, -- External ID from marketplace
  listing_url TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'processing', 'completed', 'failed', 'delisted')),
  error_message TEXT,

  -- Browser automation metadata
  session_id TEXT,
  execution_duration_ms INTEGER,
  screenshots JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  delisted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT listing_executions_draft_unique UNIQUE (draft_id)
);

-- Indexes for listing_executions
CREATE INDEX idx_listing_executions_user ON listing_executions(user_id);
CREATE INDEX idx_listing_executions_draft ON listing_executions(draft_id);
CREATE INDEX idx_listing_executions_status ON listing_executions(status);
CREATE INDEX idx_listing_executions_created ON listing_executions(created_at DESC);
CREATE INDEX idx_listing_executions_marketplace ON listing_executions(marketplace);
CREATE INDEX idx_listing_executions_marketplace_id ON listing_executions(marketplace_listing_id);

-- =====================================================
-- MARKETPLACE ACCOUNTS
-- =====================================================

CREATE TABLE IF NOT EXISTS marketplace_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Account details
  marketplace TEXT NOT NULL CHECK (marketplace IN ('ebay', 'facebook', 'poshmark', 'mercari', 'depop', 'vinted', 'grailed', 'craigslist', 'offerup', 'gumtree')),
  account_name TEXT NOT NULL,
  account_email TEXT,

  -- Credentials (encrypted)
  credentials_encrypted TEXT, -- Encrypted JSON of login credentials
  session_cookies JSONB, -- Encrypted cookies

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,

  -- Account health
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned', 'limited', 'under_review')),
  suspension_reason TEXT,

  -- Limits and restrictions
  daily_listing_limit INTEGER DEFAULT 10,
  listings_today INTEGER DEFAULT 0,
  daily_purchase_limit INTEGER DEFAULT 5,
  purchases_today INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT marketplace_accounts_user_marketplace_unique UNIQUE (user_id, marketplace, account_email)
);

-- Indexes for marketplace_accounts
CREATE INDEX idx_marketplace_accounts_user ON marketplace_accounts(user_id);
CREATE INDEX idx_marketplace_accounts_marketplace ON marketplace_accounts(marketplace);
CREATE INDEX idx_marketplace_accounts_status ON marketplace_accounts(account_status);
CREATE INDEX idx_marketplace_accounts_active ON marketplace_accounts(is_active) WHERE is_active = true;

-- =====================================================
-- QUEUED OPERATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS queued_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Operation details
  operation_type TEXT NOT NULL CHECK (operation_type IN ('buy', 'list', 'delist', 'update_listing', 'check_status')),
  marketplace TEXT NOT NULL,

  -- References
  opportunity_id UUID REFERENCES buy_opportunities(id) ON DELETE SET NULL,
  draft_id UUID REFERENCES listing_drafts(id) ON DELETE SET NULL,

  -- Priority and scheduling
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10), -- 1 = highest
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Status
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  error_message TEXT,

  -- Execution metadata
  execution_duration_ms INTEGER,
  last_attempt_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for queued_operations
CREATE INDEX idx_queued_operations_user ON queued_operations(user_id);
CREATE INDEX idx_queued_operations_status ON queued_operations(status) WHERE status IN ('queued', 'processing');
CREATE INDEX idx_queued_operations_scheduled ON queued_operations(scheduled_at) WHERE status = 'queued';
CREATE INDEX idx_queued_operations_priority ON queued_operations(priority, scheduled_at);
CREATE INDEX idx_queued_operations_type ON queued_operations(operation_type);
CREATE INDEX idx_queued_operations_opportunity ON queued_operations(opportunity_id);
CREATE INDEX idx_queued_operations_draft ON queued_operations(draft_id);

-- =====================================================
-- RISK ASSESSMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  opportunity_id UUID REFERENCES buy_opportunities(id) ON DELETE CASCADE NOT NULL,

  -- Risk factors
  price_risk_score INTEGER CHECK (price_risk_score >= 0 AND price_risk_score <= 100),
  seller_risk_score INTEGER CHECK (seller_risk_score >= 0 AND seller_risk_score <= 100),
  market_risk_score INTEGER CHECK (market_risk_score >= 0 AND market_risk_score <= 100),
  authenticity_risk_score INTEGER CHECK (authenticity_risk_score >= 0 AND authenticity_risk_score <= 100),

  -- Overall risk
  overall_risk_score INTEGER CHECK (overall_risk_score >= 0 AND overall_risk_score <= 100),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'very_high')),

  -- Risk factors breakdown
  risk_factors JSONB, -- Detailed breakdown of risk factors

  -- Recommendations
  recommended_action TEXT CHECK (recommended_action IN ('approve', 'reject', 'manual_review')),
  reasoning TEXT,

  -- AI assessment
  ai_provider TEXT DEFAULT 'deepseek',
  assessment_duration_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT risk_assessments_opportunity_unique UNIQUE (opportunity_id)
);

-- Indexes for risk_assessments
CREATE INDEX idx_risk_assessments_user ON risk_assessments(user_id);
CREATE INDEX idx_risk_assessments_opportunity ON risk_assessments(opportunity_id);
CREATE INDEX idx_risk_assessments_risk_level ON risk_assessments(risk_level);
CREATE INDEX idx_risk_assessments_overall_score ON risk_assessments(overall_risk_score);
CREATE INDEX idx_risk_assessments_action ON risk_assessments(recommended_action);

-- =====================================================
-- AGENTIC TELEMETRY
-- =====================================================

CREATE TABLE IF NOT EXISTS agentic_telemetry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN ('buy_opportunity_created', 'buy_executed', 'listing_generated', 'listing_posted', 'risk_assessed', 'operation_queued', 'error')),
  marketplace TEXT,

  -- Metrics
  duration_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for agentic_telemetry
CREATE INDEX idx_agentic_telemetry_user ON agentic_telemetry(user_id);
CREATE INDEX idx_agentic_telemetry_event ON agentic_telemetry(event_type);
CREATE INDEX idx_agentic_telemetry_created ON agentic_telemetry(created_at DESC);
CREATE INDEX idx_agentic_telemetry_success ON agentic_telemetry(success);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE buy_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE buy_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE queued_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentic_telemetry ENABLE ROW LEVEL SECURITY;

-- buy_opportunities policies
CREATE POLICY "Users can view their own buy opportunities"
  ON buy_opportunities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own buy opportunities"
  ON buy_opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own buy opportunities"
  ON buy_opportunities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own buy opportunities"
  ON buy_opportunities FOR DELETE
  USING (auth.uid() = user_id);

-- buy_executions policies
CREATE POLICY "Users can view their own buy executions"
  ON buy_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own buy executions"
  ON buy_executions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own buy executions"
  ON buy_executions FOR UPDATE
  USING (auth.uid() = user_id);

-- listing_drafts policies
CREATE POLICY "Users can view their own listing drafts"
  ON listing_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own listing drafts"
  ON listing_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listing drafts"
  ON listing_drafts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listing drafts"
  ON listing_drafts FOR DELETE
  USING (auth.uid() = user_id);

-- listing_executions policies
CREATE POLICY "Users can view their own listing executions"
  ON listing_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own listing executions"
  ON listing_executions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listing executions"
  ON listing_executions FOR UPDATE
  USING (auth.uid() = user_id);

-- marketplace_accounts policies
CREATE POLICY "Users can view their own marketplace accounts"
  ON marketplace_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own marketplace accounts"
  ON marketplace_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own marketplace accounts"
  ON marketplace_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own marketplace accounts"
  ON marketplace_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- queued_operations policies
CREATE POLICY "Users can view their own queued operations"
  ON queued_operations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own queued operations"
  ON queued_operations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queued operations"
  ON queued_operations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queued operations"
  ON queued_operations FOR DELETE
  USING (auth.uid() = user_id);

-- risk_assessments policies
CREATE POLICY "Users can view their own risk assessments"
  ON risk_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own risk assessments"
  ON risk_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- agentic_telemetry policies
CREATE POLICY "Users can view their own telemetry"
  ON agentic_telemetry FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own telemetry"
  ON agentic_telemetry FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_buy_opportunities_updated_at
  BEFORE UPDATE ON buy_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listing_drafts_updated_at
  BEFORE UPDATE ON listing_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_accounts_updated_at
  BEFORE UPDATE ON marketplace_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_queued_operations_updated_at
  BEFORE UPDATE ON queued_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to reset daily limits at midnight
CREATE OR REPLACE FUNCTION reset_daily_limits()
RETURNS void AS $$
BEGIN
  UPDATE marketplace_accounts
  SET
    listings_today = 0,
    purchases_today = 0
  WHERE is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate risk level from score
CREATE OR REPLACE FUNCTION calculate_risk_level(score INTEGER)
RETURNS TEXT AS $$
BEGIN
  CASE
    WHEN score <= 25 THEN RETURN 'low';
    WHEN score <= 50 THEN RETURN 'medium';
    WHEN score <= 75 THEN RETURN 'high';
    ELSE RETURN 'very_high';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- VIEWS
-- =====================================================

-- View for high-value opportunities
CREATE OR REPLACE VIEW high_value_opportunities AS
SELECT
  bo.*,
  ra.overall_risk_score,
  ra.risk_level,
  ra.recommended_action
FROM buy_opportunities bo
LEFT JOIN risk_assessments ra ON bo.id = ra.opportunity_id
WHERE
  bo.status = 'pending'
  AND bo.estimated_roi >= 50
  AND (ra.risk_level IS NULL OR ra.risk_level IN ('low', 'medium'))
ORDER BY bo.estimated_roi DESC;

-- View for ready-to-list drafts
CREATE OR REPLACE VIEW ready_to_list_drafts AS
SELECT
  ld.*,
  be.purchase_price,
  be.transaction_id
FROM listing_drafts ld
LEFT JOIN buy_executions be ON ld.buy_execution_id = be.id
WHERE
  ld.status = 'approved'
  AND (be.status IS NULL OR be.status = 'completed')
ORDER BY ld.approved_at DESC;

-- View for active marketplace accounts
CREATE OR REPLACE VIEW active_marketplace_accounts AS
SELECT
  ma.*,
  COUNT(DISTINCT le.id) AS total_listings,
  COUNT(DISTINCT be.id) AS total_purchases
FROM marketplace_accounts ma
LEFT JOIN listing_executions le ON le.user_id = ma.user_id AND le.marketplace = ma.marketplace
LEFT JOIN buy_executions be ON be.user_id = ma.user_id AND be.marketplace = ma.marketplace
WHERE
  ma.is_active = true
  AND ma.account_status = 'active'
GROUP BY ma.id;

-- View for operation queue status
CREATE OR REPLACE VIEW operation_queue_status AS
SELECT
  operation_type,
  marketplace,
  status,
  COUNT(*) AS count,
  AVG(execution_duration_ms) AS avg_duration_ms,
  MAX(scheduled_at) AS latest_scheduled,
  MIN(scheduled_at) AS earliest_scheduled
FROM queued_operations
WHERE status IN ('queued', 'processing')
GROUP BY operation_type, marketplace, status;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE buy_opportunities IS 'Identified profitable deals from scraped listings';
COMMENT ON TABLE buy_executions IS 'Automated purchase attempts and results';
COMMENT ON TABLE listing_drafts IS 'AI-generated listings ready for marketplace posting';
COMMENT ON TABLE listing_executions IS 'Automated listing creation attempts';
COMMENT ON TABLE marketplace_accounts IS 'User marketplace account credentials and status';
COMMENT ON TABLE queued_operations IS 'Scheduled buy/list operations queue';
COMMENT ON TABLE risk_assessments IS 'Risk analysis for each buy opportunity';
COMMENT ON TABLE agentic_telemetry IS 'Telemetry and monitoring for agentic operations';

-- =====================================================
-- INITIAL DATA (Optional)
-- =====================================================

-- No initial data required - tables will be populated by agentic engine

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Agentic Engine tables created successfully';
  RAISE NOTICE 'Total tables created: 8';
  RAISE NOTICE 'Total views created: 4';
  RAISE NOTICE 'RLS policies: Enabled on all tables';
END $$;
