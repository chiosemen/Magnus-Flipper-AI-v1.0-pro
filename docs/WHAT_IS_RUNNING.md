# What Is Running? - Worker Scheduler Guide

**Purpose:** This document explains what the `worker-scheduler` actually does vs what it logs, preventing confusion forever.

## TL;DR

- **worker-scheduler** = Schedules Elite Pool scraping jobs
- **NOT** a scraper itself - it dispatches jobs to queues
- **Governance** = Economic checks before dispatching
- **Dispatch** = Actually enqueuing jobs (was missing, now fixed)

## Architecture Overview

```
worker-scheduler (schedules)
    ↓
Elite Pool Governance (checks economics)
    ↓
Elite Pool Dispatch (enqueues jobs) ← FIXED
    ↓
ingestQueue (BullMQ)
    ↓
worker-ingestion (processes jobs)
    ↓
Apify/Bulldog (scrapes)
    ↓
scraped_listings (database)
```

## What worker-scheduler Does

### 1. Elite Pool Governance Check

**What it does:**
- Reads `ELITE_SUB_COUNT` and `ELITE_PRICE` env vars
- Gets enabled Elite pools from config
- Calculates coverage ratio (revenue / cost)
- Applies throttle policy (ALLOW, THROTTLE, PAUSE, WARN)
- Returns governance result

**What it logs:**
```
[worker-scheduler] 🛡️  Elite Pool Governance: Starting economic check...
[worker-scheduler] 📊 Elite Config: 10 subscribers @ $29.99/month
[worker-scheduler] 📋 Enabled Elite Pools: fb_phones_us_elite, fb_electronics_us_elite
[worker-scheduler] 💰 Coverage Analysis:
[worker-scheduler]   Monthly Revenue: $299.90
[worker-scheduler]   Monthly Cost: $518.40
[worker-scheduler]   Coverage Ratio: 0.58
[worker-scheduler] 🎯 Policy: PAUSE (coverage ratio < 0.9)
```

**Is it working?** ✅ Yes, but this is just checking, not dispatching.

### 2. Elite Pool Dispatch (FIXED)

**What it does:**
- Takes governed pools (that passed checks)
- Maps pools to scrape jobs (marketplace + query + region)
- Enqueues jobs to `ingestQueue` (BullMQ)
- Returns count of jobs dispatched

**What it logs:**
```
[worker-scheduler] 🚀 Dispatching 2 Elite pool(s)...
[worker-scheduler]   ✅ DISPATCH: fb_phones_us_elite → facebook/US (query: "phones", cadence: 15min)
[worker-scheduler]   ✅ DISPATCH: fb_electronics_us_elite → facebook/US (query: "electronics", cadence: 30min)
[worker-scheduler] ✅ Successfully enqueued 2 Elite pool job(s)
```

**Is it working?** ✅ YES - This was missing before, now fixed!

### 3. Diagnostics

**What it does:**
- Generates comprehensive diagnostics report
- Verifies execution is working (not just logging)
- Detects NOOP behavior

**What it logs:**
```
[worker-scheduler] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[worker-scheduler] 📊 ELITE POOL DIAGNOSTICS
[worker-scheduler] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[worker-scheduler] GOVERNANCE:
[worker-scheduler]   Enabled: ✅
[worker-scheduler]   Allowed: ✅
[worker-scheduler]   Action: ALLOW
[worker-scheduler]   Coverage Ratio: 1.15
[worker-scheduler] POOLS:
[worker-scheduler]   Total: 4
[worker-scheduler]   Enabled: 2
[worker-scheduler]   Active: 2
[worker-scheduler] DISPATCH:
[worker-scheduler]   Jobs Enqueued: 2
[worker-scheduler]   Last Dispatch: 2024-12-19T10:30:00Z
[worker-scheduler] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[worker-scheduler] ✅ Pool execution verified: 2 job(s) dispatched
```

**Is it working?** ✅ YES - This verifies actual execution.

## Common Confusion Points

### "I see governance logs but no jobs are running"

**Before Fix:** Governance checked but dispatch was missing → jobs never enqueued.

**After Fix:** Dispatch is integrated → jobs are enqueued → check diagnostics for verification.

### "How do I know if pools are actually running?"

**Answer:** Check diagnostics output:
- `Jobs Enqueued: > 0` = Jobs were dispatched
- `Last Dispatch: <timestamp>` = When jobs were dispatched
- `verifyPoolExecution()` = Detects NOOP behavior

### "What's the difference between governance and dispatch?"

- **Governance** = Economic checks (can we afford to run pools?)
- **Dispatch** = Actually enqueuing jobs (was missing, now fixed)

### "How do I test in dev mode?"

Set `DEV_POOL_FORCE=true` in `.env.local`:
- Bypasses governance checks
- Dispatches all enabled pools
- Useful for testing dispatch logic

## Verification Checklist

To verify worker-scheduler is working:

1. ✅ **Governance logs appear** - Economic checks running
2. ✅ **Dispatch logs appear** - Jobs being enqueued
3. ✅ **Diagnostics show `Jobs Enqueued > 0`** - Actual execution
4. ✅ **No "Pool execution verification failed" warnings** - Everything working

## Troubleshooting

### Issue: "No active Elite pools to dispatch"

**Cause:** All pools are paused by governance (coverage ratio too low)

**Fix:** 
- Increase `ELITE_SUB_COUNT` env var
- Or set `DEV_POOL_FORCE=true` for dev mode

### Issue: "Pool execution verification failed"

**Cause:** Active pools exist but no jobs dispatched

**Fix:** Check dispatch logic, verify `ingestQueue` is accessible

### Issue: "Governance blocked execution"

**Cause:** Coverage ratio < 1.0 and no pools can be paused

**Fix:** Increase subscriber count or disable some pools

## Summary

- **worker-scheduler** schedules Elite Pool jobs
- **Governance** checks economics (was working)
- **Dispatch** enqueues jobs (was missing, now fixed)
- **Diagnostics** verifies execution (new, prevents confusion)

**Key Takeaway:** Logs ≠ Execution. Diagnostics verify actual execution.

