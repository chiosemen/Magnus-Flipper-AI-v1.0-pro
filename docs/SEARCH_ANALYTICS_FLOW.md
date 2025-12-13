# Search Analytics - Data Flow

Visual representation of how search performance metrics flow through the system.

---

## 📊 High-Level Flow

```
┌─────────────┐
│   Worker    │  Scrapes marketplace every 10 min
│  Scheduler  │
└──────┬──────┘
       │
       │ 1. Fetch listings
       │ 2. Match against search
       │ 3. Save matches
       │ 4. Record metrics ✨
       │
       ▼
┌──────────────────┐
│   SavedSearch    │  Stores cumulative metrics
│   (Database)     │  - totalListingsScanned
│                  │  - totalMatchesFound
│                  │  - totalRuns
│                  │  - lastRunAt
└──────┬───────────┘
       │
       │ On demand
       │
       ▼
┌──────────────────┐
│   Analytics      │  Calculates derived metrics
│    Service       │  - avgMatchesPerDay
│                  │  - avgMatchesPerRun
│                  │  - daysSinceCreation
└──────┬───────────┘
       │
       │ API call
       │
       ▼
┌──────────────────┐
│  GET /api/       │  Returns stats + activity
│  searches/:id/   │
│  stats           │
└──────┬───────────┘
       │
       │ Fetch on expand
       │
       ▼
┌──────────────────┐
│ SearchStatsPanel │  Displays to user
│   (UI)           │  - Metrics grid
│                  │  - Activity timeline
└──────────────────┘
```

---

## 🔄 Worker Run Cycle

```
Every 10 minutes:

┌────────────────────────────────────────────────────────┐
│ 1. Worker finds active search                          │
│    SELECT * FROM saved_searches WHERE isActive = true  │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│ 2. Scrape marketplace (Facebook/Vinted)                │
│    scrapeFacebookListings(keywords, filters)           │
│    → Returns: 25 listings                              │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│ 3. Match each listing against criteria                 │
│    for (listing of listings) {                         │
│      if (matchesSearch(listing, search)) {             │
│        saveDeal(listing, search.id, user.id)           │
│        matchesCount++                                  │
│      }                                                 │
│    }                                                   │
│    → Matched: 3 listings                               │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│ 4. Record metrics ✨ NEW                               │
│    await recordSearchRun({                             │
│      searchId: search.id,                              │
│      listingsScanned: 25,                              │
│      matchesFound: 3,                                  │
│      runTimestamp: new Date()                          │
│    })                                                  │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│ 5. Database update                                     │
│    UPDATE saved_searches SET                           │
│      last_run_at = NOW(),                              │
│      total_listings_scanned = total_listings_scanned + 25,│
│      total_matches_found = total_matches_found + 3,    │
│      total_runs = total_runs + 1                       │
│    WHERE id = search.id                                │
└────────────────────────────────────────────────────────┘
```

---

## 📱 User View Flow

```
User visits /marketplaces/facebook:

┌────────────────────────────────────────────────────────┐
│ 1. Page renders SavedSearchesList component            │
│    <SavedSearchesList marketplace="facebook" />        │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│ 2. Component fetches user's searches                   │
│    GET /api/searches?marketplace=facebook              │
│    → Returns: Array of searches with basic stats       │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│ 3. Renders each search card                            │
│    ┌──────────────────────────────────────────────┐   │
│    │ iPhone 15 Pro              ● Active          │   │
│    │ Matches: 23  Scanned: 450  Last: 2h ago     │   │
│    │ 📊 View Performance Stats              ▼    │   │
│    └──────────────────────────────────────────────┘   │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│ 4. User clicks "View Performance Stats"                │
│    setExpanded(true) → triggers useEffect              │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│ 5. SearchStatsPanel fetches detailed stats             │
│    GET /api/searches/:id/stats                         │
│    → Returns: Comprehensive stats + activity timeline  │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│ 6. Panel expands with full details                     │
│    ┌────────────────────────────────────────────────┐ │
│    │ 📊 Performance Stats                      ▲   │ │
│    │ ┌────┐ ┌────┐ ┌────┐ ┌────┐              │ │
│    │ │ 23 │ │450 │ │5.7 │ │18  │              │ │
│    │ └────┘ └────┘ └────┘ └────┘              │ │
│    │ Last Run: 2h ago  •  Active: 4 days      │ │
│    │                                           │ │
│    │ RECENT MATCHES (20)                       │ │
│    │ [img] iPhone 15 Pro 256GB  $899  2h ago   │ │
│    │ [img] iPhone 15 Pro Max    $1,099 3h ago  │ │
│    └────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

```
saved_searches table:

┌─────────────────────────────────────────────────────┐
│ id                   UUID PRIMARY KEY                │
│ user_id              UUID → users.id                 │
│ name                 VARCHAR                         │
│ query                VARCHAR                         │
│ marketplace          VARCHAR (facebook/vinted)       │
│ filters              JSON                            │
│ is_active            BOOLEAN                         │
│ created_at           TIMESTAMPTZ                     │
│ updated_at           TIMESTAMPTZ                     │
│                                                       │
│ ✨ NEW ANALYTICS FIELDS:                            │
│ last_run_at          TIMESTAMPTZ                     │
│ total_listings_scanned  INTEGER DEFAULT 0            │
│ total_matches_found     INTEGER DEFAULT 0            │
│ total_runs              INTEGER DEFAULT 0            │
└─────────────────────────────────────────────────────┘

alerts table (for activity timeline):

┌─────────────────────────────────────────────────────┐
│ id                   UUID PRIMARY KEY                │
│ user_id              UUID → users.id                 │
│ saved_search_id      UUID → saved_searches.id        │
│ listing_id           VARCHAR                         │
│ title                VARCHAR                         │
│ price                FLOAT                           │
│ marketplace          VARCHAR                         │
│ url                  VARCHAR                         │
│ metadata             JSON (includes imageUrl)        │
│ created_at           TIMESTAMPTZ                     │
└─────────────────────────────────────────────────────┘
```

---

## 🧮 Metric Calculations

### Stored Metrics (Direct from DB)
```sql
SELECT 
  total_listings_scanned,
  total_matches_found,
  total_runs,
  last_run_at
FROM saved_searches
WHERE id = :searchId;
```

### Calculated Metrics (On Demand)
```typescript
// Days since creation
const daysSinceCreation = Math.max(1, 
  Math.floor((Date.now() - createdAt.getTime()) / 86400000)
);

// Average matches per day
const avgMatchesPerDay = totalMatchesFound / daysSinceCreation;

// Average matches per run
const avgMatchesPerRun = totalRuns > 0 
  ? totalMatchesFound / totalRuns 
  : 0;
```

### Activity Timeline
```sql
SELECT 
  created_at as date,
  title,
  price,
  marketplace,
  url,
  metadata->>'imageUrl' as image_url
FROM alerts
WHERE saved_search_id = :searchId
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🔄 Real-Time Updates

### Worker Side (Every 10 min)
```
Worker runs → Metrics updated in DB → Reflected next time user fetches
```

### User Side (On demand)
```
User expands panel → Fetches latest stats from DB → Shows current numbers
```

**Note:** No websockets/polling needed - stats update on page reload or panel expand.

---

## 📊 Performance Considerations

### Database Impact
- ✅ **Minimal**: 4 new columns (3 integers, 1 timestamp)
- ✅ **No joins needed** for basic stats
- ✅ **Indexed query** for user's searches

### API Performance
- ✅ **Fast**: Single query for stats
- ✅ **Lazy loading**: Stats only fetched when panel expanded
- ✅ **Cacheable**: Stats don't change frequently

### Worker Performance
- ✅ **Lightweight**: Single UPDATE per search
- ✅ **Non-blocking**: Metrics recorded after matches saved
- ✅ **Error-tolerant**: Failed metric recording doesn't break worker

---

## 🎯 User Journey

```
Day 1:
┌────────────────────────────────────────────────────┐
│ User creates search → Worker hasn't run yet        │
│ Metrics: 0 matches, 0 scanned, Never run          │
└────────────────────────────────────────────────────┘

Day 1 (after 10 min):
┌────────────────────────────────────────────────────┐
│ Worker runs first time → Finds 2 matches           │
│ Metrics: 2 matches, 20 scanned, 10m ago           │
└────────────────────────────────────────────────────┘

Day 2:
┌────────────────────────────────────────────────────┐
│ Worker has run 18 times → Found 23 total matches   │
│ Metrics: 23 matches, 450 scanned, 2h ago          │
│ Avg: 11.5 matches/day, 1.3 matches/run            │
│ User sees: "This search is working great!"        │
└────────────────────────────────────────────────────┘

Day 7:
┌────────────────────────────────────────────────────┐
│ Search still active → 127 total matches            │
│ Metrics: 127 matches, 1,800 scanned, 1h ago       │
│ Avg: 18.1 matches/day, 1.2 matches/run            │
│ User: "I should increase my max price"            │
└────────────────────────────────────────────────────┘
```

---

## ✅ Success Metrics

**System knows it's working when:**
- ✅ Every worker run increments `totalRuns`
- ✅ `lastRunAt` updates every 10 minutes
- ✅ `totalListingsScanned` increases with each run
- ✅ `totalMatchesFound` increases when matches found

**User knows it's working when:**
- ✅ See match count increasing over time
- ✅ Can compare different searches
- ✅ Activity timeline shows recent deals
- ✅ "Last run" timestamp is recent

---

**Full Implementation:** `SEARCH_ANALYTICS_IMPLEMENTATION.md`  
**Quick Reference:** `docs/SEARCH_ANALYTICS_QUICK_REF.md`  
**Status:** ✅ Ready for production
