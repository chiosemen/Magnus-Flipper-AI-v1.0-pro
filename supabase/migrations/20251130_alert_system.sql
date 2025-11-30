-- ============================================================================
-- ALERT SYSTEM SCHEMA
-- ============================================================================
-- Creates tables for alert rules, notifications, and delivery tracking
-- SAFE: Isolated tables, no foreign keys, no schema.prisma changes
-- ============================================================================

-- Alert Rules Table
-- Stores user-defined alert configurations with conditions
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Alert Type
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'PRICE_DROP',
    'KEYWORD_MATCH',
    'INVENTORY_RESTOCK',
    'GEO_LOCATION',
    'CUSTOM'
  )),

  -- Target Configuration
  marketplace TEXT CHECK (marketplace IN ('VINTED', 'EBAY', 'GUMTREE', 'FB_MARKETPLACE', 'CRAIGSLIST', 'OFFERUP')),
  search_query TEXT,

  -- Condition Rules (JSON)
  conditions JSONB NOT NULL DEFAULT '{}',
  -- Examples:
  -- Price drop: {"price_threshold": 500, "currency": "GBP", "comparison": "less_than"}
  -- Keyword: {"keywords": ["iPhone 15", "Pro Max"], "match_type": "any"}
  -- Geo: {"location": "London", "radius_km": 10}
  -- Inventory: {"item_id": "abc123", "notify_on": "restock"}

  -- Notification Channels (JSON Array)
  notification_channels JSONB NOT NULL DEFAULT '["EMAIL"]',
  -- Examples: ["EMAIL", "SMS", "PUSH", "WEBHOOK"]

  -- Webhook Configuration (optional)
  webhook_url TEXT,
  webhook_headers JSONB,

  -- Status
  active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for alert_rules
CREATE INDEX idx_alert_rules_user_id ON alert_rules(user_id);
CREATE INDEX idx_alert_rules_marketplace ON alert_rules(marketplace);
CREATE INDEX idx_alert_rules_alert_type ON alert_rules(alert_type);
CREATE INDEX idx_alert_rules_active ON alert_rules(active) WHERE active = true;

-- Alert Notifications Table
-- Stores triggered alerts and their matched listings
CREATE TABLE IF NOT EXISTS alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID NOT NULL,
  user_id TEXT NOT NULL,

  -- Trigger Details
  trigger_type TEXT NOT NULL,
  trigger_reason TEXT,

  -- Matched Listing
  listing_id UUID,
  marketplace TEXT,
  listing_title TEXT,
  listing_price NUMERIC,
  listing_url TEXT,
  listing_location TEXT,

  -- Notification Status
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING',
    'SENT',
    'FAILED',
    'DISMISSED'
  )),

  -- Delivery Tracking
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for alert_notifications
CREATE INDEX idx_alert_notifications_alert_rule_id ON alert_notifications(alert_rule_id);
CREATE INDEX idx_alert_notifications_user_id ON alert_notifications(user_id);
CREATE INDEX idx_alert_notifications_status ON alert_notifications(status);
CREATE INDEX idx_alert_notifications_created_at ON alert_notifications(created_at DESC);

-- Alert Delivery Log Table
-- Tracks delivery attempts across all channels
CREATE TABLE IF NOT EXISTS alert_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL,

  -- Channel Info
  channel TEXT NOT NULL CHECK (channel IN (
    'EMAIL',
    'SMS',
    'PUSH',
    'WEBHOOK'
  )),

  -- Recipient
  recipient TEXT NOT NULL,

  -- Delivery Status
  status TEXT NOT NULL CHECK (status IN (
    'QUEUED',
    'SENT',
    'DELIVERED',
    'FAILED',
    'BOUNCED'
  )),

  -- Provider Info
  provider TEXT,
  provider_message_id TEXT,

  -- Response Data
  response_code INTEGER,
  response_body TEXT,
  error_message TEXT,

  -- Timing
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,

  -- Retry Info
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for alert_delivery_log
CREATE INDEX idx_alert_delivery_log_notification_id ON alert_delivery_log(notification_id);
CREATE INDEX idx_alert_delivery_log_status ON alert_delivery_log(status);
CREATE INDEX idx_alert_delivery_log_channel ON alert_delivery_log(channel);
CREATE INDEX idx_alert_delivery_log_created_at ON alert_delivery_log(created_at DESC);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE alert_rules IS 'User-defined alert configurations with conditions and notification preferences';
COMMENT ON TABLE alert_notifications IS 'Triggered alerts with matched listings and delivery status';
COMMENT ON TABLE alert_delivery_log IS 'Delivery tracking for all notification channels (email, SMS, push, webhook)';

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Example: Price drop alert for iPhone 15 under £500 in London
INSERT INTO alert_rules (
  user_id,
  name,
  description,
  alert_type,
  marketplace,
  search_query,
  conditions,
  notification_channels,
  active
) VALUES (
  'test-user-1',
  'iPhone 15 Price Drop Alert',
  'Notify me when iPhone 15 drops below £500 in London area',
  'PRICE_DROP',
  'VINTED',
  'iphone 15',
  '{"price_threshold": 500, "currency": "GBP", "comparison": "less_than", "location": "London", "radius_km": 10}',
  '["EMAIL", "PUSH"]',
  true
) ON CONFLICT DO NOTHING;

-- Example: Keyword alert for Pro Max models
INSERT INTO alert_rules (
  user_id,
  name,
  description,
  alert_type,
  marketplace,
  search_query,
  conditions,
  notification_channels,
  active
) VALUES (
  'test-user-1',
  'Pro Max Keyword Alert',
  'Notify me when Pro Max models appear',
  'KEYWORD_MATCH',
  NULL,
  'iphone',
  '{"keywords": ["Pro Max", "15 Pro"], "match_type": "any", "case_sensitive": false}',
  '["EMAIL"]',
  true
) ON CONFLICT DO NOTHING;
