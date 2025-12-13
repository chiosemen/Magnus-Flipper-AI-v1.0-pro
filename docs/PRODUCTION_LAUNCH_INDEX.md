# Production Launch Documentation Index

Complete guide for launching and verifying Magnus Flipper AI in production.

---

## 🚀 Quick Start

**Need to launch NOW?**
1. **Get first listing:** [5-Minute Checklist](./5_MINUTE_FIRST_LISTING_CHECKLIST.md)
2. **Verify workers:** [Worker Health Quick Reference](./WORKER_HEALTH_QUICK_REFERENCE.md)
3. **Run automated script:** `./docs/force_first_listing.sh facebook`

---

## 📚 Documentation Structure

### 🎯 First Listing Launch

| Document | Purpose | Time | Audience |
|----------|---------|------|----------|
| [5-Minute Checklist](./5_MINUTE_FIRST_LISTING_CHECKLIST.md) | Complete step-by-step guide | 5-10 min read | Engineers |
| [Quick Reference](./FIRST_LISTING_QUICK_REF.md) | One-page cheat sheet | 1 min read | All |
| [Launch Summary](../FIRST_LISTING_LAUNCH_SUMMARY.md) | Implementation overview | 5 min read | Tech leads |
| [Flowchart](./FIRST_LISTING_FLOWCHART.md) | Visual architecture | 2 min read | Visual learners |

### 🔍 Worker Verification

| Document | Purpose | Time | Audience |
|----------|---------|------|----------|
| [Verification Guide](./WORKER_VERIFICATION_GUIDE.md) | Complete troubleshooting | 10 min read | Engineers |
| [Quick Reference](./WORKER_HEALTH_QUICK_REF.md) | One-page commands | 1 min read | All |
| [Implementation](../WORKER_VERIFICATION_IMPLEMENTATION.md) | What was added | 5 min read | Tech leads |

### 🛠️ Automated Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `force_first_listing.sh` | Launch first listing interactively | `./docs/force_first_listing.sh facebook` |
| `WORKER_VERIFICATION_QUICKSTART.sh` | Verify workers are alive | `./docs/WORKER_VERIFICATION_QUICKSTART.sh` |

---

## 🎯 Use Cases

### Use Case 1: "I need the first listing NOW"

**Goal:** Get a listing visible on `/marketplaces/facebook` in 30 seconds

**Steps:**
1. Read: [Quick Reference](./FIRST_LISTING_QUICK_REF.md)
2. Run: `./docs/force_first_listing.sh facebook`
3. Choose: Method 1 (URL submission)
4. Verify: Visit `https://flipperagents.com/marketplaces/facebook`

**Time:** 30 seconds - 2 minutes

---

### Use Case 2: "Are the workers running?"

**Goal:** Verify Facebook and Vinted workers are processing jobs

**Steps:**
1. Read: [Worker Health Quick Reference](./WORKER_HEALTH_QUICK_REF.md)
2. Run: `curl https://flipperagents.com/api/health/workers | jq`
3. Check: Status should be `"healthy"`

**Time:** 10 seconds

---

### Use Case 3: "Workers are down, how do I fix?"

**Goal:** Troubleshoot and restart workers

**Steps:**
1. Read: [Worker Verification Guide](./WORKER_VERIFICATION_GUIDE.md) → Troubleshooting section
2. Check: `az containerapp list -g magnus-rg`
3. Restart: `az containerapp restart --name mf-worker-scheduler -g magnus-rg`
4. Verify: `./docs/WORKER_VERIFICATION_QUICKSTART.sh`

**Time:** 2-5 minutes

---

### Use Case 4: "I need to demo to stakeholders"

**Goal:** Populate marketplace with listings for demo

**Steps:**
1. Create multiple searches:
   ```bash
   # iPhone
   curl -X POST https://flipperagents.com/api/searches \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=$AUTH_TOKEN" \
     -d '{"name":"iPhone","keywords":["iphone"],"marketplace":"facebook"}'
   
   # Laptop
   curl -X POST https://flipperagents.com/api/searches \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-access-token=$AUTH_TOKEN" \
     -d '{"name":"Laptop","keywords":["macbook","laptop"],"marketplace":"facebook"}'
   ```
2. Wait for workers to run (10 minutes)
3. Or use URL submission for instant results (see [5-Minute Checklist](./5_MINUTE_FIRST_LISTING_CHECKLIST.md))

**Time:** 10-15 minutes (automatic) or 5 minutes (manual URL submission)

---

## 📋 Command Cheat Sheet

### Authentication
```bash
# Get from browser: DevTools → Application → Cookies → sb-access-token
export AUTH_TOKEN="your-token-here"
```

### First Listing
```bash
# Method 1: Submit URL (fastest)
curl -X POST https://flipperagents.com/api/ingest/facebook/submit \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" \
  -d '{"url":"https://www.facebook.com/marketplace/item/123/"}'

# Method 2: Create search (automatic)
curl -X POST https://flipperagents.com/api/searches \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" \
  -d '{"name":"iPhone","keywords":["iphone"],"marketplace":"facebook"}'
```

### Verification
```bash
# Check API
curl https://flipperagents.com/api/deals?marketplace=facebook \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq

# Check workers
curl https://flipperagents.com/api/health/workers | jq

# Check listings count
curl https://flipperagents.com/api/deals?marketplace=facebook \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq '.deals | length'
```

### Worker Management
```bash
# Check status
az containerapp list -g magnus-rg --query "[?contains(name, 'worker')].{Name:name, Status:properties.runningStatus}" -o table

# Restart scheduler (Facebook/Vinted jobs)
az containerapp restart --name mf-worker-scheduler -g magnus-rg

# Restart realtime (listing hydration)
az containerapp restart --name mf-worker-realtime -g magnus-rg

# View logs
az containerapp logs show --name mf-worker-scheduler -g magnus-rg --tail 20
```

---

## 🏗️ Architecture Overview

### System Components

```
User Interface (Web)
    ↓
Next.js API Routes
    ↓
Prisma + Postgres Database
    ↓
Worker Services (Azure Container Apps)
    ├─ worker-scheduler (Facebook/Vinted scraping)
    └─ worker-realtime (listing hydration)
```

### Data Flow

1. **User creates search** → API saves to `saved_search` table
2. **worker-scheduler runs** (every 10 min) → Scrapes marketplace → Saves to `listings` table
3. **API fetches listings** → Returns to UI
4. **UI displays** → Listing cards on `/marketplaces/:marketplace`

### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/searches` | POST | Create search |
| `/api/ingest/:marketplace/submit` | POST | Submit URL |
| `/api/deals?marketplace=X` | GET | Fetch listings |
| `/api/health/workers` | GET | Worker status |

---

## ✅ Success Criteria

**System is fully operational if:**

1. ✅ **Workers are alive:**
   ```bash
   curl https://flipperagents.com/api/health/workers | jq '.status'
   # Output: "healthy"
   ```

2. ✅ **Listings appear in API:**
   ```bash
   curl https://flipperagents.com/api/deals?marketplace=facebook -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq '.deals | length'
   # Output: 1 or more
   ```

3. ✅ **UI shows listings:**
   - Navigate to `https://flipperagents.com/marketplaces/facebook`
   - See listing cards with titles, prices, images

4. ✅ **Searches are processing:**
   ```bash
   az containerapp logs show --name mf-worker-scheduler -g magnus-rg --tail 20 | grep "Facebook Job"
   # Output: Recent job completion logs
   ```

---

## 🚨 Common Issues

### Issue: No listings appear

**Diagnosis:**
```bash
# Check workers
curl https://flipperagents.com/api/health/workers | jq

# Check logs
az containerapp logs show --name mf-worker-scheduler -g magnus-rg --tail 20
```

**Solution:**
- If workers are "offline" → Restart workers
- If no searches exist → Create a search
- If searches exist but no listings → Check marketplace URLs are valid

**Reference:** [Worker Verification Guide](./WORKER_VERIFICATION_GUIDE.md) → Troubleshooting

---

### Issue: "Pending hydration..." stuck

**Diagnosis:**
```bash
curl https://flipperagents.com/api/deals?marketplace=facebook -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq '.deals[0].title'
# Output: "Pending hydration..."
```

**Solution:**
```bash
# Restart realtime worker
az containerapp restart --name mf-worker-realtime -g magnus-rg

# Wait 30 seconds, then check again
sleep 30
curl https://flipperagents.com/api/deals?marketplace=facebook -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq '.deals[0].title'
```

**Reference:** [5-Minute Checklist](./5_MINUTE_FIRST_LISTING_CHECKLIST.md) → Common Issues

---

## 🎓 Learning Path

### For Engineers (Day 1)

1. ✅ Read: [5-Minute Checklist](./5_MINUTE_FIRST_LISTING_CHECKLIST.md) (10 min)
2. ✅ Run: `./docs/force_first_listing.sh facebook` (2 min)
3. ✅ Read: [Worker Verification Guide](./WORKER_VERIFICATION_GUIDE.md) (10 min)
4. ✅ Practice: Create searches, submit URLs, verify listings (30 min)

**Total Time:** ~1 hour

---

### For Tech Leads (Day 1)

1. ✅ Read: [Launch Summary](../FIRST_LISTING_LAUNCH_SUMMARY.md) (5 min)
2. ✅ Read: [Worker Implementation](../WORKER_VERIFICATION_IMPLEMENTATION.md) (5 min)
3. ✅ Review: [Flowchart](./FIRST_LISTING_FLOWCHART.md) (2 min)
4. ✅ Verify: Run automated scripts (5 min)

**Total Time:** ~20 minutes

---

### For Product/Stakeholders (Day 1)

1. ✅ Read: [Quick Reference](./FIRST_LISTING_QUICK_REF.md) (1 min)
2. ✅ Demo: Engineer runs `./docs/force_first_listing.sh` (2 min)
3. ✅ Verify: Visit `https://flipperagents.com/marketplaces/facebook` (1 min)

**Total Time:** ~5 minutes

---

## 📞 Support Resources

### Documentation
- **First Listing:** [5-Minute Checklist](./5_MINUTE_FIRST_LISTING_CHECKLIST.md)
- **Worker Health:** [Verification Guide](./WORKER_VERIFICATION_GUIDE.md)
- **Quick Refs:** All `*_QUICK_REF.md` files

### Automated Tools
- **Launch Script:** `./docs/force_first_listing.sh`
- **Health Check:** `./docs/WORKER_VERIFICATION_QUICKSTART.sh`

### Production URLs
- **API:** `https://flipperagents.com`
- **Facebook:** `https://flipperagents.com/marketplaces/facebook`
- **Vinted:** `https://flipperagents.com/marketplaces/vinted`
- **Health:** `https://flipperagents.com/api/health/workers`

---

## 🔐 Security Notes

- ✅ All endpoints require authentication (session token)
- ✅ Only use publicly accessible marketplace URLs
- ✅ Respect platform ToS (no private/restricted content)
- ✅ Workers run on Azure Container Apps with managed identity
- ✅ Database access via Prisma with connection pooling

---

## 📊 Monitoring

### Real-Time Monitoring
```bash
# Worker health (every 5 seconds)
watch -n 5 'curl -s https://flipperagents.com/api/health/workers | jq'

# Listing count (every 10 seconds)
watch -n 10 'curl -s https://flipperagents.com/api/deals?marketplace=facebook -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq ".deals | length"'

# Worker logs (live)
az containerapp logs show --name mf-worker-scheduler -g magnus-rg --follow
```

### Scheduled Checks
```bash
# Set up cron job for health checks (example)
# Every 5 minutes, check worker status and alert if offline
*/5 * * * * curl -s https://flipperagents.com/api/health/workers | jq -e '.status == "healthy"' || echo "ALERT: Workers offline!"
```

---

## ✨ Next Steps

1. **Launch first listing** using [5-Minute Checklist](./5_MINUTE_FIRST_LISTING_CHECKLIST.md)
2. **Verify workers** using [Worker Health Quick Reference](./WORKER_HEALTH_QUICK_REF.md)
3. **Set up monitoring** (see Monitoring section above)
4. **Create test searches** for demo purposes
5. **Document any issues** encountered

---

**Last Updated:** 2025-12-13  
**Status:** ✅ Production Ready  
**Estimated Setup Time:** 5 minutes - 1 hour (depends on method)
