-- =====================================================
-- LAUNCH INFRA PACK - SUPABASE PRODUCTION SETUP
-- Auth, User Profiles, Subscriptions, Logging, Tokens
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. USERS TABLE (extends auth.users)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);

-- =====================================================
-- 2. SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

  -- Subscription details
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'agency', 'admin')),
  is_active BOOLEAN DEFAULT false,

  -- Stripe integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,

  -- Billing period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  -- Payment status
  payment_status TEXT CHECK (payment_status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,

  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT subscriptions_user_unique UNIQUE (user_id)
);

-- Indexes
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_tier ON public.subscriptions(tier);
CREATE INDEX idx_subscriptions_active ON public.subscriptions(is_active) WHERE is_active = true;
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON public.subscriptions(stripe_subscription_id);

-- =====================================================
-- 3. SCRAPER EVENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.scraper_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

  -- Event details
  marketplace TEXT NOT NULL CHECK (marketplace IN ('ebay', 'facebook', 'craigslist', 'vinted', 'depop', 'gumtree', 'offerup', 'mercari', 'poshmark')),
  event_type TEXT NOT NULL CHECK (event_type IN ('scrape_started', 'scrape_completed', 'scrape_failed', 'listing_found', 'deal_identified')),

  -- Event payload
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Metadata
  ip_address INET,
  user_agent TEXT,
  duration_ms INTEGER,
  items_scraped INTEGER,

  -- Status
  status TEXT CHECK (status IN ('success', 'error', 'warning')),
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_scraper_events_user ON public.scraper_events(user_id);
CREATE INDEX idx_scraper_events_marketplace ON public.scraper_events(marketplace);
CREATE INDEX idx_scraper_events_type ON public.scraper_events(event_type);
CREATE INDEX idx_scraper_events_created ON public.scraper_events(created_at DESC);
CREATE INDEX idx_scraper_events_status ON public.scraper_events(status);
CREATE INDEX idx_scraper_events_payload ON public.scraper_events USING gin(payload);

-- =====================================================
-- 4. DEAL SCORES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.deal_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

  -- Deal reference
  deal_id TEXT NOT NULL,
  listing_id TEXT,
  marketplace TEXT NOT NULL,

  -- Scoring
  raw_score FLOAT NOT NULL CHECK (raw_score >= 0 AND raw_score <= 100),
  adjusted_score FLOAT NOT NULL CHECK (adjusted_score >= 0 AND adjusted_score <= 100),
  ai_confidence FLOAT NOT NULL CHECK (ai_confidence >= 0 AND ai_confidence <= 1),

  -- Breakdown
  profit_score FLOAT,
  risk_score FLOAT,
  velocity_score FLOAT,
  market_score FLOAT,

  -- AI metadata
  ai_provider TEXT DEFAULT 'deepseek',
  ai_reasoning JSONB,
  evaluation_duration_ms INTEGER,

  -- Deal details
  estimated_profit DECIMAL(10, 2),
  estimated_roi DECIMAL(5, 2),
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high', 'very_high')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT deal_scores_deal_unique UNIQUE (deal_id)
);

-- Indexes
CREATE INDEX idx_deal_scores_user ON public.deal_scores(user_id);
CREATE INDEX idx_deal_scores_deal ON public.deal_scores(deal_id);
CREATE INDEX idx_deal_scores_listing ON public.deal_scores(listing_id);
CREATE INDEX idx_deal_scores_marketplace ON public.deal_scores(marketplace);
CREATE INDEX idx_deal_scores_adjusted ON public.deal_scores(adjusted_score DESC);
CREATE INDEX idx_deal_scores_created ON public.deal_scores(created_at DESC);
CREATE INDEX idx_deal_scores_confidence ON public.deal_scores(ai_confidence DESC);

-- =====================================================
-- 5. API KEYS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

  -- Key details
  name TEXT NOT NULL,
  value TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "sk_live_")

  -- Permissions
  scopes TEXT[] DEFAULT ARRAY['read'], -- ['read', 'write', 'delete']

  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  requests_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_value ON public.api_keys(value);
CREATE INDEX idx_api_keys_prefix ON public.api_keys(key_prefix);
CREATE INDEX idx_api_keys_active ON public.api_keys(is_active) WHERE is_active = true;
CREATE INDEX idx_api_keys_last_used ON public.api_keys(last_used_at DESC);

-- =====================================================
-- 6. USAGE LOGS TABLE (for rate limiting and analytics)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,

  -- Request details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,

  -- Response
  status_code INTEGER,
  response_time_ms INTEGER,

  -- Metadata
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_usage_logs_user ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_api_key ON public.usage_logs(api_key_id);
CREATE INDEX idx_usage_logs_created ON public.usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_endpoint ON public.usage_logs(endpoint);

-- Partitioning (optional - for large scale)
-- CREATE TABLE usage_logs_2024_12 PARTITION OF usage_logs
-- FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES - STRICT
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can read only themselves
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update only themselves
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Insert policy (handled by auth trigger)
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- SUBSCRIPTIONS TABLE POLICIES
-- =====================================================

-- Users can read only their own subscription
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update subscriptions
CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- SCRAPER EVENTS TABLE POLICIES
-- =====================================================

-- Agency tier users can read all scraper events
CREATE POLICY "Agency tier users can view all scraper events"
  ON public.scraper_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE user_id = auth.uid()
        AND tier IN ('agency', 'admin')
        AND is_active = true
    )
  );

-- Pro tier users can view only their own events
CREATE POLICY "Pro tier users can view their own scraper events"
  ON public.scraper_events FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE user_id = auth.uid()
        AND tier IN ('pro', 'agency', 'admin')
        AND is_active = true
    )
  );

-- Service role can insert events
CREATE POLICY "Service role can insert scraper events"
  ON public.scraper_events FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- DEAL SCORES TABLE POLICIES
-- =====================================================

-- Paid tier users can read deal scores
CREATE POLICY "Paid users can view deal scores"
  ON public.deal_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE user_id = auth.uid()
        AND tier IN ('pro', 'agency', 'admin')
        AND is_active = true
    )
  );

-- Users can view their own deal scores
CREATE POLICY "Users can view their own deal scores"
  ON public.deal_scores FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage deal scores
CREATE POLICY "Service role can manage deal scores"
  ON public.deal_scores FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- API KEYS TABLE POLICIES
-- =====================================================

-- Users can read only their own API keys
CREATE POLICY "Users can view their own API keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own API keys
CREATE POLICY "Users can create their own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own API keys (e.g., revoke)
CREATE POLICY "Users can update their own API keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own API keys
CREATE POLICY "Users can delete their own API keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- USAGE LOGS TABLE POLICIES
-- =====================================================

-- Users can view their own usage logs
CREATE POLICY "Users can view their own usage logs"
  ON public.usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert usage logs
CREATE POLICY "Service role can insert usage logs"
  ON public.usage_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW());

  -- Create free tier subscription
  INSERT INTO public.subscriptions (user_id, tier, is_active, created_at)
  VALUES (NEW.id, 'free', true, NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
  key_value TEXT;
BEGIN
  key_value := 'sk_live_' || encode(gen_random_bytes(32), 'base64');
  key_value := replace(key_value, '/', '_');
  key_value := replace(key_value, '+', '-');
  RETURN key_value;
END;
$$ LANGUAGE plpgsql;

-- Function to check subscription tier
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_tier TEXT;
BEGIN
  SELECT tier INTO user_tier
  FROM public.subscriptions
  WHERE user_id = p_user_id
    AND is_active = true
  LIMIT 1;

  RETURN COALESCE(user_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(p_api_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  key_record RECORD;
  requests_last_minute INTEGER;
BEGIN
  -- Get API key details
  SELECT * INTO key_record
  FROM public.api_keys
  WHERE value = p_api_key
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Count requests in last minute
  SELECT COUNT(*) INTO requests_last_minute
  FROM public.usage_logs
  WHERE api_key_id = key_record.id
    AND created_at > NOW() - INTERVAL '1 minute';

  -- Check if rate limit exceeded
  IF requests_last_minute >= key_record.rate_limit_per_minute THEN
    RETURN false;
  END IF;

  -- Update last used timestamp and increment count
  UPDATE public.api_keys
  SET
    last_used_at = NOW(),
    requests_count = requests_count + 1
  WHERE id = key_record.id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. VIEWS
-- =====================================================

-- View for active subscriptions
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT
  s.id,
  s.user_id,
  u.email,
  s.tier,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  s.current_period_end,
  s.payment_status,
  s.cancel_at_period_end
FROM public.subscriptions s
JOIN public.users u ON s.user_id = u.id
WHERE s.is_active = true;

-- View for user activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT
  u.id AS user_id,
  u.email,
  s.tier,
  COUNT(DISTINCT se.id) AS scraper_events_count,
  COUNT(DISTINCT ds.id) AS deal_scores_count,
  COUNT(DISTINCT ak.id) AS api_keys_count,
  MAX(u.last_seen_at) AS last_seen_at
FROM public.users u
LEFT JOIN public.subscriptions s ON u.id = s.user_id AND s.is_active = true
LEFT JOIN public.scraper_events se ON u.id = se.user_id
LEFT JOIN public.deal_scores ds ON u.id = ds.user_id
LEFT JOIN public.api_keys ak ON u.id = ak.user_id AND ak.is_active = true
GROUP BY u.id, u.email, s.tier;

-- View for API usage metrics
CREATE OR REPLACE VIEW api_usage_metrics AS
SELECT
  ak.user_id,
  ak.name AS api_key_name,
  ak.key_prefix,
  COUNT(ul.id) AS total_requests,
  AVG(ul.response_time_ms) AS avg_response_time_ms,
  MAX(ul.created_at) AS last_request_at,
  COUNT(CASE WHEN ul.status_code >= 400 THEN 1 END) AS error_count
FROM public.api_keys ak
LEFT JOIN public.usage_logs ul ON ak.id = ul.api_key_id
WHERE ak.is_active = true
GROUP BY ak.user_id, ak.name, ak.key_prefix;

-- =====================================================
-- 10. COMMENTS
-- =====================================================

COMMENT ON TABLE public.users IS 'User profiles extending auth.users';
COMMENT ON TABLE public.subscriptions IS 'User subscription tiers and Stripe billing';
COMMENT ON TABLE public.scraper_events IS 'Marketplace scraper event logs';
COMMENT ON TABLE public.deal_scores IS 'AI-evaluated deal scores and confidence';
COMMENT ON TABLE public.api_keys IS 'User API keys for programmatic access';
COMMENT ON TABLE public.usage_logs IS 'API usage logs for rate limiting and analytics';

COMMENT ON FUNCTION handle_new_user() IS 'Automatically create user profile and free subscription on signup';
COMMENT ON FUNCTION generate_api_key() IS 'Generate secure API key with prefix';
COMMENT ON FUNCTION get_user_tier(UUID) IS 'Get active subscription tier for user';
COMMENT ON FUNCTION check_rate_limit(TEXT) IS 'Check if API key has exceeded rate limit';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🚀 LAUNCH INFRA PACK - Migration Complete';
  RAISE NOTICE '✅ Tables created: users, subscriptions, scraper_events, deal_scores, api_keys, usage_logs';
  RAISE NOTICE '✅ RLS policies: Strict isolation per user and tier';
  RAISE NOTICE '✅ Helper functions: User creation, API key generation, rate limiting';
  RAISE NOTICE '✅ Views: Active subscriptions, user activity, API metrics';
  RAISE NOTICE '📊 Ready for Edge Functions deployment';
END $$;
