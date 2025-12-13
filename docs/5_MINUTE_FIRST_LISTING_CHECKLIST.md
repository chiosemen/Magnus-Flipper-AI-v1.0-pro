# 5-Minute First Listing Checklist

**Goal:** Force the first live listing to appear on `/marketplaces/facebook` or `/marketplaces/vinted` in production.

**Time:** 5 minutes maximum  
**Environment:** Production (`https://flipperagents.com`)

---

## Prerequisites (30 seconds)

1. **Authentication Token:**
   ```bash
   # Get your auth token from browser
   # 1. Login to https://flipperagents.com
   # 2. Open DevTools (F12) → Application → Cookies
   # 3. Copy the value of 'sb-access-token' or session cookie
   
   export AUTH_TOKEN="your-session-token-here"
   ```

2. **User ID:**
   ```bash
   # Get your user ID from /api/user or check Supabase dashboard
   export USER_ID="your-user-id-here"
   ```

---

## Method 1: Via Search (Automatic - Workers handle it)

**Total Time:** ~3-5 minutes (depends on worker schedule)

### Step 1: Create a Search (30 seconds)

```bash
# Facebook Search
curl -X POST https://flipperagents.com/api/searches \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" \
  -d '{
    "name": "Test iPhone Search",
    "keywords": ["iphone", "iphone 12"],
    "marketplace": "facebook",
    "minPrice": 100,
    "maxPrice": 500
  }'
```

**Expected Response:**
```json
{
  "id": "search_id_here",
  "name": "Test iPhone Search",
  "marketplace": "facebook",
  "isActive": true,
  "createdAt": "2025-12-13T..."
}
```

✅ **Success Signal:** Response includes `"id"` and `"isActive": true`

---

### Step 2: Wait for Worker to Run (2-10 minutes)

Workers run every 10 minutes. Check logs to see if job has started:

```bash
# Check worker logs
az containerapp logs show \
  --name mf-worker-scheduler \
  --resource-group magnus-rg \
  --tail 20 | grep -E "Facebook Job|🔵"
```

**Expected Log:**
```
[worker-scheduler-001] 🔵 Facebook job START
[Facebook Job] 📊 Processing 1 active Facebook searches
[Facebook Job] ✅ === FACEBOOK JOB COMPLETE === (12.45s)
```

---

### Step 3: Verify Listing in Database (10 seconds)

```bash
# Check if listings were created
curl https://flipperagents.com/api/deals?marketplace=facebook \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq '.deals | length'
```

**Expected:** Number > 0 (listings found)

---

### Step 4: Verify Listing in UI (10 seconds)

Navigate to: `https://flipperagents.com/marketplaces/facebook`

✅ **Success Signal:** You see listing cards with titles, prices, and images

---

## Method 2: Direct URL Submission (Manual - Immediate)

**Total Time:** ~1-2 minutes (immediate hydration)

### Step 1: Submit a ToS-Safe Listing URL (30 seconds)

```bash
# Facebook Marketplace listing (public, ToS-safe)
curl -X POST https://flipperagents.com/api/ingest/facebook/submit \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" \
  -d '{
    "url": "https://www.facebook.com/marketplace/item/123456789/"
  }'
```

**Alternative ToS-Safe URLs:**
- Facebook: `https://www.facebook.com/marketplace/item/[item-id]/`
- Vinted: `https://www.vinted.com/items/[item-id]`

**Expected Response:**
```json
{
  "success": true,
  "message": "Listing submitted for hydration",
  "listingId": "listing_id_here"
}
```

✅ **Success Signal:** `"success": true` and you have a `listingId`

---

### Step 2: Verify Listing Created (Immediate)

```bash
# Check database for the listing
curl https://flipperagents.com/api/deals?marketplace=facebook \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq '.deals[0]'
```

**Expected:**
```json
{
  "id": "listing_id_here",
  "title": "Pending hydration..." or "Actual listing title",
  "marketplace": "facebook",
  "buyPrice": 0 or actual_price,
  "buyUrl": "https://www.facebook.com/marketplace/item/...",
  "status": "active"
}
```

✅ **Success Signal:** Listing exists with the URL you submitted

---

### Step 3: Trigger Hydration (30 seconds)

Hydration happens automatically via `worker-realtime` every 2 minutes. To speed it up:

```bash
# Restart realtime worker to trigger immediate hydration
az containerapp restart \
  --name mf-worker-realtime \
  --resource-group magnus-rg
```

**Wait 30 seconds**, then check again:

```bash
curl https://flipperagents.com/api/deals?marketplace=facebook \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq '.deals[0]'
```

**Expected:** `title` is now populated with real data (not "Pending hydration...")

---

### Step 4: Verify in UI (10 seconds)

Navigate to: `https://flipperagents.com/marketplaces/facebook`

✅ **Success Signal:** Listing card shows:
- Real title (not "Pending hydration...")
- Price
- Image
- Location
- "View Deal" button links to original URL

---

## Method 3: Emergency Fallback (Manual Trigger - 1 minute)

If workers are not running or you need immediate results:

### Option A: Create Listing Directly in Database

```bash
# Use Supabase Studio or psql to insert a listing
# Navigate to: https://supabase.com/dashboard/project/[your-project]/editor

# SQL:
INSERT INTO listings (
  external_id,
  marketplace,
  title,
  price,
  url,
  location,
  description,
  image_url,
  is_active,
  first_seen,
  last_seen
) VALUES (
  'facebook_manual_test_001',
  'facebook',
  'iPhone 12 Pro - Unlocked',
  499.00,
  'https://www.facebook.com/marketplace/item/123456789/',
  'San Francisco, CA',
  'Like new iPhone 12 Pro, 128GB, unlocked. No scratches.',
  'https://example.com/image.jpg',
  true,
  NOW(),
  NOW()
);
```

✅ **Success Signal:** 1 row inserted

---

### Option B: Use Admin Panel (if available)

1. Navigate to: `https://flipperagents.com/admin/marketplaces`
2. Click "Add Test Listing"
3. Fill in form:
   - Marketplace: Facebook
   - Title: iPhone 12 Pro
   - Price: $499
   - URL: (Facebook Marketplace URL)
4. Click "Create"

---

## Verification Checklist

After completing any method above, verify all 3 conditions:

### ✅ 1. Database Check
```bash
curl https://flipperagents.com/api/deals?marketplace=facebook \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq '.deals | length'
```
**Expected:** `> 0`

### ✅ 2. API Response Check
```bash
curl https://flipperagents.com/api/deals?marketplace=facebook \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq '.deals[0] | {title, buyPrice, marketplace, status}'
```
**Expected:**
```json
{
  "title": "Real listing title",
  "buyPrice": 499,
  "marketplace": "facebook",
  "status": "active"
}
```

### ✅ 3. UI Visibility Check
1. Navigate to: `https://flipperagents.com/marketplaces/facebook`
2. Verify you see:
   - Listing card with title
   - Price displayed
   - Image loaded
   - "View Deal" button

---

## Common Issues & Solutions

### Issue 1: "Unauthorized" Error
**Solution:**
```bash
# Get fresh auth token
# 1. Login to https://flipperagents.com
# 2. Open DevTools → Application → Cookies
# 3. Copy 'sb-access-token' or session cookie value
# 4. Update AUTH_TOKEN
```

### Issue 2: No Listings Appear After Search Creation
**Solution:**
```bash
# Check if worker is running
az containerapp show \
  --name mf-worker-scheduler \
  --resource-group magnus-rg \
  --query "properties.runningStatus" -o tsv

# If "Stopped", restart:
az containerapp restart \
  --name mf-worker-scheduler \
  --resource-group magnus-rg

# Wait 2 minutes, then check logs
az containerapp logs show \
  --name mf-worker-scheduler \
  --resource-group magnus-rg \
  --tail 20 | grep "Facebook Job"
```

### Issue 3: "Pending hydration..." Still Shows
**Solution:**
```bash
# Restart realtime worker
az containerapp restart \
  --name mf-worker-realtime \
  --resource-group magnus-rg

# Wait 30 seconds, then refresh API
curl https://flipperagents.com/api/deals?marketplace=facebook \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq '.deals[0].title'
```

### Issue 4: UI Shows Empty State
**Solution:**
```bash
# Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
# Check if API returns data:
curl https://flipperagents.com/api/deals?marketplace=facebook \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq '.deals | length'

# If API returns data but UI is empty, check browser console for errors
```

---

## Quick Commands Reference

```bash
# Get auth token (manual - from browser DevTools)
# DevTools → Application → Cookies → sb-access-token

# Create Facebook search
curl -X POST https://flipperagents.com/api/searches \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" \
  -d '{"name":"iPhone","keywords":["iphone"],"marketplace":"facebook"}'

# Submit listing URL
curl -X POST https://flipperagents.com/api/ingest/facebook/submit \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" \
  -d '{"url":"https://www.facebook.com/marketplace/item/123456789/"}'

# Check API for listings
curl https://flipperagents.com/api/deals?marketplace=facebook \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq

# Check worker logs
az containerapp logs show --name mf-worker-scheduler -g magnus-rg --tail 20

# Restart workers
az containerapp restart --name mf-worker-scheduler -g magnus-rg
az containerapp restart --name mf-worker-realtime -g magnus-rg
```

---

## Success Metrics

**You've successfully completed the checklist if:**

1. ✅ API returns at least 1 listing:
   ```bash
   curl https://flipperagents.com/api/deals?marketplace=facebook -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq '.deals | length'
   # Output: 1 or more
   ```

2. ✅ Listing has real data (not "Pending hydration..."):
   ```bash
   curl https://flipperagents.com/api/deals?marketplace=facebook -H "Cookie: sb-access-token=$AUTH_TOKEN" | jq '.deals[0].title'
   # Output: "iPhone 12 Pro" (or similar real title)
   ```

3. ✅ UI shows listing card at `https://flipperagents.com/marketplaces/facebook`:
   - Title visible
   - Price displayed
   - Image loaded
   - "View Deal" button present

---

## Timeline Comparison

| Method | Time to First Listing | Pros | Cons |
|--------|----------------------|------|------|
| **Method 1: Search** | 2-10 minutes | Automatic, realistic | Depends on worker schedule |
| **Method 2: URL Submit** | 30 seconds - 2 minutes | Fast, controlled | Requires valid URL |
| **Method 3: Direct DB** | 10 seconds | Instant | Manual, requires DB access |

**Recommended:** Use **Method 2 (URL Submit)** for fastest guaranteed results.

---

## ToS-Safe Test URLs

**Facebook Marketplace:**
- Any public listing: `https://www.facebook.com/marketplace/item/[item-id]/`
- Public search: `https://www.facebook.com/marketplace/search/?query=iphone`

**Vinted:**
- Any public listing: `https://www.vinted.com/items/[item-id]`
- Public search: `https://www.vinted.com/catalog?search_text=iphone`

**Note:** Only use publicly accessible URLs. Do not scrape private or restricted content.

---

## Next Steps After First Listing

1. **Create more searches** to populate the marketplace feed
2. **Set up monitoring** to track worker health
3. **Verify worker logs** show consistent scraping
4. **Check listing refresh** - workers should update listings every 10 minutes

---

**Last Updated:** 2025-12-13  
**Tested On:** Production environment (`https://flipperagents.com`)
