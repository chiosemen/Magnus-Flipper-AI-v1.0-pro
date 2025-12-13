# First Listing - Quick Reference

> **Goal:** Get first listing visible on `/marketplaces/facebook` or `/marketplaces/vinted` in 5 minutes

---

## 🚀 Fastest Method (30 seconds)

### 1. Get Auth Token
```
DevTools (F12) → Application → Cookies → Copy 'sb-access-token'
```

### 2. Submit Listing URL
```bash
curl -X POST https://flipperagents.com/api/ingest/facebook/submit \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{"url":"https://www.facebook.com/marketplace/item/123456789/"}'
```

### 3. Verify
```bash
curl https://flipperagents.com/api/deals?marketplace=facebook \
  -H "Cookie: sb-access-token=YOUR_TOKEN" | jq '.deals[0]'
```

### 4. Check UI
Visit: `https://flipperagents.com/marketplaces/facebook`

---

## 🎯 Alternative: Create Search (2-10 minutes)

```bash
curl -X POST https://flipperagents.com/api/searches \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "name": "iPhone Search",
    "keywords": ["iphone"],
    "marketplace": "facebook"
  }'
```

Wait for worker to run (every 10 minutes), then check `/api/deals`.

---

## ⚡ Automated Script

```bash
./docs/force_first_listing.sh facebook
```

Follow prompts. Choose Method 1 (URL) for instant results.

---

## ✅ Success Verification

### 1. API Returns Listing
```bash
curl https://flipperagents.com/api/deals?marketplace=facebook \
  -H "Cookie: sb-access-token=YOUR_TOKEN" | jq '.deals | length'
# Output: 1 or more
```

### 2. Listing Has Real Data
```bash
curl https://flipperagents.com/api/deals?marketplace=facebook \
  -H "Cookie: sb-access-token=YOUR_TOKEN" | jq '.deals[0].title'
# Output: "iPhone 12 Pro" (not "Pending hydration...")
```

### 3. UI Shows Listing Card
- Navigate to: `https://flipperagents.com/marketplaces/facebook`
- See listing with title, price, image

---

## 🚨 Quick Fixes

### No listings appear
```bash
# Restart workers
az containerapp restart --name mf-worker-scheduler -g magnus-rg
az containerapp restart --name mf-worker-realtime -g magnus-rg
```

### "Pending hydration..." stuck
```bash
# Wait 30 seconds or restart realtime worker
az containerapp restart --name mf-worker-realtime -g magnus-rg
```

### Unauthorized error
- Get fresh auth token from browser DevTools

---

## 📚 Full Documentation

- **Complete Guide:** `docs/5_MINUTE_FIRST_LISTING_CHECKLIST.md`
- **Automated Script:** `docs/force_first_listing.sh`
- **Worker Verification:** `docs/WORKER_VERIFICATION_GUIDE.md`

---

**Time to Success:**
- Method 1 (URL): 30 seconds ⚡
- Method 2 (Search): 2-10 minutes ⏱️
- Method 3 (Direct DB): 10 seconds (requires DB access) 🔧
