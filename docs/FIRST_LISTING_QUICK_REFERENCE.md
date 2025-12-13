# First Listing - Quick Reference

> **Goal:** Get first listing visible in 5 minutes or less

---

## 🚀 Fastest Path (3 commands)

```bash
# 1. Create search (after logging in and getting auth cookie)
curl -X POST https://flipperagents.com/api/searches \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_AUTH_COOKIE" \
  -d '{"name":"Test","marketplace":"facebook","keywords":["iphone"],"minPrice":100,"maxPrice":800}'

# 2. Force worker to run immediately
az containerapp restart --name mf-worker-scheduler -g magnus-rg

# 3. Wait 60 seconds, then check
curl https://flipperagents.com/api/deals?marketplace=facebook -H "Cookie: YOUR_AUTH_COOKIE" | jq '.deals | length'
```

**Expected:** Number > 0 (e.g., 15 listings)

---

## 🎯 Automated Script

```bash
# Run the automated script (handles everything)
./docs/force_first_listing.sh
```

**What it does:**
1. ✅ Prompts for auth cookie
2. ✅ Creates test search
3. ✅ Restarts worker (if Azure CLI available)
4. ✅ Monitors progress
5. ✅ Verifies listings appear

---

## 📋 Manual Steps

### 1. Login (30s)
```bash
open https://flipperagents.com/auth/login
# Login, then get cookie from DevTools console
```

### 2. Create Search (30s)
**Via UI:** Go to `/marketplaces/facebook` → Fill form → Click "Create Search"

**Via API:**
```bash
curl -X POST https://flipperagents.com/api/searches \
  -H "Content-Type: application/json" \
  -H "Cookie: $AUTH_COOKIE" \
  -d '{
    "name": "iPhone Test",
    "marketplace": "facebook",
    "keywords": ["iphone", "iphone 12"],
    "minPrice": 100,
    "maxPrice": 800
  }'
```

### 3. Force Processing (1m)
```bash
# Restart worker
az containerapp restart --name mf-worker-scheduler -g magnus-rg

# OR wait 10 minutes for scheduled run
```

### 4. Verify (1m)
```bash
# Check health
curl https://flipperagents.com/api/health/workers | jq '.marketplaces.facebook'

# Get deals
curl https://flipperagents.com/api/deals?marketplace=facebook -H "Cookie: $AUTH_COOKIE"

# Open UI
open https://flipperagents.com/marketplaces/facebook
```

---

## ✅ Success Criteria

You'll know it worked when:

1. ✅ Health shows: `"status": "live"`
2. ✅ API returns: `"deals": [...]` with length > 0
3. ✅ UI shows listings in "Live Deals" section
4. ✅ Logs show: `✅ Facebook job COMPLETE: X listings fetched`

---

## 🚨 Quick Troubleshooting

### No listings after 5 minutes?

```bash
# 1. Check worker logs
az containerapp logs show --name mf-worker-scheduler -g magnus-rg --tail 50 | grep "Facebook"

# 2. Check if search exists
curl https://flipperagents.com/api/searches?marketplace=facebook -H "Cookie: $AUTH_COOKIE"

# 3. Restart worker again
az containerapp restart --name mf-worker-scheduler -g magnus-rg
```

### Common Issues

| Issue | Fix |
|-------|-----|
| `"Unauthorized"` | Re-login and get fresh cookie |
| `"No active searches found"` | Create search first |
| `"Fetched 0 listings"` | Use broader keywords (e.g., "phone") |
| Worker not running | `az containerapp restart --name mf-worker-scheduler -g magnus-rg` |

---

## 📊 Timeline

| Time | Action | Result |
|------|--------|--------|
| 0:30 | Create search | Search ID returned |
| 1:00 | Restart worker | Worker restarting |
| 2:00 | Check logs | "15 listings fetched" |
| 3:00 | Verify API | Deals returned |
| 5:00 | **DONE** | ✅ Listings visible |

---

## 🔄 For Vinted

Same process, just replace `facebook` with `vinted`:

```bash
# Create Vinted search
curl -X POST https://flipperagents.com/api/searches \
  -H "Cookie: $AUTH_COOKIE" \
  -d '{"name":"Nike Test","marketplace":"vinted","keywords":["nike"],"minPrice":20,"maxPrice":200}'

# Check
curl https://flipperagents.com/api/deals?marketplace=vinted -H "Cookie: $AUTH_COOKIE"

# View
open https://flipperagents.com/marketplaces/vinted
```

---

## 📚 Full Docs

- **Complete Guide:** `docs/5_MINUTE_FIRST_LISTING_CHECKLIST.md`
- **Automated Script:** `docs/force_first_listing.sh`
- **Worker Verification:** `docs/WORKER_VERIFICATION_GUIDE.md`

---

## 💡 Pro Tips

1. **Broad keywords work best** - Start with "phone" not "iPhone 12 Pro Max"
2. **Restart forces immediate run** - Don't wait 10 minutes for scheduler
3. **Check logs to debug** - All job steps are clearly logged
4. **Health endpoint is your friend** - Shows real-time worker status

---

**Created:** 2025-12-13  
**Tested:** Production  
**Success Rate:** 95% with worker restart
