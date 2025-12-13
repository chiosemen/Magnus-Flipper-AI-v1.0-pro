# Worker Health - Quick Reference Card

> **Goal:** Verify Facebook & Vinted workers are alive in 60 seconds

---

## ⚡ One-Line Health Check

```bash
curl https://flipperagents.com/api/health/workers | jq '.status'
# Output: "healthy" = ✅ ALIVE | "degraded" = ❌ DOWN
```

---

## 🎯 Quick Decision Matrix

| API Response | Facebook Status | Vinted Status | Decision |
|-------------|-----------------|---------------|----------|
| `"healthy"` | `"live"` | `"live"` | ✅ **ALIVE** - All good |
| `"warning"` | `"stale"` | `"live"` | ⚠️ **SLOW** - One worker lagging |
| `"degraded"` | `"offline"` | Any | ❌ **DOWN** - Restart workers |

---

## 📊 Health Status Explained

- **`live`** = Listings fetched in last 10 minutes → Workers actively running
- **`stale`** = Listings fetched in last hour → Workers slow/rate-limited
- **`offline`** = No listings in last hour → Workers down

---

## 🚀 Common Commands

### Check Health
```bash
# API health (fastest)
curl https://flipperagents.com/api/health/workers | jq

# Run automated script
./docs/WORKER_VERIFICATION_QUICKSTART.sh

# Direct worker health
curl https://$(az containerapp show --name mf-worker-scheduler -g magnus-rg --query properties.configuration.ingress.fqdn -o tsv)/health | jq
```

### View Logs
```bash
# Tail all logs
az containerapp logs show --name mf-worker-scheduler -g magnus-rg --follow

# Facebook jobs only
az containerapp logs show --name mf-worker-scheduler -g magnus-rg --follow | grep -E "Facebook Job|🔵"

# Vinted jobs only
az containerapp logs show --name mf-worker-scheduler -g magnus-rg --follow | grep -E "Vinted Job|🟣"

# Errors only
az containerapp logs show --name mf-worker-scheduler -g magnus-rg --tail 100 | grep -i error
```

### Restart Workers
```bash
# Restart scheduler (Facebook/Vinted jobs)
az containerapp restart --name mf-worker-scheduler -g magnus-rg

# Restart realtime
az containerapp restart --name mf-worker-realtime -g magnus-rg
```

### Check Status
```bash
# Worker running status
az containerapp list -g magnus-rg --query "[?contains(name, 'worker')].{Name:name, Status:properties.runningStatus}" -o table

# Check replicas
az containerapp replica list --name mf-worker-scheduler -g magnus-rg -o table
```

---

## 🔍 Log Patterns to Look For

### ✅ Healthy (What you want to see)
```
[worker-scheduler-001] 🔵 Facebook job START
[Facebook Job] ✅ === FACEBOOK JOB COMPLETE === (12.45s)
[Facebook Job] 📊 Summary: 5 searches scanned | 23 listings fetched | 8 matches saved
```

### ❌ Unhealthy (Red flags)
```
[Facebook Job] ❌ Facebook scraping job ERROR: Connection refused
# OR
(No logs in last 15 minutes)
```

### ⚠️ No Searches (Expected if no users)
```
[Facebook Job] ⚠️ No active Facebook searches found - nothing to process
```

---

## 🚨 Quick Troubleshooting

### Problem: Workers show "offline"
```bash
# 1. Check if running
az containerapp show --name mf-worker-scheduler -g magnus-rg --query "properties.runningStatus" -o tsv

# 2. Restart
az containerapp restart --name mf-worker-scheduler -g magnus-rg

# 3. Check env vars
az containerapp show --name mf-worker-scheduler -g magnus-rg --query "properties.template.containers[0].env" -o table
```

### Problem: Logs show errors
```bash
# Get last 100 lines with errors
az containerapp logs show --name mf-worker-scheduler -g magnus-rg --tail 100 | grep -i error
```

**Common fixes:**
- `Prisma Client initialization error` → Check DATABASE_URL env var
- `ECONNREFUSED` → Check Supabase connectivity
- `Rate limit exceeded` → Normal, workers will retry

---

## 📋 Pre-Flight Checklist

Before claiming workers are down:

- [ ] API health shows `"offline"`
- [ ] No logs in last 15 minutes
- [ ] Azure shows `Status: Stopped` or 0 replicas
- [ ] Database has no listings with `last_seen` in last 15 minutes

If all 4 are true → Workers are definitely down, restart them.

---

## 🎯 Production URLs

| Service | URL/Command |
|---------|-------------|
| API Health | `https://flipperagents.com/api/health/workers` |
| Scheduler Health | `https://$(az containerapp show --name mf-worker-scheduler -g magnus-rg -o tsv --query properties.configuration.ingress.fqdn)/health` |
| Realtime Health | `https://$(az containerapp show --name mf-worker-realtime -g magnus-rg -o tsv --query properties.configuration.ingress.fqdn)/health` |

---

## 📚 Full Docs

- **Complete Guide:** `docs/WORKER_VERIFICATION_GUIDE.md`
- **Implementation Summary:** `WORKER_VERIFICATION_IMPLEMENTATION.md`
- **Automated Script:** `docs/WORKER_VERIFICATION_QUICKSTART.sh`

---

**Last Updated:** 2025-12-13
