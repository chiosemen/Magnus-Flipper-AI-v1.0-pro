# Worker Verification Guide: Facebook & Vinted

**Goal:** Verify within 60 seconds that Facebook and Vinted workers are alive and processing jobs in production.

---

## Quick Summary

**Production Deployment:**
- **Platform:** Azure Container Apps
- **Workers:**
  - `mf-worker-scheduler` (runs Facebook & Vinted scraping jobs every 10 minutes)
  - `mf-worker-realtime` (processes real-time hydration jobs)
- **Resource Group:** `magnus-rg`
- **Environment:** `magnus-flipper-env`

---

## ⚡ 60-Second Health Check

### Option 1: API Health Endpoint (Fastest)

```bash
# Check worker health via API
curl https://flipperagents.com/api/health/workers | jq
```

**Expected Output:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-13T...",
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

**Interpretation:**
- ✅ **`"status": "live"`** = Worker fetched listings in last 10 minutes → **ALIVE**
- ⚠️ **`"status": "stale"`** = Listings fetched in last hour but not recently → **SLOW/RATE-LIMITED**
- ❌ **`"status": "offline"`** = No listings in last hour → **DOWN**

**Quick Decision:**
```bash
# One-liner to check if workers are alive
STATUS=$(curl -s https://flipperagents.com/api/health/workers | jq -r '.status')
if [ "$STATUS" = "healthy" ]; then
  echo "✅ Workers are LIVE"
else
  echo "❌ Workers are DOWN or DEGRADED"
fi
```

---

### Option 2: Direct Worker Health Check

Check each worker's internal health endpoint:

```bash
# Get worker FQDNs
SCHEDULER_FQDN=$(az containerapp show \
  --name mf-worker-scheduler \
  --resource-group magnus-rg \
  --query properties.configuration.ingress.fqdn \
  -o tsv)

REALTIME_FQDN=$(az containerapp show \
  --name mf-worker-realtime \
  --resource-group magnus-rg \
  --query properties.configuration.ingress.fqdn \
  -o tsv)

# Check scheduler health (runs Facebook/Vinted jobs)
curl "https://${SCHEDULER_FQDN}/health" | jq

# Check realtime health
curl "https://${REALTIME_FQDN}/health" | jq
```

**Expected Output (worker-scheduler):**
```json
{
  "status": "ok",
  "worker": "worker-scheduler-001",
  "timestamp": "2025-12-13T12:05:30.000Z",
  "scanInterval": 300000,
  "uptime": 3600000,
  "heartbeat": {
    "startTime": "2025-12-13T11:05:30.000Z",
    "lastHeartbeat": "2025-12-13T12:05:30.000Z",
    "facebookJob": {
      "lastRun": "2025-12-13T12:00:00.000Z",
      "lastSuccess": "2025-12-13T12:00:15.000Z",
      "lastStats": {
        "searchesScanned": 5,
        "listingsFetched": 23,
        "matchesSaved": 8
      }
    },
    "vintedJob": {
      "lastRun": "2025-12-13T11:50:00.000Z",
      "lastSuccess": "2025-12-13T11:50:12.000Z",
      "lastStats": {
        "searchesScanned": 3,
        "listingsFetched": 18,
        "matchesSaved": 5
      }
    },
    "totalJobsProcessed": 24
  }
}
```

**Quick Decision:**
- ✅ If `facebookJob.lastSuccess` and `vintedJob.lastSuccess` are within 15 minutes → **ALIVE**
- ❌ If both are `null` or > 30 minutes old → **DOWN**

---

## 📋 Detailed Verification Steps

### Step 1: Check Worker Status

```bash
# Check if workers are running
az containerapp list \
  --resource-group magnus-rg \
  --query "[?contains(name, 'worker')].{Name:name, Status:properties.runningStatus, Replicas:properties.runningStatus}" \
  -o table
```

**Expected:**
```
Name                  Status
--------------------  --------
mf-worker-scheduler   Running
mf-worker-realtime    Running
```

---

### Step 2: Check Worker Logs

#### Facebook Job Logs

```bash
# Get recent logs for Facebook job
az containerapp logs show \
  --name mf-worker-scheduler \
  --resource-group magnus-rg \
  --follow \
  --tail 50 | grep -E "Facebook Job|🔵|✅|❌"
```

**Expected Log Pattern:**
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
[worker-scheduler-001] ✅ Facebook job COMPLETE: 5 searches scanned, 23 listings fetched, 8 matches saved
```

**Red Flags:**
- ❌ No logs in last 15 minutes → Worker is not running
- ❌ Logs show `❌ Facebook scraping job ERROR` → Worker is failing
- ⚠️ Logs show `⚠️ No active Facebook searches found` → No searches configured (expected if users haven't created searches)

#### Vinted Job Logs

```bash
# Get recent logs for Vinted job
az containerapp logs show \
  --name mf-worker-scheduler \
  --resource-group magnus-rg \
  --follow \
  --tail 50 | grep -E "Vinted Job|🟣|✅|❌"
```

**Expected Log Pattern:**
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

### Step 3: Database Verification

```bash
# Check recent listings in database (requires Supabase CLI or psql)
# Example using Supabase:
supabase db query "
SELECT 
  marketplace,
  COUNT(*) as count,
  MAX(last_seen) as last_seen
FROM listings
WHERE last_seen > NOW() - INTERVAL '15 minutes'
  AND marketplace IN ('facebook', 'vinted')
GROUP BY marketplace;
"
```

**Expected:**
```
marketplace | count | last_seen
------------|-------|-------------------------
facebook    | 23    | 2025-12-13 12:05:30
vinted      | 18    | 2025-12-13 12:04:15
```

---

## 🚨 Troubleshooting: Workers Are Down

### Check 1: Worker Replicas

```bash
# Check if workers have running replicas
az containerapp replica list \
  --name mf-worker-scheduler \
  --resource-group magnus-rg \
  -o table
```

**If no replicas:** Restart the worker
```bash
az containerapp restart \
  --name mf-worker-scheduler \
  --resource-group magnus-rg
```

---

### Check 2: Environment Variables

```bash
# Check worker environment variables
az containerapp show \
  --name mf-worker-scheduler \
  --resource-group magnus-rg \
  --query "properties.template.containers[0].env" \
  -o table
```

**Required env vars:**
- `NODE_ENV=production`
- `DATABASE_URL` (Prisma connection)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

### Check 3: Recent Deployments

```bash
# Check recent revisions
az containerapp revision list \
  --name mf-worker-scheduler \
  --resource-group magnus-rg \
  --query "[?properties.active].{Name:name, Active:properties.active, Created:properties.createdTime}" \
  -o table
```

**If deployment failed:** Rollback to previous revision
```bash
az containerapp revision activate \
  --name mf-worker-scheduler \
  --resource-group magnus-rg \
  --revision <previous-revision-name>
```

---

### Check 4: Application Errors

```bash
# Get error logs
az containerapp logs show \
  --name mf-worker-scheduler \
  --resource-group magnus-rg \
  --tail 100 | grep -i error
```

**Common errors:**
- `Prisma Client initialization error` → Check DATABASE_URL
- `ECONNREFUSED` → Check Supabase connectivity
- `Rate limit exceeded` → Workers are running but being throttled (expected, workers will retry)

---

## 📊 Production Commands Cheat Sheet

```bash
# Quick health check (60 seconds)
curl https://flipperagents.com/api/health/workers | jq '.status'

# Check worker status
az containerapp list -g magnus-rg --query "[?contains(name, 'worker')].{Name:name, Status:properties.runningStatus}" -o table

# Tail scheduler logs (Facebook/Vinted jobs)
az containerapp logs show --name mf-worker-scheduler -g magnus-rg --follow --tail 50

# Tail realtime logs
az containerapp logs show --name mf-worker-realtime -g magnus-rg --follow --tail 50

# Restart scheduler worker
az containerapp restart --name mf-worker-scheduler -g magnus-rg

# Restart realtime worker
az containerapp restart --name mf-worker-realtime -g magnus-rg

# Check worker health endpoints
curl https://$(az containerapp show --name mf-worker-scheduler -g magnus-rg --query properties.configuration.ingress.fqdn -o tsv)/health | jq
curl https://$(az containerapp show --name mf-worker-realtime -g magnus-rg --query properties.configuration.ingress.fqdn -o tsv)/health | jq
```

---

## ✅ Success Criteria

**Workers are ALIVE if:**
1. ✅ `GET /api/health/workers` returns `"status": "healthy"`
2. ✅ Both Facebook and Vinted show `"status": "live"`
3. ✅ Worker logs show successful job completion in last 15 minutes
4. ✅ Database has listings with `last_seen` in last 15 minutes

**Workers are DOWN if:**
1. ❌ `/api/health/workers` returns `"status": "degraded"` or `"offline"`
2. ❌ No logs in last 15 minutes
3. ❌ Azure shows `Status: Stopped` or 0 replicas
4. ❌ No recent listings in database

---

## 📁 Modified Files

### Workers
- `apps/worker-scheduler/src/index.ts` - Added heartbeat tracking
- `apps/worker-scheduler/src/facebook-job.ts` - Enhanced logging
- `apps/worker-scheduler/src/vinted-job.ts` - Enhanced logging
- `apps/worker-realtime/src/index.ts` - Added heartbeat tracking

### API
- `apps/web/app/api/health/workers/route.ts` - Enhanced health endpoint

---

## 🎯 Next Steps

1. **Set up monitoring alerts:**
   ```bash
   # Example: Alert if workers are offline for > 15 minutes
   # (Configure in Azure Portal → Alerts)
   ```

2. **Create dashboard:**
   - Add widget showing `/api/health/workers` status
   - Display recent job statistics

3. **Automated health checks:**
   - GitHub Action to run health checks every 5 minutes
   - Slack/email notification on failures

---

## 📞 Need Help?

**Common Issues:**
- Workers show "offline" but Azure shows "Running" → Check environment variables (DATABASE_URL, SUPABASE_URL)
- Facebook/Vinted jobs show errors → Check API keys and rate limits
- No searches found → Users need to create searches via the app

**Logs Location:**
- Azure Portal: Container Apps → mf-worker-scheduler → Log stream
- CLI: `az containerapp logs show --name mf-worker-scheduler -g magnus-rg --follow`

---

**Last Updated:** 2025-12-13
