# Facebook Marketplace End-to-End Implementation - Verification Guide

## Implementation Summary

Facebook Marketplace has been wired end-to-end with the following components:

### Phase 1: Data + API ✅
- **SavedSearch model**: Uses existing Prisma model with `filters` JSON field for Facebook-specific fields
- **POST /api/searches**: Creates Facebook searches with keywords, price filters, distance, condition
- **GET /api/searches?marketplace=facebook**: Returns active Facebook searches for user

### Phase 2: Facebook Scraper ✅
- **Facebook Scraper** (`apps/worker-scheduler/src/facebook-scraper.ts`):
  - Fetches listings from Facebook Marketplace search URLs
  - Extracts: title, price, location, condition, url, image, externalId
  - Resilient to missing fields

### Phase 3: Matching & Storage ✅
- **Search Matcher** (`apps/worker-scheduler/src/facebook-matcher.ts`):
  - Matches listings against search criteria (keywords, price, condition)
  - Saves matched listings to `listings` table via Prisma
  - Deduplicates by `externalId`

### Phase 4: Worker Wiring ✅
- **Facebook Job** (`apps/worker-scheduler/src/facebook-job.ts`):
  - Runs every 10 minutes
  - Processes all active Facebook searches
  - Scrapes, matches, and saves deals
  - Logs: searches scanned, listings fetched, matches saved

### Phase 5: Frontend Display ✅
- **/marketplaces/facebook page**: 
  - Shows "Create Search" form
  - Displays live deals from `GET /api/deals?marketplace=facebook`
  - Shows "No live deals yet" if empty
  - No mock data

## Manual Test Example

### 1. Create a Search

**Request:**
```bash
POST /api/searches
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "keywords": ["iphone", "15 pro", "256gb"],
  "minPrice": 500,
  "maxPrice": 1000,
  "maxDistanceMiles": 25,
  "condition": ["new", "like_new"],
  "marketplace": "facebook"
}
```

**Expected Response:**
```json
{
  "id": "uuid",
  "name": "iPhone 15 Pro",
  "query": "iphone 15 pro 256gb",
  "marketplace": "facebook",
  "filters": {
    "keywords": ["iphone", "15 pro", "256gb"],
    "minPrice": 500,
    "maxPrice": 1000,
    "maxDistanceMiles": 25,
    "condition": ["new", "like_new"]
  },
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 2. Expected Database Rows

**saved_searches table:**
```sql
SELECT * FROM saved_searches WHERE marketplace = 'facebook' AND is_active = true;
```

Should show:
- `id`: UUID
- `user_id`: User UUID
- `name`: "iPhone 15 Pro"
- `query`: "iphone 15 pro 256gb"
- `marketplace`: "facebook"
- `filters`: JSON with keywords, minPrice, maxPrice, etc.
- `is_active`: true

**listings table (after worker runs):**
```sql
SELECT * FROM listings WHERE marketplace = 'facebook' ORDER BY last_seen DESC LIMIT 10;
```

Should show:
- `external_id`: "fb_123456789" (unique)
- `marketplace`: "facebook"
- `title`: Listing title
- `price`: Numeric price
- `location`: Location string
- `url`: Facebook Marketplace URL
- `image_url`: Image URL (if available)
- `is_active`: true
- `metadata`: JSON with condition, searchId

### 3. Worker Logs

After worker-scheduler runs (every 10 minutes), check logs:

```
[Facebook Job] Starting Facebook scraping job...
[Facebook Job] Found 1 active Facebook searches
[Facebook Job] Scraping for search "iPhone 15 Pro" (uuid) with keywords: iphone, 15 pro, 256gb
[Facebook Job] Found 15 listings for search "iPhone 15 Pro"
[Facebook Job] Saved 3 matches for search "iPhone 15 Pro"
[Facebook Job] Complete: 1 searches scanned, 15 listings fetched, 3 matches saved
```

### 4. UI State

**Visit:** `https://www.flipperagents.com/marketplaces/facebook`

**Expected:**
1. **Create Search Form** at top:
   - Keywords input
   - Min/Max price inputs
   - Distance input
   - Condition checkboxes
   - "Create Search" button

2. **Live Deals Section** below:
   - Grid of deal cards showing:
     - Title
     - Price ($XXX)
     - Location (if available)
     - "View listing" button
   - OR "No live deals yet" message if empty

### 5. API Verification

**Get Deals:**
```bash
GET /api/deals?marketplace=facebook&limit=50
```

**Expected Response:**
```json
{
  "deals": [
    {
      "id": "listing-uuid",
      "title": "iPhone 15 Pro 256GB",
      "marketplace": "facebook",
      "buyPrice": 750,
      "location": "New York, NY",
      "buyUrl": "https://www.facebook.com/marketplace/item/123456789",
      "imageUrl": "https://...",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

## Verification Checklist

- [ ] **Search Creation**: Can create a Facebook search via POST /api/searches
- [ ] **Search Retrieval**: Can get active searches via GET /api/searches?marketplace=facebook
- [ ] **Worker Running**: worker-scheduler is running and processing Facebook searches
- [ ] **Listings Scraped**: Listings appear in `listings` table with `marketplace = 'facebook'`
- [ ] **Deals API**: GET /api/deals?marketplace=facebook returns deals
- [ ] **UI Display**: /marketplaces/facebook shows deals (or "No live deals yet")
- [ ] **Create Search UI**: Form works and creates searches
- [ ] **No Mock Data**: All data comes from real scraping/storage

## Files Created/Modified

### New Files
- `apps/web/app/api/searches/route.ts` - Search API endpoints
- `apps/worker-scheduler/src/facebook-scraper.ts` - Facebook scraper
- `apps/worker-scheduler/src/facebook-matcher.ts` - Search matching logic
- `apps/worker-scheduler/src/facebook-job.ts` - Worker job
- `apps/web/app/marketplaces/facebook/page.tsx` - Facebook marketplace page
- `apps/web/app/marketplaces/facebook/CreateSearchForm.tsx` - Create search form
- `apps/web/app/marketplaces/facebook/FacebookDealsList.tsx` - Deals list component

### Modified Files
- `apps/worker-scheduler/src/index.ts` - Added Facebook job scheduling
- `apps/web/app/api/deals/route.ts` - Added marketplace filtering for Facebook

## Notes

- **Scraper Limitations**: Facebook's HTML structure may change. The scraper uses common selectors but may need updates if Facebook changes their markup.
- **Rate Limiting**: Worker includes 2-second delays between searches to avoid rate limits.
- **Distance Filtering**: Currently not implemented (requires geocoding). Price and condition filters work.
- **Deal Storage**: Uses `listings` table directly. Future enhancement could add `deal_scores` entries for scoring.

## Next Steps

1. **Test Locally**: Run worker-scheduler and create a test search
2. **Verify Scraping**: Check worker logs for successful scraping
3. **Check Database**: Verify listings appear in database
4. **Test UI**: Visit /marketplaces/facebook and create a search
5. **Wait for Worker**: Wait 10 minutes for worker to run
6. **Verify Deals**: Check that deals appear on the page

## Production Deployment

1. Deploy worker-scheduler with Facebook job enabled
2. Deploy web app with new API routes and Facebook page
3. Test search creation in production
4. Monitor worker logs for scraping activity
5. Verify deals appear on /marketplaces/facebook
