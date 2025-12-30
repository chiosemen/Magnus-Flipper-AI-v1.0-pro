# Magnus Market Agent - Billing & Usage

## Overview

Magnus Market Agent is a paid tier providing autonomous market observation with freshness & verification signals. This document covers billing integration, usage metering, and entitlement management.

## Environment Variables

### Required

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Market Agent Product IDs
STRIPE_PRICE_MARKET_AGENT=price_...          # Solo monthly (£79/mo)
STRIPE_PRICE_MARKET_AGENT_SEAT=price_...     # Team seat (optional, £39/seat/mo)

# Redis (already configured)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Database (Supabase/Postgres)
DATABASE_URL=postgresql://...
```

## Stripe Setup

### 1. Create Product

**Product Name**: Magnus Market Agent  
**Description**: Autonomous market observation with freshness and verification signals.

### 2. Create Prices

**Monthly (Solo)**
- Price ID: `price_market_agent_monthly`
- Amount: £79.00 GBP
- Billing: Recurring · Monthly
- Description: Persistent market observation with Live Capture, VERIFIED listings, freshness indicators, and priority agent routing.

**Annual (Solo) - Optional**
- Price ID: `price_market_agent_annual`
- Amount: £758.40 GBP (20% discount)
- Billing: Recurring · Yearly

**Team Seat - Optional**
- Price ID: `price_market_agent_seat`
- Amount: £39.00 GBP per seat
- Billing: Recurring · Monthly
- Minimum quantity: 3 seats

### 3. Configure Webhook

**Endpoint**: `https://your-domain.com/api/stripe/webhook`

**Events to send**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.payment_succeeded`

## Database Schema

Run migration: `supabase/migrations/20260101000000_market_agent_usage.sql`

### Key Tables

**`entitlements`**
- Stores per-user/workspace Market Agent access
- Fields: `market_agent_enabled`, `market_agent_status`, `grace_until`
- Status values: active, trialing, past_due, unpaid, canceled, inactive, comped

**`entitlement_overrides`**
- Admin comps and kill switches
- Fields: `subject_type`, `subject_id`, `feature`, `mode` (force_on/force_off)

**`market_agent_usage_events`**
- Append-only log of agent activity
- Event types: `deploy`, `refresh_tick`, `seed_ingest`

**`market_agent_usage_rollups_daily`**
- Pre-aggregated daily usage for fast queries
- Tracks: runs, deploys, refresh_ticks, items_returned, unique_queries

## Entitlement Resolution

### Precedence (highest to lowest)

1. **`force_off` override** → Always disabled
2. **Billing status** (from Stripe subscription)
   - `active` or `trialing` → Enabled
   - `past_due` → Enabled if within 7-day grace period
   - `unpaid` or `canceled` → Disabled
3. **`force_on` override** → Enabled (comped accounts)
4. **Default** → Disabled

### Grace Period Policy

- **Duration**: 7 days from first `past_due` event
- **UI Behavior**: Show calm banner: "Payment pending. Market Agent remains active until {date}."
- **After Grace**: Access disabled with message: "Market Agent is paused until billing is updated."

## Usage Metering

### Metrics Tracked

| Metric | Definition | Purpose |
|--------|------------|---------|
| **Agent Runs** | Deploy + refresh ticks | Rate limiting |
| **Deploys** | Manual "Deploy Agent" actions | Cost attribution |
| **Refresh Ticks** | Auto-refresh polling requests | Background cost |
| **Items Returned** | Total listing items returned | Value/volume |
| **Unique Queries** | Distinct query_norm per day | Diversity metric |

### Default Limits (Solo £79/mo)

```typescript
{
  runsPerDay: 250,           // Deploy + refresh ticks combined
  minRefreshSeconds: 60,     // Fastest auto-refresh interval
  maxItemsPerDay: 20000      // Total items returned per day
}
```

### Limit Enforcement

**Location**: `apps/api/api/demo.ts` (when `mode=agent` or `mode=refresh`)

**Behavior**:
- Always returns HTTP 200 (never 429)
- On limit exceeded: `{ items: [], meta: { cacheStatus: "error-soft", note: "Usage limit reached for this billing period." } }`
- UI shows calm notice: "Daily usage limit reached. Resets at midnight UTC."

### Logging Events

**Location**: `apps/api/lib/marketAgentUsage.ts`

```typescript
logMarketAgentEvent({
  userId: string,
  workspaceId: string | null,
  eventType: 'deploy' | 'refresh_tick' | 'seed_ingest',
  marketplace: string,
  queryNorm: string,
  itemsReturned: number,
  cacheStatus: string,
  strategy: string,
  latencyMs: number,
});
```

**Triggers**:
- `/api/demo?mode=agent` → `deploy` event
- `/api/demo?mode=refresh` → `refresh_tick` event
- `/api/ingest/browser` → `seed_ingest` event (optional tracking)

## API Contracts

### `/api/usage` Response (Extended)

```json
{
  "todayCu": 42,
  "monthCu": 1250,
  "byMarketplace": [...],
  "recentRuns": [...],
  "policy": {...},
  "features": {
    "marketAgent": {
      "enabled": true,
      "status": "active",
      "graceUntil": null,
      "seatsPurchased": 1,
      "seatsUsed": 1
    }
  },
  "limits": {
    "marketAgent": {
      "runsPerDay": 250,
      "minRefreshSeconds": 60,
      "maxItemsPerDay": 20000
    }
  },
  "usage": {
    "marketAgent": {
      "today": {
        "runs": 42,
        "deploys": 12,
        "refreshTicks": 30,
        "itemsReturned": 845,
        "uniqueQueries": 8
      }
    }
  }
}
```

### `/api/demo` Market Agent Mode

**Request**:
```
GET /api/demo?mode=agent&q=macbook+pro&marketplace=gumtree&country=GB&maxItems=40
```

**Response** (on limit exceeded):
```json
{
  "items": [],
  "meta": {
    "cached": false,
    "cacheStatus": "error-soft",
    "strategy": "none",
    "note": "Usage limit reached for this billing period.",
    "latencyMs": 12
  }
}
```

## Admin Operations

### Comp an Account

```sql
INSERT INTO entitlement_overrides (
  subject_type,
  subject_id,
  feature,
  mode,
  reason,
  expires_at,
  created_by_admin_id
) VALUES (
  'user',
  '<user_uuid>',
  'market_agent',
  'force_on',
  'Investor demo - expires 2026-02-01',
  '2026-02-01 00:00:00+00',
  '<admin_uuid>'
);
```

### Kill Switch (Emergency Disable)

```sql
INSERT INTO entitlement_overrides (
  subject_type,
  subject_id,
  feature,
  mode,
  reason
) VALUES (
  'user',
  '<user_uuid>',
  'market_agent',
  'force_off',
  'Abuse detected - manual review required'
);
```

### View Today's Usage

```sql
SELECT * FROM ma_rollup_today('<user_uuid>', NULL);
```

## UI Integration

### Market Agent Page

**Location**: `apps/web/app/market-agent/page.tsx`

**Mode Parameters**:
- Deploy: `?mode=agent`
- Auto-refresh: `?mode=refresh`

**Components**:
- `MarketAgentGate` - Entitlement check
- `MarketAgentUsageMeter` - Usage display with limits
- `MarketAgentUpgradeModal` - Upgrade flow

### Usage Meter Display

Shows:
- Runs today / daily allowance (progress bar)
- Items returned / daily allowance
- Grace period banner (if past_due)
- Near-limit warning (>80%)
- Stats: unique queries, min refresh interval

## Seat-Based Pricing (Teams)

### Model

- **Solo**: 1 seat = £79/mo
- **Team**: £39/seat/mo (min 3 seats = £117/mo)
- **Desk** (alternative): £199/mo (5 seats included, £29/seat for additional)

### Enforcement

```sql
-- Check seat availability
SELECT 
  market_agent_seats_purchased,
  market_agent_seats_used
FROM entitlements
WHERE subject_type = 'workspace' AND subject_id = '<workspace_uuid>';
```

**UI Behavior**:
- Auto-assign seat on first Market Agent access
- If seats full: "All Market Agent seats are currently in use. Ask your admin to add seats."

## Testing Checklist

- [ ] Stripe webhook receives subscription events
- [ ] Entitlements update correctly (active/past_due/canceled)
- [ ] Grace period works (7 days, UI banner shown)
- [ ] Usage metering logs events
- [ ] Daily rollups calculate correctly
- [ ] Limits enforce softly (200 status, calm message)
- [ ] Usage meter UI displays correctly
- [ ] Admin overrides work (force_on/force_off)
- [ ] Upgrade modal navigates to correct checkout
- [ ] Auto-refresh respects minRefreshSeconds

## Troubleshooting

### Entitlement Not Updating

1. Check webhook delivery in Stripe dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` is correct
3. Check logs: `apps/api/api/stripe/webhook.ts`
4. Manually query: `SELECT * FROM entitlements WHERE stripe_customer_id = '...'`

### Usage Not Recording

1. Verify mode parameter: `?mode=agent` or `?mode=refresh`
2. Check DB insert permissions for `market_agent_usage_events` table
3. Review logs in `apps/api/lib/marketAgentUsage.ts`

### Grace Period Not Working

1. Check `grace_until` timestamp in `entitlements` table
2. Verify subscription status is `past_due` in Stripe
3. Ensure webhook processed `invoice.payment_failed` event

## Migration Path

### Phase 1: Core Infrastructure ✅
- SQL migrations
- Stripe webhook
- `/api/usage` extension
- Usage logging

### Phase 2: UI Polish (Current)
- Usage meter component
- Compare plans table
- Seat management UI

### Phase 3: Advanced Features
- Real-time usage updates (WebSocket)
- Usage analytics dashboard
- Seat assignment UI for team admins
- Webhook retry queue

## Support

For billing issues:
- Check Stripe dashboard: https://dashboard.stripe.com
- Review webhook logs
- Contact: billing@magnusflipper.com (placeholder)

