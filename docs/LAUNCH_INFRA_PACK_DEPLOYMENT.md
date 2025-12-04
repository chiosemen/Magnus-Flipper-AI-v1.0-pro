# Launch Infra Pack™ - Complete Deployment Guide

**Production Supabase Setup with Auth, Subscriptions, Events, Scores, and API Keys**

---

## 📋 Overview

This deployment guide covers the complete setup of your Supabase infrastructure:

1. **Database Tables**: users, subscriptions, scraper_events, deal_scores, api_keys, usage_logs
2. **RLS Policies**: Strict user isolation with tier-based access
3. **Edge Functions**: Event ingestion, subscription updates, score recalculation, user onboarding
4. **Helper Functions**: Auto-profile creation, API key generation, rate limiting
5. **Views**: Active subscriptions, user activity, API metrics

---

## 🚀 Quick Start

### Prerequisites

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Verify installation
supabase --version
```

### 1. Initialize Supabase Project

```bash
# Navigate to project root
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro-reset

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref
```

### 2. Deploy Database Migration

```bash
# Apply the Launch Infra Pack migration
supabase db push

# Verify tables created
supabase db remote ls
```

**Expected output:**
```
✅ users
✅ subscriptions
✅ scraper_events
✅ deal_scores
✅ api_keys
✅ usage_logs
```

### 3. Deploy Edge Functions

```bash
# Deploy all edge functions
supabase functions deploy events-ingest
supabase functions deploy subscriptions-update
supabase functions deploy scores-recalculate
supabase functions deploy auth-on-signup

# Verify deployment
supabase functions list
```

### 4. Configure Edge Function Secrets

```bash
# Set required secrets
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  SUPABASE_URL=https://your-project.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Verify secrets
supabase secrets list
```

### 5. Configure Stripe Webhooks

```bash
# Get Edge Function URL
WEBHOOK_URL=$(supabase functions list | grep subscriptions-update | awk '{print $3}')

echo "Configure Stripe webhook:"
echo "$WEBHOOK_URL/subscriptions-update"

# Add this URL to Stripe Dashboard → Webhooks
# Events to listen for:
# - checkout.session.completed
# - customer.subscription.created
# - customer.subscription.updated
# - customer.subscription.deleted
# - invoice.payment_succeeded
# - invoice.payment_failed
```

---

## 📊 Database Schema Details

### Tables Created

#### 1. `users` (extends auth.users)
```sql
- id (UUID, references auth.users)
- email (TEXT, unique)
- full_name (TEXT)
- avatar_url (TEXT)
- metadata (JSONB)
- created_at, updated_at, last_seen_at
```

**Purpose**: User profiles with extended metadata

#### 2. `subscriptions`
```sql
- id (UUID)
- user_id (UUID, references users)
- tier (TEXT: free, pro, agency, admin)
- is_active (BOOLEAN)
- stripe_customer_id (TEXT)
- stripe_subscription_id (TEXT)
- stripe_price_id (TEXT)
- payment_status (TEXT)
- current_period_start/end (TIMESTAMPTZ)
- trial_start/end (TIMESTAMPTZ)
- cancel_at_period_end (BOOLEAN)
- canceled_at (TIMESTAMPTZ)
```

**Purpose**: Subscription management with Stripe integration

#### 3. `scraper_events`
```sql
- id (UUID)
- user_id (UUID)
- marketplace (TEXT)
- event_type (TEXT)
- payload (JSONB)
- ip_address (INET)
- user_agent (TEXT)
- duration_ms (INTEGER)
- items_scraped (INTEGER)
- status (TEXT)
- error_message (TEXT)
```

**Purpose**: Logging scraper operations and events

#### 4. `deal_scores`
```sql
- id (UUID)
- user_id (UUID)
- deal_id (TEXT, unique)
- listing_id (TEXT)
- marketplace (TEXT)
- raw_score, adjusted_score (FLOAT)
- ai_confidence (FLOAT)
- profit_score, risk_score, velocity_score, market_score (FLOAT)
- ai_provider (TEXT)
- ai_reasoning (JSONB)
- estimated_profit (DECIMAL)
- estimated_roi (DECIMAL)
- confidence_level (TEXT)
```

**Purpose**: AI-evaluated deal scores and confidence metrics

#### 5. `api_keys`
```sql
- id (UUID)
- user_id (UUID)
- name (TEXT)
- value (TEXT, unique)
- key_prefix (TEXT)
- scopes (TEXT[])
- rate_limit_per_minute (INTEGER)
- requests_count (INTEGER)
- last_used_at (TIMESTAMPTZ)
- is_active (BOOLEAN)
- expires_at (TIMESTAMPTZ)
```

**Purpose**: User API keys for programmatic access

#### 6. `usage_logs`
```sql
- id (UUID)
- user_id (UUID)
- api_key_id (UUID)
- endpoint (TEXT)
- method (TEXT)
- status_code (INTEGER)
- response_time_ms (INTEGER)
- ip_address (INET)
- user_agent (TEXT)
```

**Purpose**: API usage tracking and rate limiting

---

## 🔒 Row Level Security (RLS) Policies

### Users Table
- ✅ Users can view their own profile
- ✅ Users can update their own profile
- ✅ Users can insert their own profile (signup)

### Subscriptions Table
- ✅ Users can view their own subscription
- ✅ Only service role can manage subscriptions

### Scraper Events Table
- ✅ Agency tier users can view all events
- ✅ Pro tier users can view their own events
- ✅ Service role can insert events

### Deal Scores Table
- ✅ Paid tier users can view deal scores
- ✅ Users can view their own scores
- ✅ Service role can manage scores

### API Keys Table
- ✅ Users can CRUD their own API keys
- ❌ Users cannot view other users' keys

### Usage Logs Table
- ✅ Users can view their own usage logs
- ✅ Service role can insert logs

---

## ⚡ Edge Functions

### 1. `/events/ingest`

**Purpose**: Ingest marketplace scraper events with rate limiting

**Authentication**: JWT Bearer Token OR API Key (`x-api-key` header)

**Request**:
```json
POST /events/ingest
{
  "marketplace": "ebay",
  "event_type": "scrape_completed",
  "payload": {
    "items_found": 150,
    "duration_seconds": 45
  },
  "duration_ms": 45000,
  "items_scraped": 150,
  "status": "success"
}
```

**Response**:
```json
{
  "success": true,
  "event_id": "uuid",
  "message": "Event ingested successfully"
}
```

**Rate Limiting**: Enforced per API key (default: 60 requests/minute)

### 2. `/subscriptions/update`

**Purpose**: Handle Stripe webhook events for subscription management

**Authentication**: Stripe webhook signature verification

**Handled Events**:
- `checkout.session.completed` - Activate subscription
- `customer.subscription.created` - Create subscription
- `customer.subscription.updated` - Update subscription
- `customer.subscription.deleted` - Cancel subscription
- `invoice.payment_succeeded` - Mark payment success
- `invoice.payment_failed` - Mark payment failed

**Request**: Stripe webhook payload

**Response**:
```json
{
  "received": true,
  "event_type": "customer.subscription.updated"
}
```

### 3. `/scores/recalculate`

**Purpose**: Recalculate deal scores with updated algorithms

**Authentication**: JWT Bearer Token (Pro tier or higher required)

**Request**:
```json
POST /scores/recalculate
{
  "deal_ids": ["deal_123", "deal_456"],
  "marketplace": "ebay",
  "recalculate_all": false
}
```

**Response**:
```json
{
  "success": true,
  "recalculated_count": 2,
  "message": "Successfully recalculated 2 deal scores"
}
```

### 4. `/auth/on-signup`

**Purpose**: Handle new user signup events (auto-profile creation, welcome email)

**Authentication**: Supabase auth webhook (automatic)

**Handled Events**:
- `user.created` / `signup` - Create profile, free subscription, welcome API key
- `user.updated` - Update profile metadata
- `email.verified` - Record email verification

**Automatic Actions**:
1. Create user profile in `users` table
2. Create free tier subscription
3. Generate welcome API key with read scope
4. Send welcome email (optional - integrate email service)
5. Log signup event in `scraper_events`

---

## 🛠️ Helper Functions

### `handle_new_user()`
**Purpose**: Automatically create user profile and free subscription on signup
**Trigger**: `auth.users` INSERT

### `generate_api_key()`
**Purpose**: Generate secure API key with `sk_live_` prefix
**Returns**: TEXT

### `get_user_tier(user_id UUID)`
**Purpose**: Get active subscription tier for user
**Returns**: TEXT ('free', 'pro', 'agency', 'admin')

### `check_rate_limit(api_key TEXT)`
**Purpose**: Check if API key has exceeded rate limit
**Returns**: BOOLEAN

### `update_updated_at_column()`
**Purpose**: Auto-update `updated_at` timestamp
**Trigger**: BEFORE UPDATE on `users`, `subscriptions`, `marketplace_accounts`, `queued_operations`

---

## 📈 Views

### `active_subscriptions`
```sql
SELECT
  s.id, s.user_id, u.email, s.tier,
  s.stripe_customer_id, s.stripe_subscription_id,
  s.current_period_end, s.payment_status, s.cancel_at_period_end
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE s.is_active = true;
```

### `user_activity_summary`
```sql
SELECT
  u.id, u.email, s.tier,
  COUNT(DISTINCT se.id) AS scraper_events_count,
  COUNT(DISTINCT ds.id) AS deal_scores_count,
  COUNT(DISTINCT ak.id) AS api_keys_count,
  MAX(u.last_seen_at) AS last_seen_at
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.is_active = true
LEFT JOIN scraper_events se ON u.id = se.user_id
LEFT JOIN deal_scores ds ON u.id = ds.user_id
LEFT JOIN api_keys ak ON u.id = ak.user_id AND ak.is_active = true
GROUP BY u.id, u.email, s.tier;
```

### `api_usage_metrics`
```sql
SELECT
  ak.user_id, ak.name, ak.key_prefix,
  COUNT(ul.id) AS total_requests,
  AVG(ul.response_time_ms) AS avg_response_time_ms,
  MAX(ul.created_at) AS last_request_at,
  COUNT(CASE WHEN ul.status_code >= 400 THEN 1 END) AS error_count
FROM api_keys ak
LEFT JOIN usage_logs ul ON ak.id = ul.api_key_id
WHERE ak.is_active = true
GROUP BY ak.user_id, ak.name, ak.key_prefix;
```

---

## 🧪 Testing

### Test 1: Create User and Verify Auto-Setup

```bash
# Create test user via Supabase Dashboard or API
# Verify:
# 1. User profile created in public.users
# 2. Free subscription created in public.subscriptions
# 3. Welcome API key created in public.api_keys
```

### Test 2: Ingest Event

```bash
# Get your API key from database
API_KEY="sk_live_..."

curl -X POST https://your-project.supabase.co/functions/v1/events/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "marketplace": "ebay",
    "event_type": "scrape_completed",
    "payload": {"items_found": 100},
    "duration_ms": 5000,
    "items_scraped": 100,
    "status": "success"
  }'

# Expected: 200 OK with event_id
```

### Test 3: Stripe Webhook

```bash
# Use Stripe CLI to test webhook
stripe listen --forward-to https://your-project.supabase.co/functions/v1/subscriptions-update

# Trigger test event
stripe trigger checkout.session.completed

# Verify subscription updated in database
```

### Test 4: Recalculate Scores

```bash
# Get JWT token
TOKEN="your-jwt-token"

curl -X POST https://your-project.supabase.co/functions/v1/scores/recalculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "marketplace": "ebay"
  }'

# Expected: 200 OK with recalculated_count
```

---

## 🔧 Troubleshooting

### Migration Fails

```bash
# Check current migration status
supabase db remote ls

# Rollback last migration
supabase db reset

# Re-apply migration
supabase db push
```

### Edge Function Deployment Fails

```bash
# Check function logs
supabase functions logs events-ingest --tail

# Redeploy function
supabase functions deploy events-ingest --no-verify-jwt

# Test function locally
supabase functions serve events-ingest
```

### RLS Policy Denies Access

```bash
# Verify user's subscription tier
SELECT tier, is_active FROM subscriptions WHERE user_id = 'user-uuid';

# Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'deal_scores';

# Temporarily disable RLS for testing (NOT recommended in production)
ALTER TABLE deal_scores DISABLE ROW LEVEL SECURITY;
```

### Rate Limit Exceeded

```bash
# Check API key rate limit
SELECT rate_limit_per_minute, requests_count, last_used_at
FROM api_keys WHERE value = 'sk_live_...';

# Reset rate limit counter (manual fix)
UPDATE api_keys SET requests_count = 0 WHERE value = 'sk_live_...';

# Increase rate limit
UPDATE api_keys SET rate_limit_per_minute = 120 WHERE value = 'sk_live_...';
```

---

## 📊 Monitoring

### Query Usage Statistics

```sql
-- Total events by marketplace
SELECT marketplace, COUNT(*) AS count
FROM scraper_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY marketplace
ORDER BY count DESC;

-- Active subscriptions by tier
SELECT tier, COUNT(*) AS count
FROM subscriptions
WHERE is_active = true
GROUP BY tier;

-- Top API keys by usage
SELECT ak.key_prefix, ak.name, COUNT(ul.id) AS requests
FROM api_keys ak
JOIN usage_logs ul ON ak.id = ul.api_key_id
WHERE ul.created_at > NOW() - INTERVAL '24 hours'
GROUP BY ak.key_prefix, ak.name
ORDER BY requests DESC
LIMIT 10;

-- Deal scores distribution
SELECT
  CASE
    WHEN adjusted_score >= 80 THEN 'Excellent'
    WHEN adjusted_score >= 60 THEN 'Good'
    WHEN adjusted_score >= 40 THEN 'Fair'
    ELSE 'Poor'
  END AS score_range,
  COUNT(*) AS count
FROM deal_scores
GROUP BY score_range;
```

---

## 🚀 Production Checklist

- [ ] Database migration applied successfully
- [ ] All 4 edge functions deployed
- [ ] Edge function secrets configured
- [ ] Stripe webhook URL added to Stripe Dashboard
- [ ] RLS policies verified on all tables
- [ ] Test user signup flow
- [ ] Test API key generation
- [ ] Test event ingestion endpoint
- [ ] Test subscription webhook
- [ ] Test score recalculation
- [ ] Monitor edge function logs for errors
- [ ] Set up database backups (Supabase Pro)
- [ ] Configure email service for welcome emails (optional)
- [ ] Set up monitoring alerts for errors

---

## 📚 API Documentation

### Authentication Methods

#### 1. JWT Bearer Token (for authenticated users)
```bash
Authorization: Bearer <jwt-token>
```

#### 2. API Key (for programmatic access)
```bash
x-api-key: sk_live_xxxxx
```

### Example Integration

```typescript
// Client-side (JWT)
const { data, error } = await supabase.functions.invoke("events-ingest", {
  body: {
    marketplace: "ebay",
    event_type: "scrape_completed",
    payload: { items_found: 100 },
    status: "success",
  },
});

// Server-side (API Key)
const response = await fetch(
  "https://your-project.supabase.co/functions/v1/events/ingest",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.MAGNUS_API_KEY,
    },
    body: JSON.stringify({
      marketplace: "ebay",
      event_type: "scrape_completed",
      payload: { items_found: 100 },
    }),
  }
);
```

---

## 🎉 Next Steps

1. **Integrate with Frontend**: Connect Next.js app to Supabase Edge Functions
2. **Add Email Service**: Integrate Resend or SendGrid for transactional emails
3. **Setup Monitoring**: Configure Sentry or LogRocket for error tracking
4. **Performance Optimization**: Add indexes for frequently queried columns
5. **Scale**: Consider database connection pooling (Supabase Pro)

---

**Deployment Complete!** 🚀

Your Supabase infrastructure is now production-ready with:
- ✅ 6 database tables
- ✅ Strict RLS policies
- ✅ 4 edge functions
- ✅ Helper functions and views
- ✅ API key management
- ✅ Rate limiting
- ✅ Stripe integration

**Questions?** Check the [Supabase Documentation](https://supabase.com/docs) or review the migration file.

---

**Last Updated**: December 2, 2024
**Migration File**: `supabase/migrations/0016_launch_infra_pack.sql`
