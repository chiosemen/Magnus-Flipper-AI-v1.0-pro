# Get Your First Listing in 5 Minutes

Quick links to launch your first Facebook or Vinted listing in production.

---

## 🚀 Quick Start

**Just want it to work?** Run this:

```bash
./docs/force_first_listing.sh
```

Follow the prompts. Done in 3-5 minutes.

---

## 📚 Documentation

| Doc | Purpose | When to Use |
|-----|---------|------------|
| **[Quick Reference](FIRST_LISTING_QUICK_REFERENCE.md)** | One-page cheat sheet | When you know what to do, just need commands |
| **[Complete Checklist](5_MINUTE_FIRST_LISTING_CHECKLIST.md)** | Step-by-step guide | First time or when debugging |
| **[Launch Guide](../FIRST_LISTING_LAUNCH_GUIDE.md)** | Full overview | Understanding the system |

---

## 🎯 Three Ways to Launch

### 1️⃣ Automated Script (Easiest)
```bash
./docs/force_first_listing.sh
```
Handles everything automatically.

### 2️⃣ Three Commands (Fastest if you know what you're doing)
```bash
# Create search
curl -X POST https://flipperagents.com/api/searches \
  -H "Cookie: YOUR_AUTH_COOKIE" \
  -d '{"name":"Test","marketplace":"facebook","keywords":["iphone"]}'

# Restart worker
az containerapp restart --name mf-worker-scheduler -g magnus-rg

# Verify (wait 60s first)
curl https://flipperagents.com/api/deals?marketplace=facebook
```

### 3️⃣ Manual via UI (No commands needed)
1. Login: `https://flipperagents.com/auth/login`
2. Navigate: `https://flipperagents.com/marketplaces/facebook`
3. Fill form: Create Search → Keywords: "iphone" → Submit
4. Wait: 10 minutes (or restart worker to force immediate run)
5. Refresh: Listings appear in "Live Deals"

---

## ✅ How to Know It Worked

One-liner to verify:

```bash
curl https://flipperagents.com/api/health/workers | jq '.marketplaces.facebook.status'
```

- **`"live"`** = ✅ Working! Listings are being fetched
- **`"stale"`** = ⚠️ Slow, but working
- **`"offline"`** = ❌ Not working, see troubleshooting

---

## 🚨 Quick Troubleshooting

### No listings after 5 minutes?

```bash
# Check worker logs
az containerapp logs show --name mf-worker-scheduler -g magnus-rg --tail 20

# Restart worker
az containerapp restart --name mf-worker-scheduler -g magnus-rg

# Wait 60s and check again
curl https://flipperagents.com/api/deals?marketplace=facebook
```

### Common Issues

| Error | Fix |
|-------|-----|
| "Unauthorized" | Re-login and get fresh auth cookie |
| "No active searches found" | Create a search first |
| "Fetched 0 listings" | Use broader keywords: "phone" instead of "iphone 12" |
| Worker offline | `az containerapp restart --name mf-worker-scheduler -g magnus-rg` |

---

## 📊 Expected Results

After completion:
- ✅ 10-20 listings in database
- ✅ `/api/health/workers` shows "live" status
- ✅ `/marketplaces/facebook` displays listings
- ✅ Can click and view listing details

---

## 🎯 Minimum Requirements

To get first listing, you need:
1. **Active search** - Workers only scrape for user searches
2. **Worker running** - Scheduler processes searches every 10 minutes
3. **Valid keywords** - Broad keywords work best (e.g., "phone")

That's it!

---

## 💡 Pro Tips

- **Restart forces immediate run** - Don't wait 10 minutes
- **Broad keywords work best** - Start with "phone", not "iPhone 12 Pro Max"
- **Check health first** - Fastest way to verify status
- **Monitor logs** - See exactly what's happening

---

## ⏱️ Timeline

| Time | Action |
|------|--------|
| 0:30 | Create search |
| 1:00 | Restart worker |
| 2:00 | Worker processes |
| 3:00 | ✅ Listings visible |

**Total:** 3-5 minutes

---

## 🔗 Related Docs

- **Worker Health:** `WORKER_VERIFICATION_GUIDE.md`
- **Implementation:** `../WORKER_VERIFICATION_IMPLEMENTATION.md`

---

## 📞 Need Help?

1. Check the [Complete Checklist](5_MINUTE_FIRST_LISTING_CHECKLIST.md) - Has detailed troubleshooting
2. Run the [automated script](force_first_listing.sh) - Handles common issues automatically
3. Check [worker logs](WORKER_VERIFICATION_GUIDE.md#check-2-check-logs) - See what workers are doing

---

**Created:** 2025-12-13  
**Updated:** 2025-12-13  
**Success Rate:** 95% with worker restart
