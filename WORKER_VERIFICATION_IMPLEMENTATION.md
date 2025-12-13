# Worker Verification Implementation Summary

## Overview

Added lightweight production-safe verification for Facebook and Vinted workers with clear logging and health endpoints. Zero breaking changes, no heavy observability tooling, read-only verification.

---

## 🎯 What Was Added

### 1. Worker Heartbeat Tracking

Both `worker-scheduler` and `worker-realtime` now track:
- Start time
- Last heartbeat timestamp
- Job statistics (searches scanned, listings fetched, matches saved)
- Total jobs processed
- Last success timestamps

**Exposed via:** `GET /health` on each worker

### 2. Enhanced Job Logging

Facebook and Vinted jobs now log:
- ✅ **Job Start:** `🔵 Facebook job START` / `🟣 Vinted job START`
- ✅ **Search Processing:** Shows each search being processed with keywords
- ✅ **Listings Fetched:** Shows count per search
- ✅ **Matches Saved:** Shows matches per search
- ✅ **Job Complete:** Shows total summary with duration
- ❌ **Errors:** Clear error markers

### 3. Unified Health API

**Endpoint:** `GET /api/health/workers`

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-13T12:05:30.000Z",
  "marketplaces": {
    "facebook": {
      "status": "live",
      "lastSuccess": "2025-12-13T12:05:30.000Z",
      "lastSuccessAgo": 45,
      "lastSuccessAgoHuman": "45s ago",
      "recentListings": 23
    },
    "vinted": {
      "status": "live",
      "lastSuccess": "2025-12-13T12:04:15.000Z",
      "lastSuccessAgo": 120,
      "lastSuccessAgoHuman": "2m ago",
      "recentListings": 18
    }
  },
  "summary": {
    "live": 2,
    "stale": 0,
    "offline": 0,
    "total": 2
  }
}
```

**Status Logic:**
- `"live"` = Listings fetched in last 10 minutes (workers actively running)
- `"stale"` = Listings fetched in last hour (workers slow or rate-limited)
- `"offline"` = No listings in last hour (workers down)

---

## 📁 Files Modified

### Workers
1. **`apps/worker-scheduler/src/index.ts`**
   - Added `workerHeartbeat` object tracking Facebook/Vinted job stats
   - Enhanced `/health` endpoint to return heartbeat data
   - Improved job logging with clear start/complete markers

2. **`apps/worker-scheduler/src/facebook-job.ts`**
   - Added structured logging with emojis for easy scanning
   - Added job duration tracking
   - Clear start/complete/error markers

3. **`apps/worker-scheduler/src/vinted-job.ts`**
   - Added structured logging with emojis for easy scanning
   - Added job duration tracking
   - Clear start/complete/error markers

4. **`apps/worker-realtime/src/index.ts`**
   - Added `workerHeartbeat` object tracking job processing
   - Enhanced `/health` endpoint to return heartbeat data
   - Improved logging for job processing and listing hydration

### API
5. **`apps/web/app/api/health/workers/route.ts`**
   - Enhanced to show overall status (`healthy`, `degraded`, `warning`)
   - Added human-readable time format (`45s ago`, `2m ago`)
   - Added summary statistics (live/stale/offline counts)

### Documentation
6. **`docs/WORKER_VERIFICATION_GUIDE.md`** (NEW)
   - Comprehensive guide for verifying workers in production
   - 60-second health check instructions
   - Troubleshooting steps
   - Azure CLI commands

7. **`docs/WORKER_VERIFICATION_QUICKSTART.sh`** (NEW)
   - Automated verification script
   - Color-coded output
   - Checks API health endpoint
   - Falls back to Azure CLI checks if needed

---

## ⚡ 60-Second Verification

### Option 1: API (Fastest)

```bash
curl https://flipperagents.com/api/health/workers | jq
```

**Decision:**
- ✅ `"status": "healthy"` + both marketplaces `"live"` → **Workers are ALIVE**
- ❌ `"status": "degraded"` or any marketplace `"offline"` → **Workers are DOWN**

### Option 2: Automated Script

```bash
cd docs
./WORKER_VERIFICATION_QUICKSTART.sh
```

Output:
```
🔍 Magnus Flipper AI - Worker Verification
==========================================

📡 Checking worker health via API...

✅ Overall Status: HEALTHY

📊 Marketplace Status:

  🔵 Facebook: LIVE (last success: 45s ago, recent listings: 23)
  🟣 Vinted: LIVE (last success: 2m ago, recent listings: 18)

==========================================

🎉 All workers are LIVE and processing jobs!
```

### Option 3: Direct Worker Health Check

```bash
# Get scheduler health (includes Facebook/Vinted stats)
curl "https://$(az containerapp show --name mf-worker-scheduler -g magnus-rg --query properties.configuration.ingress.fqdn -o tsv)/health" | jq
```

---

## 🔍 Log Verification

### Check Facebook Job Logs

```bash
az containerapp logs show \
  --name mf-worker-scheduler \
  --resource-group magnus-rg \
  --tail 50 | grep -E "Facebook Job|🔵"
```

**Expected:**
```
[worker-scheduler-001] 🔵 Facebook job START
[Facebook Job] 🔵 === FACEBOOK JOB START ===
[Facebook Job] 📊 Processing 5 active Facebook searches
[Facebook Job] 🔍 Search "iPhone 12" (ID: abc123)
[Facebook Job]    └─ Keywords: iphone 12, iphone12
[Facebook Job]    └─ 📦 Fetched 23 listings
[Facebook Job]    └─ 💾 Saved 8 matches
[Facebook Job] ✅ === FACEBOOK JOB COMPLETE === (12.45s)
[Facebook Job] 📊 Summary: 5 searches scanned | 23 listings fetched | 8 matches saved
[worker-scheduler-001] ✅ Facebook job COMPLETE: 5 searches, 23 listings, 8 matches
```

### Check Vinted Job Logs

```bash
az containerapp logs show \
  --name mf-worker-scheduler \
  --resource-group magnus-rg \
  --tail 50 | grep -E "Vinted Job|🟣"
```

**Expected:**
```
[worker-scheduler-001] 🟣 Vinted job START
[Vinted Job] 🟣 === VINTED JOB START ===
[Vinted Job] 📊 Processing 3 active Vinted searches
[Vinted Job] 🔍 Search "Nike sneakers" (ID: def456)
[Vinted Job]    └─ Keywords: nike, sneakers
[Vinted Job]    └─ 📦 Fetched 18 listings
[Vinted Job]    └─ 💾 Saved 5 matches
[Vinted Job] ✅ === VINTED JOB COMPLETE === (8.23s)
[Vinted Job] 📊 Summary: 3 searches scanned | 18 listings fetched | 5 matches saved
[worker-scheduler-001] ✅ Vinted job COMPLETE: 3 searches, 18 listings, 5 matches
```

---

## 🚨 Troubleshooting

### Workers Show "Offline"

1. **Check Azure status:**
   ```bash
   az containerapp list -g magnus-rg --query "[?contains(name, 'worker')].{Name:name, Status:properties.runningStatus}" -o table
   ```

2. **Restart workers:**
   ```bash
   az containerapp restart --name mf-worker-scheduler -g magnus-rg
   az containerapp restart --name mf-worker-realtime -g magnus-rg
   ```

3. **Check environment variables:**
   ```bash
   az containerapp show --name mf-worker-scheduler -g magnus-rg --query "properties.template.containers[0].env" -o table
   ```

   Required: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### Logs Show Errors

```bash
# Get error logs
az containerapp logs show --name mf-worker-scheduler -g magnus-rg --tail 100 | grep -i error
```

**Common errors:**
- `Prisma Client initialization error` → Check DATABASE_URL
- `ECONNREFUSED` → Check Supabase connectivity
- `Rate limit exceeded` → Expected, workers will retry

### No Active Searches

If logs show:
```
[Facebook Job] ⚠️ No active Facebook searches found - nothing to process
```

This is **expected** if users haven't created searches yet. Workers are running correctly.

---

## ✅ Success Confirmation

### You'll know workers are ALIVE if:

1. ✅ `GET /api/health/workers` returns:
   ```json
   {
     "status": "healthy",
     "marketplaces": {
       "facebook": { "status": "live" },
       "vinted": { "status": "live" }
     }
   }
   ```

2. ✅ Logs show job completion within last 15 minutes:
   ```
   [Facebook Job] ✅ === FACEBOOK JOB COMPLETE === (12.45s)
   [Vinted Job] ✅ === VINTED JOB COMPLETE === (8.23s)
   ```

3. ✅ Database has recent listings:
   ```sql
   SELECT marketplace, COUNT(*), MAX(last_seen)
   FROM listings
   WHERE last_seen > NOW() - INTERVAL '15 minutes'
   GROUP BY marketplace;
   ```

### You'll know workers are DOWN if:

1. ❌ `/api/health/workers` shows `"offline"`
2. ❌ No logs in last 15 minutes
3. ❌ Azure shows `Status: Stopped`
4. ❌ No recent listings in database

---

## 📊 Production Commands

```bash
# Quick health check
curl https://flipperagents.com/api/health/workers | jq '.status'

# Run automated verification
./docs/WORKER_VERIFICATION_QUICKSTART.sh

# Tail logs (Facebook/Vinted jobs)
az containerapp logs show --name mf-worker-scheduler -g magnus-rg --follow

# Check worker status
az containerapp list -g magnus-rg --query "[?contains(name, 'worker')].{Name:name, Status:properties.runningStatus}" -o table

# Restart if needed
az containerapp restart --name mf-worker-scheduler -g magnus-rg
```

---

## 🎯 Deployment Info

**Platform:** Azure Container Apps  
**Resource Group:** `magnus-rg`  
**Environment:** `magnus-flipper-env`

**Workers:**
- `mf-worker-scheduler` - Runs Facebook/Vinted scraping jobs every 10 minutes
- `mf-worker-realtime` - Processes real-time hydration jobs

**Deployment:** Automated via `.github/workflows/azure-workers.yml`

---

## 🔐 Constraints Met

✅ **No heavy observability tooling** - Only lightweight JSON endpoints  
✅ **No infra refactors** - Workers remain in Azure Container Apps  
✅ **No breaking changes** - Backward compatible, only additions  
✅ **Read-only verification** - All checks are read-only  
✅ **Production-safe** - No database writes, no side effects  

---

## 📚 Next Steps

1. **Set up automated monitoring:**
   - GitHub Action to check `/api/health/workers` every 5 minutes
   - Send alerts to Slack/email on failures

2. **Create dashboard widget:**
   - Display real-time worker status
   - Show recent job statistics

3. **Add metrics:**
   - Track job duration over time
   - Monitor rate limit hits
   - Alert on high error rates

---

## 📞 Support

**Documentation:**
- Full guide: `docs/WORKER_VERIFICATION_GUIDE.md`
- Quick script: `docs/WORKER_VERIFICATION_QUICKSTART.sh`

**Health Endpoints:**
- API: `https://flipperagents.com/api/health/workers`
- Scheduler: `https://<scheduler-fqdn>/health`
- Realtime: `https://<realtime-fqdn>/health`

**Logs:**
- Azure Portal: Container Apps → mf-worker-scheduler → Log stream
- CLI: `az containerapp logs show --name mf-worker-scheduler -g magnus-rg --follow`

---

**Implementation Date:** 2025-12-13  
**Status:** ✅ Complete and ready for production verification
