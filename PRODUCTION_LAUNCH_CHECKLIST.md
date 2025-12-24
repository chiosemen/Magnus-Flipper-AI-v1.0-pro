# 🚀 Production Launch Checklist - Stripe + Supabase

**Project:** Magnus Flipper AI v1.0  
**Launch Date:** TBD  
**Status:** Pre-Launch Preparation  
**Last Updated:** December 24, 2025

---

## 🎯 Overview

This checklist ensures a safe, compliant, and monitored production launch with:
- ✅ Stripe live mode payments
- ✅ Supabase RLS security
- ✅ Zero downtime deployment
- ✅ Full observability

---

## 📋 Phase 1: Pre-Launch Security Audit

### 🔐 Supabase Row Level Security (RLS)

#### Critical Tables That MUST Have RLS

- [ ] **profiles** - User profile data
  - [ ] RLS enabled
  - [ ] Policy: Users can only read/update their own profile
  - [ ] Admin override policy exists

- [ ] **subscriptions** - Stripe subscription data
  - [ ] RLS enabled
  - [ ] Policy: Users can only read their own subscriptions
  - [ ] Service role can write (for webhooks)

- [ ] **saved_searches** - User saved searches
  - [ ] RLS enabled
  - [ ] Policy: Users can CRUD their own searches only

- [ ] **marketplace_listings** - Public listings
  - [ ] RLS enabled OR table is read-only public
  - [ ] Decision documented

- [ ] **api_keys** - User API keys
  - [ ] RLS enabled
  - [ ] Policy: Users can only see their own keys
  - [ ] Keys are hashed/encrypted

- [ ] **usage_logs** - API usage tracking
  - [ ] RLS enabled
  - [ ] Policy: Users can read their own logs only

#### RLS Verification Commands

```bash
# Check which tables have RLS enabled
supabase db remote status

# Or query directly
psql $DATABASE_URL -c "
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
"
```

#### Expected Output
All user-data tables should show `rowsecurity = true`

---

## 💳 Phase 2: Stripe Live Mode Preparation

### 🔑 Stripe Keys Audit

#### Development Keys (Current)
- [ ] Verify you're using `sk_test_...` and `pk_test_...`
- [ ] Confirm test mode in Stripe Dashboard

#### Production Keys (To Add)
- [ ] Obtain `sk_live_...` from Stripe Dashboard
- [ ] Obtain `pk_live_...` from Stripe Dashboard
- [ ] Store in Vercel environment variables (production only)
- [ ] Store in `.env.production.local` (never commit)

#### Environment Variable Matrix

| Variable | Development | Production |
|----------|-------------|------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_test_...` | `whsec_live_...` |

### 🪝 Stripe Webhooks

#### Test Webhook (Current)
- [ ] Webhook endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
- [ ] Events subscribed:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`

#### Production Webhook (To Create)
- [ ] Create new webhook in Stripe Dashboard (Live Mode)
- [ ] Use production URL
- [ ] Copy webhook secret to `STRIPE_WEBHOOK_SECRET` (production)
- [ ] Test webhook with Stripe CLI:

```bash
stripe listen --forward-to https://your-production-domain.vercel.app/api/webhooks/stripe
stripe trigger checkout.session.completed
```

### 💰 Stripe Products & Prices

#### Verify Product IDs
- [ ] Free tier: `price_free_...` (or null)
- [ ] Starter tier: `price_starter_...`
- [ ] Pro tier: `price_pro_...`
- [ ] Elite tier: `price_elite_...`

#### Update Environment Variables
```bash
# Add to Vercel production environment
STRIPE_PRICE_ID_STARTER=price_live_...
STRIPE_PRICE_ID_PRO=price_live_...
STRIPE_PRICE_ID_ELITE=price_live_...
```

### 🧪 Stripe Test Checklist

Before going live, test these flows in **test mode**:

- [ ] User signs up → creates Stripe customer
- [ ] User subscribes to Starter → webhook updates DB
- [ ] User upgrades to Pro → webhook updates DB
- [ ] User downgrades to Starter → webhook updates DB
- [ ] User cancels subscription → webhook updates DB
- [ ] Payment fails → user notified, access revoked
- [ ] Payment succeeds after retry → access restored

---

## 🔒 Phase 3: Supabase Security Hardening

### 🛡️ RLS Policy Templates

#### User Profile Policy
```sql
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

#### Subscription Policy
```sql
-- Users can read their own subscription
CREATE POLICY "Users can read own subscription"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Service role can write (for Stripe webhooks)
-- This is handled by service_role key, no policy needed
```

#### Saved Searches Policy
```sql
-- Users can CRUD their own saved searches
CREATE POLICY "Users can manage own searches"
ON saved_searches FOR ALL
USING (auth.uid() = user_id);
```

### 🔐 Service Role Key Protection

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is ONLY in server-side code
- [ ] Never exposed to client/browser
- [ ] Used only for:
  - Stripe webhook handlers
  - Admin operations
  - Background jobs

### 🧪 RLS Testing

```bash
# Test as anonymous user (should fail)
curl -X GET https://your-project.supabase.co/rest/v1/profiles \
  -H "apikey: YOUR_ANON_KEY"

# Expected: Empty array or 401

# Test as authenticated user (should see own data only)
curl -X GET https://your-project.supabase.co/rest/v1/profiles \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer USER_JWT_TOKEN"

# Expected: Only user's own profile
```

---

## 🚀 Phase 4: Deployment Verification

### ✅ Vercel Production Environment

#### Environment Variables Checklist

```bash
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe (Live Mode)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...

# Feature Flags
NEXT_PUBLIC_ENABLE_PAYMENTS=true
NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS=true

# Monitoring
SENTRY_DSN=https://...
SENTRY_ENVIRONMENT=production
```

#### Verify Environment Variables

```bash
# Check Vercel production environment
vercel env ls --environment production

# Pull production env (for verification only, don't commit)
vercel env pull .env.production.local --environment production
```

### 🧪 Production Smoke Tests

After deployment, test these critical paths:

#### Authentication Flow
- [ ] Sign up with new email
- [ ] Verify email
- [ ] Sign in
- [ ] Sign out
- [ ] Password reset

#### Subscription Flow (Test Mode First!)
- [ ] View pricing page
- [ ] Click "Subscribe to Starter"
- [ ] Stripe Checkout opens
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Subscription created in Stripe
- [ ] Webhook fires
- [ ] Database updated
- [ ] User sees "Starter" tier in UI

#### Data Access (RLS Verification)
- [ ] User A cannot see User B's data
- [ ] User can only modify their own data
- [ ] Admin can see all data (if admin role exists)

---

## 📊 Phase 5: Monitoring & Observability

### 🔍 Logging

- [ ] Stripe webhook logs visible in Vercel
- [ ] Supabase query logs enabled
- [ ] Error tracking configured (Sentry)

### 📈 Metrics to Monitor

#### Stripe Metrics
- [ ] Successful checkouts
- [ ] Failed payments
- [ ] Subscription churn rate
- [ ] MRR (Monthly Recurring Revenue)

#### Supabase Metrics
- [ ] Database connections
- [ ] Query performance
- [ ] RLS policy violations (should be 0)
- [ ] Auth success/failure rate

### 🚨 Alerts to Configure

- [ ] Stripe payment failure → Slack/Email
- [ ] Supabase connection errors → Slack/Email
- [ ] High error rate (>1%) → PagerDuty
- [ ] Webhook delivery failures → Slack

---

## 🎯 Phase 6: Go-Live Checklist

### 🟢 Pre-Launch (T-24 hours)

- [ ] All RLS policies tested and verified
- [ ] Stripe live mode keys added to production
- [ ] Stripe webhook created and tested
- [ ] Production environment variables verified
- [ ] Database migrations applied to production
- [ ] Backup strategy confirmed
- [ ] Rollback plan documented

### 🟡 Launch Day (T-0)

- [ ] Deploy to production
- [ ] Verify deployment health
- [ ] Test one real transaction (small amount)
- [ ] Monitor logs for 1 hour
- [ ] Verify webhook delivery
- [ ] Check database for correct data

### 🔴 Post-Launch (T+24 hours)

- [ ] Review all transactions
- [ ] Check for failed webhooks
- [ ] Verify RLS is blocking unauthorized access
- [ ] Monitor error rates
- [ ] Customer support ready for issues

---

## 🛠️ Emergency Procedures

### 🚨 If Stripe Webhooks Fail

```bash
# Check webhook delivery in Stripe Dashboard
# Resend failed webhooks manually
# Or sync subscriptions from Stripe:

stripe customers list --limit 100 | jq '.data[] | {id, email, subscriptions}'
```

### 🚨 If RLS Blocks Legitimate Access

```sql
-- Temporarily disable RLS (EMERGENCY ONLY)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Fix policy, then re-enable
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### 🚨 Rollback Procedure

```bash
# Revert to previous deployment
vercel rollback

# Or redeploy previous commit
git revert HEAD
git push origin main
```

---

## 📝 Launch Sign-Off

### Required Approvals

- [ ] **Technical Lead:** RLS policies reviewed and approved
- [ ] **Security:** Stripe keys secured, no leaks
- [ ] **Finance:** Stripe live mode authorized
- [ ] **Product:** User flows tested end-to-end
- [ ] **DevOps:** Monitoring and alerts configured

### Launch Decision

- [ ] **GO** - All checks passed, ready to launch
- [ ] **NO-GO** - Issues found, see blockers below

**Blockers (if any):**
- _List any blocking issues here_

---

## 🎄 Post-Launch Success Criteria

### Week 1 Metrics

- [ ] 0 RLS security violations
- [ ] >95% webhook delivery success rate
- [ ] <1% payment failure rate (excluding card declines)
- [ ] 0 critical errors in production

### Month 1 Goals

- [ ] 100+ paying subscribers
- [ ] <5% churn rate
- [ ] >99% uptime
- [ ] Customer satisfaction >4.5/5

---

## 📚 Reference Documentation

- [Stripe Live Mode Checklist](https://stripe.com/docs/keys#test-live-modes)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**🎯 Current Status:** Pre-Launch Preparation  
**🚦 Next Step:** Complete Phase 1 (RLS Audit)  
**🎄 Launch Target:** Q1 2026

---

*Checklist created: December 24, 2025*  
*Review this checklist weekly until launch*

