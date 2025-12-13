# Magnus Flipper AI - Production Documentation

Complete documentation for launching and operating Magnus Flipper AI in production.

---

## 🚀 Quick Links

| I want to... | Go to... | Time |
|--------------|----------|------|
| **Get first listing NOW** | [5-Minute Checklist](./5_MINUTE_FIRST_LISTING_CHECKLIST.md) | 30s - 5min |
| **Verify workers are alive** | [Worker Health Quick Ref](./WORKER_HEALTH_QUICK_REF.md) | 10s |
| **Run automated setup** | `./docs/force_first_listing.sh facebook` | 1-5min |
| **Troubleshoot workers** | [Worker Verification Guide](./WORKER_VERIFICATION_GUIDE.md) | 5-10min |
| **Understand architecture** | [Flowchart](./FIRST_LISTING_FLOWCHART.md) | 2min |
| **See implementation details** | [Launch Summary](../FIRST_LISTING_LAUNCH_SUMMARY.md) | 5min |

---

## 📚 Documentation Index

### 🎯 First Listing Launch

**Goal:** Get the first listing visible on `/marketplaces/facebook` or `/marketplaces/vinted`

| Document | Description |
|----------|-------------|
| **[5-Minute Checklist](./5_MINUTE_FIRST_LISTING_CHECKLIST.md)** | Complete step-by-step guide with 3 methods |
| **[Quick Reference](./FIRST_LISTING_QUICK_REF.md)** | One-page cheat sheet |
| **[Launch Summary](../FIRST_LISTING_LAUNCH_SUMMARY.md)** | Implementation overview |
| **[Flowchart](./FIRST_LISTING_FLOWCHART.md)** | Visual architecture diagrams |

### 🔍 Worker Verification

**Goal:** Verify Facebook and Vinted workers are running and processing jobs

| Document | Description |
|----------|-------------|
| **[Verification Guide](./WORKER_VERIFICATION_GUIDE.md)** | Complete troubleshooting guide |
| **[Quick Reference](./WORKER_HEALTH_QUICK_REF.md)** | One-page command reference |
| **[Implementation](../WORKER_VERIFICATION_IMPLEMENTATION.md)** | What was added to enable verification |

### 🛠️ Automated Scripts

| Script | Purpose |
|--------|---------|
| **`force_first_listing.sh`** | Interactive script to launch first listing |
| **`WORKER_VERIFICATION_QUICKSTART.sh`** | Automated worker health check |

---

## ⚡ Quick Start

### 1. Get First Listing (30 seconds)

```bash
# Get auth token from browser
# DevTools (F12) → Application → Cookies → sb-access-token
export AUTH_TOKEN="your-token-here"

# Submit a listing URL
curl -X POST https://flipperagents.com/api/ingest/facebook/submit \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" \
  -d '{"url":"https://www.facebook.com/marketplace/item/123/"}'

# Verify
curl https://flipperagents.com/api/deals?marketplace=facebook \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq '.deals[0]'
```

### 2. Verify Workers (10 seconds)

```bash
# Check worker health
curl https://flipperagents.com/api/health/workers | jq
```

**Expected:** `"status": "healthy"` and both marketplaces `"live"`

### 3. View in UI

Navigate to: `https://flipperagents.com/marketplaces/facebook`

---

## 📖 Documentation Structure

```
docs/
├── README.md (you are here)
├── PRODUCTION_LAUNCH_INDEX.md (master index)
│
├── First Listing Launch/
│   ├── 5_MINUTE_FIRST_LISTING_CHECKLIST.md (complete guide)
│   ├── FIRST_LISTING_QUICK_REF.md (one-page)
│   ├── FIRST_LISTING_FLOWCHART.md (visual)
│   └── force_first_listing.sh (script)
│
└── Worker Verification/
    ├── WORKER_VERIFICATION_GUIDE.md (complete guide)
    ├── WORKER_HEALTH_QUICK_REF.md (one-page)
    └── WORKER_VERIFICATION_QUICKSTART.sh (script)
```

---

## 🎓 Learning Paths

### For Engineers (1 hour)

1. ✅ **Read:** [5-Minute Checklist](./5_MINUTE_FIRST_LISTING_CHECKLIST.md) (10 min)
2. ✅ **Practice:** Run `./docs/force_first_listing.sh facebook` (5 min)
3. ✅ **Read:** [Worker Verification Guide](./WORKER_VERIFICATION_GUIDE.md) (10 min)
4. ✅ **Practice:** Create searches, submit URLs, verify listings (30 min)

### For Tech Leads (20 minutes)

1. ✅ **Read:** [Launch Summary](../FIRST_LISTING_LAUNCH_SUMMARY.md) (5 min)
2. ✅ **Read:** [Worker Implementation](../WORKER_VERIFICATION_IMPLEMENTATION.md) (5 min)
3. ✅ **Review:** [Flowchart](./FIRST_LISTING_FLOWCHART.md) (5 min)
4. ✅ **Verify:** Run automated scripts (5 min)

### For Stakeholders (5 minutes)

1. ✅ **Read:** [Quick Reference](./FIRST_LISTING_QUICK_REF.md) (1 min)
2. ✅ **Demo:** Watch engineer run script (2 min)
3. ✅ **Verify:** Visit production UI (2 min)

---

## 🏗️ System Architecture

### Components

```
┌─────────────────────────────────────────┐
│           Next.js Web App               │
│      (https://flipperagents.com)        │
│                                         │
│  /marketplaces/facebook                 │
│  /marketplaces/vinted                   │
│  /api/searches                          │
│  /api/deals                             │
│  /api/ingest/:marketplace/submit        │
└─────────┬───────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│         Prisma + Postgres               │
│                                         │
│  Tables:                                │
│  - listings                             │
│  - saved_search                         │
│  - users                                │
└─────────┬───────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│      Azure Container Apps               │
│                                         │
│  mf-worker-scheduler (Facebook/Vinted)  │
│  mf-worker-realtime (Hydration)         │
└─────────────────────────────────────────┘
```

### Data Flow

1. **User creates search** → API saves to DB
2. **worker-scheduler scrapes** (every 10 min) → Saves listings
3. **worker-realtime hydrates** (every 2 min) → Updates listing details
4. **API returns listings** → UI displays cards

---

## ✅ Success Criteria

**System is operational if:**

1. ✅ Workers show `"healthy"`:
   ```bash
   curl https://flipperagents.com/api/health/workers | jq '.status'
   # "healthy"
   ```

2. ✅ API returns listings:
   ```bash
   curl https://flipperagents.com/api/deals?marketplace=facebook -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq '.deals | length'
   # 1 or more
   ```

3. ✅ UI shows listing cards at `/marketplaces/facebook`

---

## 🚨 Troubleshooting

### Workers Offline

```bash
# Check status
az containerapp list -g magnus-rg --query "[?contains(name, 'worker')]"

# Restart
az containerapp restart --name mf-worker-scheduler -g magnus-rg
az containerapp restart --name mf-worker-realtime -g magnus-rg

# Verify
curl https://flipperagents.com/api/health/workers | jq
```

**Details:** [Worker Verification Guide](./WORKER_VERIFICATION_GUIDE.md) → Troubleshooting

---

### No Listings Appear

**Diagnosis:**
```bash
# Check searches exist
curl https://flipperagents.com/api/searches?marketplace=facebook \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq

# Check worker logs
az containerapp logs show --name mf-worker-scheduler -g magnus-rg --tail 20
```

**Solution:** Create a search or submit a URL directly

**Details:** [5-Minute Checklist](./5_MINUTE_FIRST_LISTING_CHECKLIST.md) → Troubleshooting

---

### "Pending hydration..." Stuck

**Solution:**
```bash
# Restart realtime worker
az containerapp restart --name mf-worker-realtime -g magnus-rg

# Wait 30 seconds
sleep 30

# Check again
curl https://flipperagents.com/api/deals?marketplace=facebook \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq '.deals[0].title'
```

---

## 📞 Support

### Get Help

| Issue | Resource |
|-------|----------|
| First listing not appearing | [5-Minute Checklist](./5_MINUTE_FIRST_LISTING_CHECKLIST.md) → Common Issues |
| Workers not running | [Worker Verification Guide](./WORKER_VERIFICATION_GUIDE.md) → Troubleshooting |
| Need quick commands | [Quick References](./PRODUCTION_LAUNCH_INDEX.md) → Command Cheat Sheet |
| Need visual guide | [Flowchart](./FIRST_LISTING_FLOWCHART.md) |

### Automated Scripts

```bash
# Launch first listing (interactive)
./docs/force_first_listing.sh facebook

# Check worker health
./docs/WORKER_VERIFICATION_QUICKSTART.sh
```

---

## 🔐 Security

- ✅ All endpoints require authentication
- ✅ Use session tokens from browser cookies
- ✅ Only use public marketplace URLs
- ✅ Respect platform Terms of Service
- ✅ Workers run on Azure with managed identity

---

## 📊 Monitoring

### Health Check Commands

```bash
# Worker status (instant)
curl https://flipperagents.com/api/health/workers | jq

# Listing count
curl https://flipperagents.com/api/deals?marketplace=facebook \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq '.deals | length'

# Worker logs (live)
az containerapp logs show --name mf-worker-scheduler -g magnus-rg --follow
```

### Automated Monitoring

```bash
# Watch worker health (every 5 seconds)
watch -n 5 'curl -s https://flipperagents.com/api/health/workers | jq'

# Set up cron for alerts
*/5 * * * * curl -s https://flipperagents.com/api/health/workers | jq -e '.status == "healthy"' || echo "ALERT!"
```

---

## 🎯 Next Steps

1. ✅ **Launch:** Use [5-Minute Checklist](./5_MINUTE_FIRST_LISTING_CHECKLIST.md)
2. ✅ **Verify:** Use [Worker Health Quick Ref](./WORKER_HEALTH_QUICK_REF.md)
3. ✅ **Monitor:** Set up health checks
4. ✅ **Scale:** Create more searches for demo
5. ✅ **Document:** Report any issues

---

## 📚 Additional Resources

- **Production Launch Index:** [PRODUCTION_LAUNCH_INDEX.md](./PRODUCTION_LAUNCH_INDEX.md)
- **Implementation Details:** [FIRST_LISTING_LAUNCH_SUMMARY.md](../FIRST_LISTING_LAUNCH_SUMMARY.md)
- **Worker Implementation:** [WORKER_VERIFICATION_IMPLEMENTATION.md](../WORKER_VERIFICATION_IMPLEMENTATION.md)

---

**Last Updated:** 2025-12-13  
**Status:** ✅ Production Ready  
**Maintainer:** Magnus Flipper AI Team
