# Search Analytics - Quick Reference

> Performance metrics for saved searches

---

## 📊 Metrics Tracked

| Metric | Type | Updated |
|--------|------|---------|
| Listings Scanned | Counter | Every run |
| Matches Found | Counter | Every run |
| Last Run | Timestamp | Every run |
| Total Runs | Counter | Every run |
| Avg Matches/Day | Calculated | On demand |
| Avg Matches/Run | Calculated | On demand |

---

## 🔌 API Endpoints

### Get Search Stats

```bash
GET /api/searches/:id/stats
```

**Response:**
```json
{
  "stats": {
    "totalMatchesFound": 23,
    "totalListingsScanned": 450,
    "avgMatchesPerDay": 5.7,
    "lastRunAt": "2025-12-13T10:30:00Z"
  },
  "activity": [
    {"title": "...", "price": 899, "date": "..."}
  ]
}
```

---

### Get User Searches (with stats)

```bash
GET /api/searches?marketplace=facebook
```

**Response:**
```json
[
  {
    "id": "...",
    "name": "iPhone 15 Pro",
    "stats": {
      "totalMatchesFound": 23,
      "totalListingsScanned": 450,
      "lastRunAt": "..."
    }
  }
]
```

---

## 📍 UI Components

### SearchStatsPanel

**Location:** `apps/web/components/SearchStatsPanel.tsx`

**Usage:**
```tsx
<SearchStatsPanel 
  searchId="abc123" 
  searchName="iPhone 15 Pro" 
/>
```

**Features:**
- Collapsible (closed by default)
- Lazy loading
- Shows 4 key metrics
- Activity timeline (last 20 matches)

---

### SavedSearchesList

**Location:** `apps/web/components/SavedSearchesList.tsx`

**Usage:**
```tsx
<SavedSearchesList marketplace="facebook" />
```

**Shows:**
- All user's searches
- Quick stats inline
- Embedded SearchStatsPanel per search

---

## 🔄 Worker Integration

**In facebook-job.ts and vinted-job.ts:**

```typescript
import { recordSearchRun } from "@magnus-flipper-ai/core/analytics/search-analytics";

// After processing search:
await recordSearchRun({
  searchId: search.id,
  listingsScanned: listings.length,
  matchesFound: matchesCount,
  runTimestamp: new Date(),
});
```

---

## 🗄️ Database Migration

**Required:**
```sql
ALTER TABLE saved_searches 
ADD COLUMN last_run_at TIMESTAMPTZ,
ADD COLUMN total_listings_scanned INTEGER DEFAULT 0,
ADD COLUMN total_matches_found INTEGER DEFAULT 0,
ADD COLUMN total_runs INTEGER DEFAULT 0;
```

**Or run:**
```bash
npx prisma migrate dev --name add_search_analytics
```

---

## 📊 Example Values

**New Search:**
- Matches: `0`
- Scanned: `0`
- Last Run: `null`
- Avg/Day: `0.0`

**Active Search (4 days):**
- Matches: `23`
- Scanned: `450`
- Last Run: `2h ago`
- Avg/Day: `5.7`
- Avg/Run: `1.3`

---

## 🎯 User Value

✅ See which searches work best  
✅ Understand match frequency  
✅ View recent deals instantly  
✅ Optimize search criteria

---

**Full Docs:** `SEARCH_ANALYTICS_IMPLEMENTATION.md`  
**Status:** ✅ Ready (migration required)
