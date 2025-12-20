-- =====================================================
-- Growth features support schema (idempotent)
-- - Instant alerts: user_notification_settings, alert_events, alert_deliveries
-- - Winning templates: search_templates, template_installs
-- - Advanced filters: user_blocks
-- - Support promise: support_tickets
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------
-- Notification settings per user (push/email + quiet hours + per-search toggles)
-- -------------------------
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
  user_id uuid PRIMARY KEY,

  push_enabled boolean NOT NULL DEFAULT false,
  email_enabled boolean NOT NULL DEFAULT true,

  -- Quiet hours (optional). Store minutes-from-midnight in the user's timezone.
  quiet_hours_start_minute integer,
  quiet_hours_end_minute integer,
  quiet_hours_timezone text,

  -- Per-search overrides (map of saved_search_id -> settings)
  per_search jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Push subscriptions (array of PushSubscription JSON blobs)
  push_subscriptions jsonb NOT NULL DEFAULT '[]'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notification_settings_updated_at
  ON public.user_notification_settings (updated_at DESC);

-- -------------------------
-- Alert events (dedupe + cooldown handled via cooldown_key)
-- -------------------------
CREATE TABLE IF NOT EXISTS public.alert_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL,
  marketplace text NOT NULL,
  listing_id text NOT NULL,

  -- Optional context
  deal_id uuid,
  search_id uuid REFERENCES public.saved_searches(id) ON DELETE SET NULL,

  score integer NOT NULL DEFAULT 0,

  -- Used to deduplicate notifications with a cooldown bucket.
  cooldown_key text NOT NULL,

  payload jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS alert_events_cooldown_key_uidx
  ON public.alert_events (cooldown_key);

CREATE INDEX IF NOT EXISTS idx_alert_events_user_created_at
  ON public.alert_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_events_marketplace_created_at
  ON public.alert_events (marketplace, created_at DESC);

-- -------------------------
-- Alert deliveries (push/email dispatch status)
-- -------------------------
CREATE TABLE IF NOT EXISTS public.alert_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  alert_event_id uuid NOT NULL REFERENCES public.alert_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,

  channel text NOT NULL, -- push | email
  status text NOT NULL DEFAULT 'pending', -- pending | sent | failed | skipped

  provider text,
  endpoint text,
  error text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_alert_deliveries_status_channel_created_at
  ON public.alert_deliveries (status, channel, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_deliveries_user_created_at
  ON public.alert_deliveries (user_id, created_at DESC);

-- -------------------------
-- Search templates library
-- -------------------------
CREATE TABLE IF NOT EXISTS public.search_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  marketplace text NOT NULL,
  params_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  region text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_templates_marketplace_region
  ON public.search_templates (marketplace, region);

CREATE INDEX IF NOT EXISTS idx_search_templates_category
  ON public.search_templates (category);

-- Track adoption
CREATE TABLE IF NOT EXISTS public.template_installs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.search_templates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_template_installs_template_id_created_at
  ON public.template_installs (template_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_template_installs_user_id_created_at
  ON public.template_installs (user_id, created_at DESC);

-- -------------------------
-- Advanced filters: user blocks (seller/location/keyword)
-- -------------------------
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  marketplace text NOT NULL,
  type text NOT NULL, -- seller | location | keyword
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_blocks_dedupe_uidx
  ON public.user_blocks (user_id, marketplace, type, value);

CREATE INDEX IF NOT EXISTS idx_user_blocks_user_marketplace
  ON public.user_blocks (user_id, marketplace);

-- -------------------------
-- Support promise: user-submitted tickets
-- -------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  category text NOT NULL DEFAULT 'search_optimization',
  subject text,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open', -- open | closed
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_created_at
  ON public.support_tickets (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status_created_at
  ON public.support_tickets (status, created_at DESC);

