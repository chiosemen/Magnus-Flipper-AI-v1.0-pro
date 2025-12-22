# Deployment Sequence & Rollback Strategy

**Mission:** Make deployment boring through safety mechanisms
**Principle:** Deploy with confidence, rollback without panic
**Last Updated:** 2025-12-22

---

## Table of Contents

1. [Deployment Units](#deployment-units)
2. [Blast Radius Analysis](#blast-radius-analysis)
3. [Deployment Order](#deployment-order)
4. [Rollback Mechanisms](#rollback-mechanisms)
5. [Kill-Switch Matrix](#kill-switch-matrix)
6. [Deploy-Without-Fear Checklist](#deploy-without-fear-checklist)
7. [Ship/Hold Decision Criteria](#shiphold-decision-criteria)
8. [What NOT to Do](#what-not-to-do)

---

## Deployment Units

### Unit 1: Web Application (`apps/web`)

**Platform:** Vercel (Next.js)
**Role:** User-facing UI, API routes, admin dashboards
**Dependencies:**
- Supabase (read/write)
- Redis (rate limiting)
- External APIs (Apify, marketplace APIs)

**Deployment Method:** Git push to `main` → Vercel auto-deploy
**Health Check:** `https://app.example.com/api/health`
**Rollback:** Vercel instant rollback to previous deployment

---

### Unit 2: Worker Scheduler (`apps/worker-scheduler`)

**Platform:** Container App / Docker
**Role:** Orchestrates scraping jobs, manages Elite pools, dispatches alerts
**Dependencies:**
- Supabase (read/write)
- Prisma (database ORM)
- BullMQ/Redis (job queue)

**Deployment Method:** Docker build → Container registry → Deploy
**Health Check:** `/health` endpoint or heartbeat table
**Rollback:** Redeploy previous container image tag

---

### Unit 3: Worker Realtime (`apps/worker-realtime`)

**Platform:** Container App / Docker
**Role:** Real-time scraping for high-frequency marketplaces
**Dependencies:**
- Supabase (write-heavy)
- BullMQ/Redis (job queue)
- Marketplace APIs (Facebook, eBay, etc.)

**Deployment Method:** Docker build → Container registry → Deploy
**Health Check:** `/health` endpoint, readiness checks
**Rollback:** Redeploy previous container image tag

---

### Unit 4: Worker Scraper (`apps/worker-scraper`)

**Platform:** Azure Functions
**Role:** On-demand scraping triggered by scheduler
**Dependencies:**
- Supabase (write)
- Marketplace APIs

**Deployment Method:** Azure Functions deploy
**Health Check:** `GET /api/scraper/health`
**Rollback:** Azure Functions slot swap or previous deployment

---

### Unit 5: Worker Alerts (`apps/worker-alerts`)

**Platform:** Container App / Docker
**Role:** Anomaly detection, alert dispatch (email, SMS, push)
**Dependencies:**
- Supabase (read)
- Mailgun/Twilio (email/SMS)
- ML client (optional)

**Deployment Method:** Docker build → Container registry → Deploy
**Health Check:** `/health` endpoint
**Rollback:** Redeploy previous container image tag

---

### Unit 6: Worker Tracker (`apps/worker-tracker`)

**Platform:** Azure Functions
**Role:** Deal tracking, price change detection
**Dependencies:**
- Supabase (read/write)

**Deployment Method:** Azure Functions deploy
**Health Check:** `GET /api/tracker/health`
**Rollback:** Azure Functions slot swap

---

### Unit 7: Worker Autosell (`apps/worker-autosell`)

**Platform:** Azure Functions
**Role:** Automated selling, cross-platform locking
**Dependencies:**
- Supabase (read/write)
- Marketplace APIs (for listing)

**Deployment Method:** Azure Functions deploy
**Health Check:** `GET /api/autosell/health`
**Rollback:** Azure Functions slot swap

---

## Blast Radius Analysis

### Web Application

**Blast Radius:** HIGH (user-facing)
**Impact if Down:**
- ❌ Users cannot access UI
- ❌ Admin controls unavailable
- ❌ API endpoints return 5xx
- ✅ Workers continue running (independent)
- ✅ Alerts still dispatch (worker-alerts independent)

**Affected Users:** ALL users
**Recovery Time:** 1-5 minutes (Vercel instant rollback)

---

### Worker Scheduler

**Blast Radius:** MEDIUM-HIGH (orchestration layer)
**Impact if Down:**
- ❌ No new scraping jobs dispatched
- ❌ Elite pool activation paused
- ❌ Alert delivery worker paused
- ✅ UI remains functional (read-only data)
- ✅ Existing scraped data still visible
- ✅ Realtime worker continues (if already running jobs)

**Affected Users:** Indirectly all users (stale data after ~30 min)
**Recovery Time:** 5-10 minutes (redeploy container)

---

### Worker Realtime

**Blast Radius:** MEDIUM (data freshness)
**Impact if Down:**
- ❌ Real-time scraping stops
- ❌ Deal feed stops updating
- ✅ UI remains functional (shows stale data)
- ✅ Scheduler continues (can dispatch backup scrapers)
- ✅ Pooled deals still visible (not fresh)

**Affected Users:** Users relying on fresh deals (premium tier)
**Recovery Time:** 5-10 minutes (redeploy container)

---

### Worker Scraper

**Blast Radius:** MEDIUM (data freshness)
**Impact if Down:**
- ❌ On-demand scraping fails
- ❌ Scheduler cannot dispatch scrape jobs
- ✅ UI remains functional (stale data)
- ✅ Realtime worker can compensate (if healthy)

**Affected Users:** Users with saved searches (delayed updates)
**Recovery Time:** 5-10 minutes (Azure Functions redeploy)

---

### Worker Alerts

**Blast Radius:** LOW (notifications only)
**Impact if Down:**
- ❌ Users don't receive deal alerts
- ❌ Anomaly detection paused
- ✅ UI remains functional
- ✅ Scraping continues
- ✅ Deals are still discovered (alerts queued)

**Affected Users:** Users with alert preferences enabled
**Recovery Time:** 5-10 minutes (redeploy container)

---

### Worker Tracker

**Blast Radius:** LOW (tracking only)
**Impact if Down:**
- ❌ Price change tracking paused
- ❌ Deal status updates delayed
- ✅ UI remains functional
- ✅ Scraping continues
- ✅ New deals still discovered

**Affected Users:** Users tracking specific deals
**Recovery Time:** 5-10 minutes (Azure Functions redeploy)

---

### Worker Autosell

**Blast Radius:** LOW (automated selling only)
**Impact if Down:**
- ❌ Automated selling paused
- ❌ Cross-platform locking disabled
- ✅ UI remains functional
- ✅ Scraping continues
- ✅ Manual selling still works

**Affected Users:** Users with autosell enabled (power users)
**Recovery Time:** 5-10 minutes (Azure Functions redeploy)

---

## Deployment Order

**Principle:** Deploy least-risky (low blast radius) first, highest-risky (user-facing) last.

**Rationale:** If a worker deployment breaks, users don't see it. If web deployment breaks, everyone sees it.

### Sequence

```
1. Worker Autosell    (lowest risk, fewest dependencies)
   ↓
2. Worker Tracker     (low risk, independent)
   ↓
3. Worker Alerts      (medium risk, affects notifications)
   ↓
4. Worker Scraper     (medium risk, affects data freshness)
   ↓
5. Worker Realtime    (medium-high risk, affects live data)
   ↓
6. Worker Scheduler   (high risk, orchestration layer)
   ↓
7. Web Application    (highest risk, user-facing)
```

### Deployment Gaps

**Wait Time Between Deployments:** 5-10 minutes

**Why:** Allows each worker to stabilize, emit metrics, and prove health before deploying the next.

**Canary Signals:**
- Worker health endpoint returns 200
- No errors in logs for 5 minutes
- Metrics show normal operation (p95 latency, error rate <1%)

---

## Rollback Mechanisms

**CRITICAL RULE:** Rollback MUST NOT require code changes or redeployments.

**Rollback Strategies (in order of preference):**

### 1. Feature Flag Toggle (Instant, Zero Downtime)

**Mechanism:** Runtime kill-switch via Supabase `admin_controls` table

**Example:**
```sql
-- Disable all scraping (no code deploy needed)
UPDATE admin_controls SET disable_all_scraping = true;

-- Wait 1-5 min for workers to read flag and self-throttle
```

**Affected Units:**
- Worker Scheduler
- Worker Realtime
- Worker Scraper

**Recovery Time:** 1-5 minutes (eventual consistency)

---

### 2. Vercel Instant Rollback (1-5 minutes)

**Mechanism:** Vercel dashboard → Previous deployment → "Promote"

**Affected Units:**
- Web Application

**Steps:**
1. Go to Vercel dashboard
2. Find previous successful deployment
3. Click "Promote to Production"
4. Wait 1-2 minutes for propagation

**Recovery Time:** 1-5 minutes

---

### 3. Container Image Rollback (5-10 minutes)

**Mechanism:** Redeploy previous tagged Docker image

**Affected Units:**
- Worker Scheduler
- Worker Realtime
- Worker Alerts

**Steps:**
1. Identify previous stable image tag (e.g., `v1.2.3`)
2. Update deployment manifest to use previous tag
3. Deploy
4. Wait for health check

**Recovery Time:** 5-10 minutes

---

### 4. Azure Functions Slot Swap (5-10 minutes)

**Mechanism:** Azure Functions staging slot swap

**Affected Units:**
- Worker Scraper
- Worker Tracker
- Worker Autosell

**Steps:**
1. Go to Azure Functions dashboard
2. Navigate to Deployment Slots
3. Swap staging ↔ production
4. Wait for health check

**Recovery Time:** 5-10 minutes

---

## Kill-Switch Matrix

**Purpose:** Runtime control over features WITHOUT code deployment

**Never-Disappear Contract:** Kill switches disable BEHAVIOR, NOT VISIBILITY. UI sections remain visible with disabled states.

### Primary Kill Switches (ACTIVE - Backend Integrated)

| Switch Name | Table | Column | Scope | Effect | UI Behavior |
|-------------|-------|--------|-------|--------|-------------|
| **Global Scraping Kill** | `admin_controls` | `disable_all_scraping` | All workers | Stops all scraping globally | Sections show "Scraping paused" message |
| **Facebook Scraping** | `admin_controls` | `disable_marketplace_facebook` | Facebook workers | Stops Facebook scraping | Facebook section shows "Temporarily paused" |
| **Cars.com Scraping** | `admin_controls` | `disable_marketplace_cars` | Cars.com workers | Stops Cars.com scraping | Cars section shows "Temporarily paused" |
| **Rate Multiplier** | `admin_controls` | `global_rate_multiplier` | All workers | Throttles scraping speed | No visible change (behind-the-scenes) |

**Access:** `/app/dashboard` → Admin Controls Panel (requires admin role)

**Propagation Time:** 1-5 minutes (workers poll on next cycle)

---

### Secondary Kill Switches (UI-ONLY - Not Connected)

| Switch Name | Component | Status | Scope | Effect |
|-------------|-----------|--------|-------|--------|
| **Pause All Apify** | `ApifyKillSwitches` | UI-only | Apify scrapers | ❌ Not implemented |
| **Pause Budget Exceeded** | `ApifyKillSwitches` | UI-only | Apify scrapers | ❌ Not implemented |

**Status:** These switches exist in UI but have no backend logic. Toggling them does nothing except update local state.

**Action Required:** Implement backend integration in Phase 1 optimization.

---

### Feature Flags (Environment Variables)

| Flag | Scope | Effect | Rollback |
|------|-------|--------|----------|
| `NEXT_PUBLIC_SHOW_CAR_FLIPPER` | Web UI | Shows/hides car flipper section | Toggle env var, redeploy |
| `NODE_ENV=development` | All | Enables debug logs, mock data | N/A (not for production) |

**Limitation:** Environment variables require redeploy to change. Use Supabase kill switches for instant rollback.

---

### Kill-Switch Behavior Matrix

| Switch Enabled | Scraping | UI Visibility | Data Access | Alerts |
|----------------|----------|---------------|-------------|--------|
| `disable_all_scraping=true` | ❌ Stopped | ✅ Visible (disabled state) | ✅ Read existing data | ❌ Paused (no new alerts) |
| `disable_marketplace_facebook=true` | ❌ Facebook only | ✅ Facebook section visible | ✅ Read existing Facebook data | ❌ Facebook alerts paused |
| `global_rate_multiplier=0.5` | ⚡ Slowed (50% speed) | ✅ No change | ✅ No change | ✅ Continues (slower) |

**Key Principle:** Users ALWAYS see sections. Disabled sections show explanatory messages, not blank spaces.

---

## Deploy-Without-Fear Checklist

### Pre-Deploy Checks

#### ✅ Code Quality

- [ ] All tests pass (`pnpm test`)
- [ ] Type checks pass (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] UI governance checks pass (`.github/workflows/ui-governance.yml`)
- [ ] No `console.error` in production code (except observability)

#### ✅ Observability

- [ ] Phase 0 metrics instrumented (if applicable)
- [ ] Error tracking enabled (Sentry or equivalent)
- [ ] Health check endpoints functional (`/health`, `/api/health`)
- [ ] Logs structured (JSON in production)

#### ✅ Feature Flags

- [ ] New features behind feature flags (if risky)
- [ ] Kill switches accessible via admin panel
- [ ] Never-Disappear contract enforced (sections always render)

#### ✅ Database

- [ ] Migrations tested in staging
- [ ] No destructive migrations (no DROP, no data loss)
- [ ] Indexes created before heavy queries
- [ ] Rollback plan for schema changes (if applicable)

#### ✅ Dependencies

- [ ] External APIs stable (Apify, marketplaces)
- [ ] Redis/Supabase/Queue healthy
- [ ] No breaking changes in package updates

---

### During Deploy: Canary Signals

**Monitor these signals for 5-10 minutes BEFORE deploying next unit:**

#### ✅ Health Checks

- [ ] Health endpoint returns 200
- [ ] Worker heartbeat table updated (if applicable)
- [ ] No crash loops in logs

#### ✅ Metrics (Phase 0)

- [ ] Error rate <1% (tolerate small spike on deploy)
- [ ] p95 latency within baseline (±20%)
- [ ] Request count matches expected traffic
- [ ] No sudden spike in errors

#### ✅ Logs

- [ ] No uncaught exceptions
- [ ] No connection errors (Redis, Supabase, queue)
- [ ] No rate limit errors (external APIs)

#### ✅ User Impact

- [ ] No 5xx errors reported
- [ ] UI loads correctly (manual spot check)
- [ ] Critical flows work (login, view deals, admin controls)

---

### Post-Deploy Verification

**After ALL units deployed:**

#### ✅ End-to-End Smoke Test

1. **Web UI:**
   - [ ] Load homepage (`/`)
   - [ ] Load dashboard (`/dashboard`)
   - [ ] Load marketplace pages (`/marketplaces/facebook`)
   - [ ] Verify sections render (loading/empty/error/ready states)

2. **API:**
   - [ ] `/api/deals` returns 200
   - [ ] `/api/metrics` returns JSON
   - [ ] `/api/admin/controls` returns admin controls

3. **Workers:**
   - [ ] Check worker heartbeat table (all workers online)
   - [ ] Verify scraping jobs dispatched (check queue)
   - [ ] Verify deals ingested (check `scraped_listings` table)
   - [ ] Verify alerts dispatched (check `alert_notifications` table)

4. **Admin Controls:**
   - [ ] Toggle `disable_marketplace_facebook` → ON
   - [ ] Wait 5 min, verify Facebook scraping stopped
   - [ ] Toggle → OFF, verify scraping resumed

#### ✅ Rollback Readiness

- [ ] Previous deployment tagged and accessible
- [ ] Kill switches tested (can disable features instantly)
- [ ] Rollback steps documented and rehearsed

---

### Continuous Monitoring (First 24 Hours)

**Set up alerts for:**
- Error rate >2%
- p95 latency >2x baseline
- Worker heartbeat stale (>5 min since last update)
- Scraping jobs failing (>10% failure rate)

**Check every 2 hours for first 24 hours:**
- Metrics dashboard (scraper, rate limit, DB, API)
- Error logs (Sentry or equivalent)
- User complaints (support tickets, Discord)

---

## Ship/Hold Decision Criteria

### ✅ Ship (Green Light)

**Criteria:**
1. All pre-deploy checks pass
2. Staging deploy successful (no errors for 1 hour)
3. Canary signals green for 10 minutes
4. No critical bugs reported in staging
5. Kill switches tested and functional
6. Rollback plan documented

**Risk Level:** LOW
**Action:** Proceed with deployment

---

### ⚠️ Ship with Caution (Yellow Light)

**Criteria:**
1. Most pre-deploy checks pass, minor issues acceptable
2. Staging has small errors (<1% error rate)
3. Canary signals mostly green (p95 latency +10% acceptable)
4. Kill switches ready but not tested recently
5. Rollback plan exists but not rehearsed

**Risk Level:** MEDIUM
**Action:**
- Deploy during low-traffic hours (2-6 AM UTC)
- Have engineer on-call during deploy
- Monitor actively for first hour

---

### 🛑 Hold (Red Light)

**Criteria (ANY of these = HOLD):**
1. Tests failing
2. Staging deploy has >2% error rate
3. External dependencies down (Supabase, Redis, Apify)
4. Major bugs reported in staging
5. Kill switches not functional
6. No rollback plan
7. Schema migration not tested
8. Breaking changes in dependencies

**Risk Level:** HIGH
**Action:** DO NOT DEPLOY

**Fix First:**
- Fix failing tests
- Debug staging errors
- Wait for external dependencies to stabilize
- Test kill switches
- Document rollback plan
- Test schema migration in staging
- Resolve breaking changes

---

## What NOT to Do

### ❌ Don't: Deploy All Units Simultaneously

**Why:** If something breaks, you won't know which unit caused it.

**Instead:** Deploy sequentially (workers first, web last) with 5-10 min gaps.

---

### ❌ Don't: Rely on Redeploy as Rollback

**Why:** Redeployments take 5-10 minutes. Kill switches are instant.

**Instead:** Use feature flags for instant rollback, redeploys as last resort.

---

### ❌ Don't: Hide UI Sections on Failure

**Why:** Violates Never-Disappear contract. Users see blank spaces and panic.

**Instead:** Show disabled state with explanatory message:

```tsx
// ❌ WRONG
{data && <DealsSection deals={data} />}

// ✅ RIGHT
<SectionShell
  state={sectionState}
  renderEmpty={() => <DealsEmptyState message="No deals yet. Check back soon!" />}
  renderError={(err) => <DealsError error={err} />}
  renderReady={(data) => <DealsGrid deals={data} />}
/>
```

---

### ❌ Don't: Deploy During Peak Traffic

**Why:** Increased risk of impacting users. Harder to distinguish deploy issues from load issues.

**Instead:** Deploy during low-traffic hours (2-6 AM UTC) or gradual rollout.

---

### ❌ Don't: Skip Health Checks

**Why:** You won't know if the deployment succeeded until users report errors.

**Instead:** Wait 5-10 min after each deploy, verify health endpoint, check logs.

---

### ❌ Don't: Deploy Untagged Builds

**Why:** Can't rollback to previous version if you don't know which version is deployed.

**Instead:** Always tag Docker images (e.g., `v1.2.3`) and Git commits before deploying.

---

### ❌ Don't: Ignore Canary Signals

**Why:** Small error spikes during deploy can snowball into outages.

**Instead:** If error rate >2% or p95 latency >2x baseline, STOP and investigate.

---

### ❌ Don't: Deploy Without Rollback Plan

**Why:** Panic during incident leads to bad decisions.

**Instead:** Document rollback steps BEFORE deploying. Test them in staging.

---

### ❌ Don't: Assume External Dependencies are Stable

**Why:** Apify, marketplaces, Supabase can have outages.

**Instead:** Check status pages before deploying. If dependencies are down, wait.

---

### ❌ Don't: Deploy Migrations Without Testing

**Why:** Destructive migrations can cause data loss. Slow migrations can lock tables.

**Instead:** Test migrations in staging with production-like data volume. Use `BEGIN; ... ROLLBACK;` to dry-run.

---

## Rollback Playbook

### Scenario 1: Web UI Returns 5xx Errors

**Symptoms:**
- Users report "500 Internal Server Error"
- `/api/health` returns 500
- Logs show uncaught exceptions

**Rollback Steps:**
1. Go to Vercel dashboard
2. Find previous stable deployment (check timestamp before deploy)
3. Click "Promote to Production"
4. Wait 1-2 minutes
5. Verify `/api/health` returns 200
6. Verify UI loads correctly

**Recovery Time:** 1-5 minutes

**Root Cause Analysis:** After rollback, investigate logs to find exception. Fix in development, test in staging, redeploy.

---

### Scenario 2: Scraping Stopped Globally

**Symptoms:**
- No new deals in last 10 minutes
- Worker scheduler heartbeat stale
- Logs show "Connection refused" or queue errors

**Rollback Steps:**
1. Check if kill switch is enabled:
   ```sql
   SELECT disable_all_scraping FROM admin_controls;
   ```
   If `true`, toggle OFF via admin panel.

2. If kill switch is OFF, check worker health:
   ```sql
   SELECT * FROM worker_heartbeat WHERE worker_id = 'scheduler';
   ```

3. If worker is down, redeploy previous container image:
   ```bash
   docker pull registry.example.com/worker-scheduler:v1.2.3
   docker tag registry.example.com/worker-scheduler:v1.2.3 registry.example.com/worker-scheduler:latest
   # Deploy via your deployment tool
   ```

4. Wait 5 min for workers to restart
5. Verify scraping resumed (check `scraped_listings` table for new rows)

**Recovery Time:** 5-10 minutes

---

### Scenario 3: Rate Limit Errors Spiking

**Symptoms:**
- Logs show "429 Too Many Requests"
- Error rate >5%
- Deals not updating for specific marketplace (e.g., Facebook)

**Rollback Steps:**
1. Slow down scraping via rate multiplier:
   ```sql
   UPDATE admin_controls SET global_rate_multiplier = 0.5;
   ```

2. Wait 5 min for workers to read new rate

3. If still seeing 429s, disable marketplace entirely:
   ```sql
   UPDATE admin_controls SET disable_marketplace_facebook = true;
   ```

4. Wait 5 min for workers to stop

5. Investigate why rate limits changed (did marketplace tighten limits? Did our scraping speed increase?)

**Recovery Time:** 5-10 minutes

**Root Cause Analysis:** Check marketplace status page, verify rate limit configs, review recent code changes.

---

### Scenario 4: Database Migration Failed

**Symptoms:**
- Migration script exited with error
- Tables locked (queries timing out)
- Data inconsistency

**Rollback Steps:**
1. **If migration is in-progress:** STOP it immediately:
   ```sql
   -- Find blocking queries
   SELECT * FROM pg_stat_activity WHERE state = 'active';

   -- Kill migration query
   SELECT pg_terminate_backend(pid) WHERE query LIKE '%migration%';
   ```

2. **If migration completed but broke app:** Rollback migration:
   ```bash
   # Prisma example
   npx prisma migrate resolve --rolled-back <migration-name>

   # Manual SQL rollback
   psql -f migrations/rollback-<migration-name>.sql
   ```

3. **If data is corrupted:** Restore from backup:
   ```bash
   # Supabase example
   # Go to Supabase dashboard → Database → Backups → Restore
   ```

**Recovery Time:** 10-30 minutes (depending on database size)

**Prevention:** ALWAYS test migrations in staging with production-like data. Use `BEGIN; ... ROLLBACK;` to dry-run.

---

### Scenario 5: External API Outage (Apify, Marketplace)

**Symptoms:**
- Logs show "Connection timeout" or "502 Bad Gateway"
- Scraping fails for all marketplaces
- External API status page shows outage

**Rollback Steps:**
1. This is NOT a deployment issue. No rollback needed.

2. Disable affected marketplaces to stop error spam:
   ```sql
   -- If Facebook API is down
   UPDATE admin_controls SET disable_marketplace_facebook = true;
   ```

3. Wait for external API to recover (check status page)

4. Re-enable marketplaces:
   ```sql
   UPDATE admin_controls SET disable_marketplace_facebook = false;
   ```

**Recovery Time:** Depends on external vendor (minutes to hours)

---

## Summary

**Deployment Order:**
1. Worker Autosell
2. Worker Tracker
3. Worker Alerts
4. Worker Scraper
5. Worker Realtime
6. Worker Scheduler
7. Web Application

**Rollback Priority:**
1. Feature flag toggle (instant)
2. Vercel rollback (1-5 min)
3. Container image rollback (5-10 min)
4. Azure Functions slot swap (5-10 min)

**Kill Switches:**
- `disable_all_scraping` - Global emergency stop
- `disable_marketplace_*` - Marketplace-specific
- `global_rate_multiplier` - Throttle speed

**Never-Disappear Contract:**
- Sections ALWAYS render
- Kill switches disable behavior, NOT visibility
- Users see disabled states, not blank spaces

**Ship Criteria:**
- Tests pass
- Staging stable
- Canary signals green
- Rollback plan documented

**Deployment is boring when it's safe.**
