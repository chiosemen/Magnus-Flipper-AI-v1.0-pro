# PHASE 11B — SECTION 2: SUPABASE DEPLOYMENT PREVIEW

**Status**: 🔍 PREVIEW MODE (No actions executed)  
**Date**: 2024-01-15  
**Section**: 2 - Supabase Deployment  
**Risk Level**: 🔴 **HIGH** (Production database changes)

---

## ⚠️  CRITICAL WARNING

**This section will modify your production Supabase database.**

- ✅ **Preview Mode**: Showing what will be deployed
- ❌ **No changes made yet** - Awaiting your explicit approval
- 🔴 **Irreversible**: Some operations cannot be easily undone
- 💾 **Backup Recommended**: Ensure database backup before proceeding

---

## DEPLOYMENT OVERVIEW

This section will deploy:

1. **Database Schema** (13 migration files)
2. **Row Level Security (RLS)** policies (all tables)
3. **Database Functions** (user creation, API keys, rate limiting)
4. **Triggers** (auto-create profiles, update timestamps)
5. **Storage Buckets** (shipping labels, listing images)
6. **Storage Policies** (access control)
7. **Views** (active subscriptions, user activity, API metrics)

---

## MIGRATION FILES TO APPLY

### Migration Order (Chronological)

1. **`0012_profit_engine_tables.sql`** - Profit engine tables
2. **`0013_shipping_engine_tables.sql`** - Shipping engine tables
3. **`0014_scraper_sync_tables.sql`** - Scraper sync tables
4. **`0015_agentic_engine_tables.sql`** - Agentic engine tables
5. **`0016_launch_infra_pack.sql`** - Core infrastructure (users, subscriptions, API keys)
6. **`20251130_alert_system.sql`** - Alert system tables
7. **`20251130_marketplace_listings.sql`** - Marketplace listings
8. **`20251130_marketplace_analytics.sql`** - Analytics tables
9. **`20251130_expand_marketplace_support.sql`** - Extended marketplace support
10. **`20251130_analytics_enhancements.sql`** - Analytics enhancements

**Note**: Additional migrations may exist in `apps/web/database/migrations/` (subscriptions, admin, workers)

---

## DATABASE SCHEMA PREVIEW

### Core Tables (from `0016_launch_infra_pack.sql`)

#### 1. `public.users`
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ
);
```

**Indexes**:
- `idx_users_email` on `email`
- `idx_users_created_at` on `created_at DESC`

---

#### 2. `public.subscriptions`
```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'agency', 'admin')),
  is_active BOOLEAN DEFAULT false,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  payment_status TEXT CHECK (payment_status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscriptions_user_unique UNIQUE (user_id)
);
```

**Indexes**:
- `idx_subscriptions_user` on `user_id`
- `idx_subscriptions_tier` on `tier`
- `idx_subscriptions_active` on `is_active` (partial, WHERE is_active = true)
- `idx_subscriptions_stripe_customer` on `stripe_customer_id`
- `idx_subscriptions_stripe_subscription` on `stripe_subscription_id`

---

#### 3. `public.scraper_events`
```sql
CREATE TABLE public.scraper_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  marketplace TEXT NOT NULL CHECK (marketplace IN ('ebay', 'facebook', 'craigslist', 'vinted', 'depop', 'gumtree', 'offerup', 'mercari', 'poshmark')),
  event_type TEXT NOT NULL CHECK (event_type IN ('scrape_started', 'scrape_completed', 'scrape_failed', 'listing_found', 'deal_identified')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  duration_ms INTEGER,
  items_scraped INTEGER,
  status TEXT CHECK (status IN ('success', 'error', 'warning')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes**: Multiple indexes on `user_id`, `marketplace`, `event_type`, `created_at`, `status`, and GIN index on `payload`

---

#### 4. `public.deal_scores`
```sql
CREATE TABLE public.deal_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  deal_id TEXT NOT NULL,
  listing_id TEXT,
  marketplace TEXT NOT NULL,
  raw_score FLOAT NOT NULL CHECK (raw_score >= 0 AND raw_score <= 100),
  adjusted_score FLOAT NOT NULL CHECK (adjusted_score >= 0 AND adjusted_score <= 100),
  ai_confidence FLOAT NOT NULL CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  profit_score FLOAT,
  risk_score FLOAT,
  velocity_score FLOAT,
  market_score FLOAT,
  ai_provider TEXT DEFAULT 'deepseek',
  ai_reasoning JSONB,
  evaluation_duration_ms INTEGER,
  estimated_profit DECIMAL(10, 2),
  estimated_roi DECIMAL(5, 2),
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high', 'very_high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT deal_scores_deal_unique UNIQUE (deal_id)
);
```

---

#### 5. `public.api_keys`
```sql
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  value TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['read'],
  rate_limit_per_minute INTEGER DEFAULT 60,
  requests_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);
```

---

#### 6. `public.usage_logs`
```sql
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### Profit Engine Tables (from `0012_profit_engine_tables.sql`)

#### 7. `sale_events`
- Stores raw sale events from marketplace polling
- Links to `inventory` and `auth.users`
- Tracks sale price, buyer info, shipping details

#### 8. `sold_items`
- Finalized sales with complete P&L calculations
- Links to `sale_events` and `inventory`
- Tracks profit, ROI, holding time, refunds

#### 9. `ledger_entries`
- Double-entry accounting ledger
- Tracks all transactions (acquisition, sale, fees, shipping, refunds)
- Links to `inventory` and `sold_items`

#### 10. `ev_corrections`
- Expected value correction data
- Tracks calibration adjustments

#### 11. `portfolio_snapshots`
- Portfolio snapshots over time
- Tracks portfolio value, profit, ROI

#### 12. `platform_lock_events`
- Cross-platform lock events
- Prevents duplicate sales

#### 13. `marketplace_credentials`
- Encrypted marketplace API credentials
- Per-user, per-marketplace

---

### Shipping Engine Tables (from `0013_shipping_engine_tables.sql`)

#### 14. `shipping_requests`
- Shipping label requests
- Links to `sold_items` and `inventory`
- Stores addresses, dimensions, preferences

#### 15. `shipping_labels`
- Generated shipping labels with tracking
- Links to `shipping_requests`
- Stores label files, costs, delivery estimates

#### 16. `tracking_events`
- Shipment tracking updates
- Links to `shipping_labels`
- Tracks status changes, locations, timestamps

---

### Scraper Sync Tables (from `0014_scraper_sync_tables.sql`)

#### 17. `scraped_listings`
- All scraped marketplace listings
- Normalized fields, deduplication, freshness scoring
- Full-text search on normalized title

#### 18. `scraper_health`
- Health metrics for each marketplace scraper
- Tracks runs, success rates, errors

#### 19. `scraper_telemetry`
- Detailed telemetry for scraper runs
- Performance metrics, error tracking

---

### Agentic Engine Tables (from `0015_agentic_engine_tables.sql`)

#### 20. `agent_executions`
- Agent execution logs
- Tracks agent actions, decisions, outcomes

#### 21. `agent_decisions`
- Agent decision history
- Tracks decision reasoning, confidence

---

## ROW LEVEL SECURITY (RLS) POLICIES PREVIEW

### RLS Enabled on All Tables

All tables will have RLS enabled:
- ✅ `public.users`
- ✅ `public.subscriptions`
- ✅ `public.scraper_events`
- ✅ `public.deal_scores`
- ✅ `public.api_keys`
- ✅ `public.usage_logs`
- ✅ `sale_events`
- ✅ `sold_items`
- ✅ `ledger_entries`
- ✅ `ev_corrections`
- ✅ `portfolio_snapshots`
- ✅ `platform_lock_events`
- ✅ `marketplace_credentials`
- ✅ `shipping_requests`
- ✅ `shipping_labels`
- ✅ `tracking_events`
- ✅ `scraped_listings`
- ✅ `scraper_health`
- ✅ `scraper_telemetry`
- ✅ `agent_executions`
- ✅ `agent_decisions`

---

### RLS Policy Examples

#### Users Table Policies
```sql
-- Users can read only themselves
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update only themselves
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);
```

#### Subscriptions Table Policies
```sql
-- Users can read only their own subscription
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update subscriptions
CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');
```

#### Scraper Events Table Policies
```sql
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
```

#### Profit Engine Policies
```sql
-- Users can view their own sale events
CREATE POLICY "Users can view their own sale events"
  ON sale_events FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert/update sale events
CREATE POLICY "Service role can insert sale events"
  ON sale_events FOR INSERT
  WITH CHECK (true);

-- Users can view their own sold items
CREATE POLICY "Users can view their own sold items"
  ON sold_items FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view their own ledger entries
CREATE POLICY "Users can view their own ledger entries"
  ON ledger_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all ledger entries
CREATE POLICY "Service role can manage all ledger entries"
  ON ledger_entries FOR ALL
  USING (true);
```

---

## DATABASE FUNCTIONS PREVIEW

### 1. `update_updated_at_column()`
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Purpose**: Automatically updates `updated_at` timestamp on table updates

**Applied to**:
- `public.users`
- `public.subscriptions`

---

### 2. `handle_new_user()`
```sql
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
```

**Purpose**: Automatically creates user profile and free subscription on signup

**Trigger**: `on_auth_user_created` on `auth.users` AFTER INSERT

---

### 3. `generate_api_key()`
```sql
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
```

**Purpose**: Generates secure API keys with `sk_live_` prefix

---

### 4. `get_user_tier(p_user_id UUID)`
```sql
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
```

**Purpose**: Gets active subscription tier for a user (defaults to 'free')

---

### 5. `check_rate_limit(p_api_key TEXT)`
```sql
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
```

**Purpose**: Checks if API key has exceeded rate limit (per minute)

---

## DATABASE VIEWS PREVIEW

### 1. `active_subscriptions`
```sql
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
```

**Purpose**: View of all active subscriptions with user email

---

### 2. `user_activity_summary`
```sql
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
```

**Purpose**: Summary of user activity metrics

---

### 3. `api_usage_metrics`
```sql
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
```

**Purpose**: API usage metrics per API key

---

## STORAGE BUCKETS PREVIEW

### Required Buckets

#### 1. `shipping-labels` (from codebase)
- **Purpose**: Store shipping label PDFs
- **Public**: No (private)
- **File Size Limit**: 5MB (from code)
- **Allowed MIME Types**: `application/pdf`, `image/png`, `text/plain`
- **Policies**: 
  - Users can upload their own labels
  - Users can read their own labels
  - Service role has full access

#### 2. `listing-images` (from `supabase/storage.sql`)
- **Purpose**: Store marketplace listing images
- **Public**: Yes
- **Policies**:
  - Public read access
  - Authenticated users can write
  - Owners can update/delete

#### 3. `inventory-images` (recommended, not in codebase)
- **Purpose**: Store inventory item images
- **Public**: Yes (with signed URLs)
- **File Size Limit**: 5MB
- **Allowed MIME Types**: `image/jpeg`, `image/png`, `image/webp`

#### 4. `user-uploads` (recommended, not in codebase)
- **Purpose**: User-uploaded files
- **Public**: No
- **File Size Limit**: 10MB

---

### Storage Policies Preview

#### Listing Images Bucket Policies
```sql
-- Public read access
CREATE POLICY "Listing images read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

-- Authenticated users can write
CREATE POLICY "Listing images write by auth users"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listing-images'
    AND auth.role() = 'authenticated'
  );

-- Owners can update/delete
CREATE POLICY "Listing images update/delete by owner"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'listing-images'
    AND auth.role() = 'authenticated'
    AND owner = auth.uid()
  )
  WITH CHECK (
    bucket_id = 'listing-images'
    AND auth.role() = 'authenticated'
    AND owner = auth.uid()
  );
```

---

## AUTHENTICATION CONFIGURATION PREVIEW

### Auth Providers (to be configured in Supabase Dashboard)

1. **Email/Password**
   - ✅ Enabled by default
   - ⚠️  Email confirmation: **TO BE CONFIGURED**
   - ⚠️  Password reset: **TO BE CONFIGURED**
   - ⚠️  Rate limiting: **TO BE CONFIGURED**

2. **OAuth Providers** (optional)
   - ⚠️  Google OAuth: **TO BE CONFIGURED**
   - ⚠️  GitHub OAuth: **TO BE CONFIGURED**
   - ⚠️  Apple OAuth: **TO BE CONFIGURED**

### Auth Settings (to be configured)
- ⚠️  Email confirmation required: **TO BE SET**
- ⚠️  Password requirements: **TO BE SET**
- ⚠️  Session timeout: **TO BE SET**
- ⚠️  Rate limiting: **TO BE SET**

---

## EXTENSIONS TO ENABLE

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

**Purpose**:
- `uuid-ossp`: Generate UUIDs
- `pgcrypto`: Cryptographic functions (for API key generation)

---

## DEPLOYMENT COMMANDS PREVIEW

### Option 1: Using Prisma Migrate (if using Prisma)

```bash
# Set production database URL
export DATABASE_URL="postgresql://user:pass@host:5432/db"

# Generate Prisma client
pnpm generate

# Apply migrations
pnpm prisma migrate deploy
```

### Option 2: Using Supabase SQL Editor

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste each migration file in order
3. Execute each migration sequentially

### Option 3: Using Supabase CLI

```bash
# Link to project
supabase link --project-ref <project-ref>

# Apply migrations
supabase db push
```

---

## VERIFICATION STEPS (After Deployment)

1. **Verify Tables**:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

2. **Verify RLS**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND rowsecurity = true;
   ```

3. **Verify Functions**:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public';
   ```

4. **Verify Storage Buckets**:
   - Go to Supabase Dashboard → Storage
   - Verify buckets exist
   - Test upload/download

5. **Test Auth**:
   - Create test user
   - Verify profile created automatically
   - Verify free subscription created

---

## RISK ASSESSMENT

**Overall Risk**: 🔴 **HIGH**

**Risks**:
- ⚠️  **Irreversible Changes**: Some migrations may modify existing data
- ⚠️  **RLS Policies**: Incorrect policies may block legitimate access
- ⚠️  **Data Loss**: If migrations fail mid-execution, data may be inconsistent
- ⚠️  **Downtime**: Large migrations may cause temporary downtime

**Mitigation**:
- ✅ **Backup First**: Create database backup before deployment
- ✅ **Test in Staging**: Apply migrations to staging environment first
- ✅ **Verify RLS**: Test RLS policies with test users
- ✅ **Monitor**: Watch for errors during migration execution

---

## DRY RUN SUMMARY

### What WILL be executed (if approved):
1. ✅ Create/alter database tables (20+ tables)
2. ✅ Enable RLS on all tables
3. ✅ Create RLS policies (50+ policies)
4. ✅ Create database functions (5+ functions)
5. ✅ Create triggers (3+ triggers)
6. ✅ Create views (3+ views)
7. ✅ Create storage buckets (2-4 buckets)
8. ✅ Create storage policies (3+ policies)
9. ✅ Enable extensions (2 extensions)

### What will NOT be executed:
- ❌ No data deletion
- ❌ No existing data modification (unless migration specifies)
- ❌ No auth provider configuration (manual in dashboard)
- ❌ No backup creation (manual step required)

### Files that will be READ (not modified):
- `supabase/migrations/*.sql` (all migration files)
- `supabase/storage.sql`
- `SUPABASE_DEPLOYMENT_PLAN.md`

---

## APPROVAL REQUIRED

**To proceed with Supabase deployment**, please approve:

>>> **"Approve Supabase schema + RLS deployment"**

**Or if you want to:**
- Review specific migration files: "Show migration file X"
- Review RLS policies: "Show RLS policies for table X"
- Review storage configuration: "Show storage bucket setup"
- Skip to Section 3: "Skip to Section 3"

---

**Status**: 🔍 **AWAITING APPROVAL**

**Next Action**: Apply database migrations and configure RLS policies

---

**END OF SECTION 2 PREVIEW**

