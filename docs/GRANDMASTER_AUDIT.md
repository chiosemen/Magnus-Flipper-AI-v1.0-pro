# Grandmaster Audit — Market Agent Readiness

Date: 2025-01-06

## Critical issues (RED — must fix before investor)

- Stripe webhook used TODO placeholders, did not map Stripe customer to user, and had no idempotency. This risked duplicate entitlements and inconsistent access.
- Usage metering was a stub (no DB inserts or rollups). Limits could not be enforced and usage could be bypassed.
- `/api/demo` used a hardcoded user ID, allowed requests without entitlement checks, and could leave locks stuck on failure.
- Missing runtime env validation for paid flows (Stripe + Redis) meant silent failures or false success.

## Medium issues (YELLOW — fix soon)

- Market Agent usage in `/api/usage` was placeholder data instead of real rollups.
- Out-of-order Stripe events could overwrite newer states.
- Usage uniqueness and billable vs non-billable runs were not tracked.

## Low issues (GREEN — nice to have)

- Documentation implied always-200 responses for errors; audit now enforces proper HTTP status codes.
- Audit logging lacked request IDs and structured payloads.

## Verification steps

1) Apply migrations:
   - `supabase/migrations/20260101000000_market_agent_usage.sql`
   - `supabase/migrations/20260201000000_market_agent_audit.sql`

2) Set required env vars (API):
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_MARKET_AGENT`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `APIFY_TOKEN` (only required when Gumtree Apify actor is enabled)

3) Run automated audit checks:
   - `pnpm -w audit:market-agent`

4) Manual checks:
   - Stripe webhook:
     - Send a subscription.updated event (Stripe CLI) and confirm:
       - `profiles.market_agent_enabled` updates
       - `stripe_webhook_events` has the event
   - Market Agent:
     - `GET /api/demo?mode=search&q=macbook&marketplace=facebook&demo=true`
       - Expect HTTP 200 with results, no 5xx
     - `GET /api/demo?mode=search&q=macbook&marketplace=facebook`
       - Expect 401 without auth token

## Audit changes applied

- Stripe webhook now validates env, stores event IDs, ignores duplicates, handles out-of-order events, and maps Stripe IDs to user IDs before updating entitlements.
- Usage metering now writes to `market_agent_usage_events`, uses atomic rollups, and enforces limits from rollups.
- `/api/demo` now requires auth + entitlement unless `demo=true`, validates input, releases locks in `finally`, and returns correct HTTP status codes.
- `/api/usage` now exposes real Market Agent usage and entitlement state.

