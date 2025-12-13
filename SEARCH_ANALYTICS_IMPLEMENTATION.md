# Search Performance Analytics - Implementation Summary

Complete system for exposing search performance metrics to users.

---

## 📊 Metrics Per Search

Each saved search now tracks:

| Metric | Description | Updated By |
|--------|-------------|------------|
| **Listings Scanned** | Total number of listings fetched from marketplace | Worker on each run |
| **Matches Found** | Total number of listings that matched criteria | Worker on each run |
| **Last Run Timestamp** | When the search was last processed | Worker on each run |
| **Total Runs** | How many times the search has been processed | Worker on each run |
| **Avg Matches/Day** | Average matches per day since creation | Calculated on demand |
| **Avg Matches/Run** | Average matches per worker run | Calculated on demand |
| **Days Since Creation** | How long the search has been active | Calculated on demand |
| **Marketplace Source** | facebook or vinted | Stored in search |

---

## 🏗️ Implementation

### 1. Database Schema Extensions

**File:** `packages/core/prisma/schema.prisma`

**Changes:**
```prisma
model SavedSearch {
  // ... existing fields
  
  // ✅ NEW: Performance metrics
  lastRunAt         DateTime? @map("last_run_at") @db.Timestamptz(6)
  totalListingsScanned Int    @default(0) @map("total_listings_scanned")
  totalMatchesFound    Int    @default(0) @map("total_matches_found")
  totalRuns            Int    @default(0) @map("total_runs")
}
```

**Migration Required:**
```sql
ALTER TABLE saved_searches 
ADD COLUMN last_run_at TIMESTAMPTZ,
ADD COLUMN total_listings_scanned INTEGER DEFAULT 0,
ADD COLUMN total_matches_found INTEGER DEFAULT 0,
ADD COLUMN total_runs INTEGER DEFAULT 0;
```

---

### 2. Analytics Service

**File:** `packages/core/src/analytics/search-analytics.ts` (NEW - 240 lines)

**Key Functions:**

#### `recordSearchRun(metrics)`
Records metrics after each worker run.

```typescript
await recordSearchRun({
  searchId: "uuid",
  listingsScanned: 25,
  matchesFound: 3,
  runTimestamp: new Date(),
});
```

**Updates:**
- Increments `totalListingsScanned`
- Increments `totalMatchesFound`
- Increments `totalRuns`
- Sets `lastRunAt` timestamp

---

#### `getSearchStats(searchId)`
Returns comprehensive stats for a single search.

```typescript
const stats = await getSearchStats("uuid");
// Returns:
{
  searchId: "uuid",
  searchName: "iPhone 15 Pro",
  marketplace: "facebook",
  totalListingsScanned: 450,
  totalMatchesFound: 23,
  totalRuns: 18,
  lastRunAt: "2025-12-13T10:30:00Z",
  avgMatchesPerDay: 5.7,
  avgMatchesPerRun: 1.3,
  createdAt: "2025-12-09T08:00:00Z",
  daysSinceCreation: 4
}
```

---

#### `getSearchActivityTimeline(searchId, limit)`
Returns recent matches (for activity feed).

```typescript
const activity = await getSearchActivityTimeline("uuid", 20);
// Returns:
[
  {
    date: "2025-12-13T09:45:00Z",
    title: "iPhone 15 Pro 256GB",
    price: 899,
    marketplace: "facebook",
    url: "https://...",
    imageUrl: "https://..."
  },
  // ... more matches
]
```

---

#### `getUserSearchStats(userId)`
Returns stats for all user's searches.

---

#### `getUserAggregatedStats(userId)`
Returns aggregated stats across all searches.

```typescript
const aggregated = await getUserAggregatedStats("user-id");
// Returns:
{
  totalSearches: 5,
  activeSearches: 4,
  totalMatches: 127,
  totalListingsScanned: 2340,
  avgMatchesPerDay: 8.5
}
```

---

### 3. Worker Integration

**Files Modified:**
- `apps/worker-scheduler/src/facebook-job.ts`
- `apps/worker-scheduler/src/vinted-job.ts`

**Changes:**
```typescript
import { recordSearchRun } from "@magnus-flipper-ai/core/analytics/search-analytics";

// After processing each search:
await recordSearchRun({
  searchId: search.id,
  listingsScanned: listings.length,
  matchesFound: matchesCount,
  runTimestamp: new Date(),
});
```

**Worker Log Output:**
```
[Facebook Job] 🔍 Search "iPhone 15 Pro" (ID: abc123)
[Facebook Job]    └─ Keywords: iphone, 15 pro
[Facebook Job]    └─ 📦 Fetched 25 listings
[Facebook Job]    └─ 💾 Saved 3 matches
[Analytics] Recorded run for search abc123: 25 scanned, 3 matches
```

---

### 4. API Endpoints

#### GET /api/searches/:id/stats

**File:** `apps/web/app/api/searches/[id]/stats/route.ts` (NEW - 80 lines)

**Authorization:** Must be search owner

**Response:**
```json
{
  "stats": {
    "searchId": "abc123",
    "searchName": "iPhone 15 Pro",
    "marketplace": "facebook",
    "totalListingsScanned": 450,
    "totalMatchesFound": 23,
    "totalRuns": 18,
    "lastRunAt": "2025-12-13T10:30:00.000Z",
    "avgMatchesPerDay": 5.7,
    "avgMatchesPerRun": 1.3,
    "createdAt": "2025-12-09T08:00:00.000Z",
    "daysSinceCreation": 4
  },
  "activity": [
    {
      "date": "2025-12-13T09:45:00.000Z",
      "title": "iPhone 15 Pro 256GB",
      "price": 899,
      "marketplace": "facebook",
      "url": "https://...",
      "imageUrl": "https://..."
    }
  ]
}
```

**Error Responses:**
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (not search owner)
- `404` - Search not found

---

#### GET /api/searches (Enhanced)

**File:** `apps/web/app/api/searches/route.ts` (Modified)

**Enhancement:** Now includes basic stats in search list.

**Response:**
```json
[
  {
    "id": "abc123",
    "name": "iPhone 15 Pro",
    "query": "iphone 15 pro",
    "marketplace": "facebook",
    "filters": {...},
    "isActive": true,
    "createdAt": "2025-12-09T08:00:00.000Z",
    "updatedAt": "2025-12-13T10:30:00.000Z",
    "stats": {
      "totalMatchesFound": 23,
      "totalListingsScanned": 450,
      "lastRunAt": "2025-12-13T10:30:00.000Z"
    }
  }
]
```

---

### 5. UI Components

#### SearchStatsPanel Component

**File:** `apps/web/components/SearchStatsPanel.tsx` (NEW - 250 lines)

**Props:**
```typescript
interface SearchStatsPanelProps {
  searchId: string;
  searchName: string;
}
```

**Features:**
- ✅ Collapsible panel (collapsed by default)
- ✅ Lazy loading (only fetches when expanded)
- ✅ Key metrics grid (4 cards)
- ✅ Activity timeline (recent matches)
- ✅ Relative time formatting (e.g., "2h ago", "3d ago")
- ✅ Price formatting ($1,234.56)
- ✅ Thumbnail images
- ✅ External links to listings

**UI State Examples:**

**Collapsed:**
```
┌─────────────────────────────────────┐
│ 📊 View Performance Stats        ▼  │
└─────────────────────────────────────┘
```

**Expanded:**
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Performance Stats                              ▲     │
├─────────────────────────────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────┐ │
│  │ Total      │ │ Listings   │ │ Avg/Day    │ │ Total │ │
│  │ Matches    │ │ Scanned    │ │            │ │ Runs  │ │
│  │    23      │ │    450     │ │    5.7     │ │  18   │ │
│  └────────────┘ └────────────┘ └────────────┘ └───────┘ │
│                                                           │
│  Last Run: 2h ago    •    Active: 4 days                │
│  Average 1.3 matches per run • facebook                 │
│                                                           │
│  RECENT MATCHES (20)                                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │ [img] iPhone 15 Pro 256GB          $899  2h ago │    │
│  │ [img] iPhone 15 Pro Max            $1,099 3h ago│    │
│  │ [img] iPhone 15 Pro Unlocked       $850  5h ago │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

#### SavedSearchesList Component

**File:** `apps/web/components/SavedSearchesList.tsx` (NEW - 170 lines)

**Props:**
```typescript
interface SavedSearchesListProps {
  marketplace: "facebook" | "vinted";
}
```

**Features:**
- ✅ Lists all user's searches for a marketplace
- ✅ Shows active/paused status
- ✅ Displays quick stats inline
- ✅ Embeds SearchStatsPanel for each search
- ✅ Auto-refresh on mount
- ✅ Loading skeletons

**UI State:**

**Loading:**
```
┌─────────────────────────────────┐
│ ████████████                    │ (animated pulse)
│ ████████                        │
│ ██████████                      │
└─────────────────────────────────┘
```

**Populated:**
```
┌──────────────────────────────────────────────────────┐
│ iPhone 15 Pro                            ● Active    │
│ Keywords: iphone, 15 pro  •  Min: $800  •  Max: $1200│
│                                                       │
│ Matches: 23   Scanned: 450   Last run: 2h ago       │
│                                                       │
│ 📊 View Performance Stats                         ▼  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ MacBook Air M2                          ⏸ Paused     │
│ Keywords: macbook, air, m2  •  Max: $1000           │
│                                                       │
│ Matches: 5    Scanned: 120   Last run: 1d ago       │
│                                                       │
│ 📊 View Performance Stats                         ▼  │
└──────────────────────────────────────────────────────┘
```

---

### 6. Page Integration

**Files Modified:**
- `apps/web/app/marketplaces/facebook/page.tsx`
- `apps/web/app/marketplaces/vinted/page.tsx`

**New Section Added:**
```tsx
{/* Saved Searches Section */}
<section className="py-12 bg-[#0A0A0A]">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
          Your Searches
        </h2>
        <p className="text-white/70 text-sm font-medium">
          Monitor performance and see what's working
        </p>
      </div>
      <SavedSearchesList marketplace="facebook" />
    </div>
  </div>
</section>
```

**Location:** Between "Create Search" and "Live Deals" sections

---

## 📐 API Contract

### GET /api/searches/:id/stats

**Request:**
```http
GET /api/searches/abc123-def456-ghi789/stats
Authorization: Cookie (session)
```

**Response (200):**
```json
{
  "stats": {
    "searchId": "abc123-def456-ghi789",
    "searchName": "iPhone 15 Pro",
    "marketplace": "facebook",
    "totalListingsScanned": 450,
    "totalMatchesFound": 23,
    "totalRuns": 18,
    "lastRunAt": "2025-12-13T10:30:00.000Z",
    "avgMatchesPerDay": 5.7,
    "avgMatchesPerRun": 1.3,
    "createdAt": "2025-12-09T08:00:00.000Z",
    "daysSinceCreation": 4
  },
  "activity": [
    {
      "date": "2025-12-13T09:45:00.000Z",
      "title": "iPhone 15 Pro 256GB",
      "price": 899,
      "marketplace": "facebook",
      "url": "https://facebook.com/marketplace/item/...",
      "imageUrl": "https://..."
    }
  ]
}
```

**Response (401):**
```json
{
  "error": "Unauthorized"
}
```

**Response (403):**
```json
{
  "error": "Forbidden"
}
```

**Response (404):**
```json
{
  "error": "Search not found"
}
```

---

### GET /api/searches?marketplace=facebook

**Request:**
```http
GET /api/searches?marketplace=facebook
Authorization: Cookie (session)
```

**Response (200):**
```json
[
  {
    "id": "abc123",
    "name": "iPhone 15 Pro",
    "query": "iphone 15 pro",
    "marketplace": "facebook",
    "filters": {
      "keywords": ["iphone", "15", "pro"],
      "minPrice": 800,
      "maxPrice": 1200
    },
    "isActive": true,
    "createdAt": "2025-12-09T08:00:00.000Z",
    "updatedAt": "2025-12-13T10:30:00.000Z",
    "stats": {
      "totalMatchesFound": 23,
      "totalListingsScanned": 450,
      "lastRunAt": "2025-12-13T10:30:00.000Z"
    }
  }
]
```

---

## 📍 UI Component Locations

| Component | File Path | Usage |
|-----------|-----------|-------|
| **SearchStatsPanel** | `apps/web/components/SearchStatsPanel.tsx` | Embedded in SavedSearchesList |
| **SavedSearchesList** | `apps/web/components/SavedSearchesList.tsx` | Used on marketplace pages |
| **Facebook Page** | `apps/web/app/marketplaces/facebook/page.tsx` | Includes SavedSearchesList |
| **Vinted Page** | `apps/web/app/marketplaces/vinted/page.tsx` | Includes SavedSearchesList |

---

## 📊 Example UI States

### State 1: New Search (No Activity Yet)

**SavedSearchesList:**
```
┌──────────────────────────────────────────────────────┐
│ iPhone 15 Pro                            ● Active    │
│ Keywords: iphone, 15 pro  •  Min: $800  •  Max: $1200│
│                                                       │
│ Matches: 0    Scanned: 0   Last run: Never          │
│                                                       │
│ 📊 View Performance Stats                         ▼  │
└──────────────────────────────────────────────────────┘
```

**SearchStatsPanel (expanded):**
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Performance Stats                              ▲     │
├─────────────────────────────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────┐ │
│  │ Total      │ │ Listings   │ │ Avg/Day    │ │ Total │ │
│  │ Matches    │ │ Scanned    │ │            │ │ Runs  │ │
│  │     0      │ │     0      │ │    0.0     │ │   0   │ │
│  └────────────┘ └────────────┘ └────────────┘ └───────┘ │
│                                                           │
│  Last Run: Never    •    Active: 1 day                  │
│  Average 0.0 matches per run • facebook                 │
│                                                           │
│         No matches yet. Keep this search active and      │
│         we'll notify you when we find deals!             │
└─────────────────────────────────────────────────────────┘
```

---

### State 2: Active Search with Results

**SavedSearchesList:**
```
┌──────────────────────────────────────────────────────┐
│ iPhone 15 Pro                            ● Active    │
│ Keywords: iphone, 15 pro  •  Min: $800  •  Max: $1200│
│                                                       │
│ Matches: 23   Scanned: 450   Last run: 2h ago       │
│                                                       │
│ 📊 View Performance Stats                         ▼  │
└──────────────────────────────────────────────────────┘
```

**SearchStatsPanel (expanded with activity):**
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Performance Stats                              ▲     │
├─────────────────────────────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────┐ │
│  │ Total      │ │ Listings   │ │ Avg/Day    │ │ Total │ │
│  │ Matches    │ │ Scanned    │ │            │ │ Runs  │ │
│  │    23      │ │    450     │ │    5.7     │ │  18   │ │
│  └────────────┘ └────────────┘ └────────────┘ └───────┘ │
│                                                           │
│  Last Run: 2h ago    •    Active: 4 days                │
│  Average 1.3 matches per run • facebook                 │
│                                                           │
│  RECENT MATCHES (20)                                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │ [📱] iPhone 15 Pro 256GB     $899    2h ago  →  │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ [📱] iPhone 15 Pro Max       $1,099  3h ago  →  │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ [📱] iPhone 15 Pro Unlocked  $850    5h ago  →  │    │
│  └─────────────────────────────────────────────────┘    │
│                     ... 17 more                          │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Summary

**Files Created:**
- `packages/core/src/analytics/search-analytics.ts` (240 lines)
- `apps/web/app/api/searches/[id]/stats/route.ts` (80 lines)
- `apps/web/components/SearchStatsPanel.tsx` (250 lines)
- `apps/web/components/SavedSearchesList.tsx` (170 lines)

**Files Modified:**
- `packages/core/prisma/schema.prisma` (added 4 fields)
- `apps/worker-scheduler/src/facebook-job.ts` (added recordSearchRun call)
- `apps/worker-scheduler/src/vinted-job.ts` (added recordSearchRun call)
- `apps/web/app/api/searches/route.ts` (added stats to response)
- `apps/web/app/marketplaces/facebook/page.tsx` (added SavedSearchesList)
- `apps/web/app/marketplaces/vinted/page.tsx` (added SavedSearchesList)

**Total:** 4 new files, 6 modified files (~800 lines of code)

**Features:**
- ✅ Real-time metrics tracking per search
- ✅ Comprehensive stats API
- ✅ Collapsible stats panels
- ✅ Activity timeline with recent matches
- ✅ Visual performance indicators
- ✅ Lightweight (no external analytics tools)
- ✅ Read-only UI (no metric manipulation)

**User Value:**
- See which searches are performing best
- Understand match frequency
- View recent deals at a glance
- Make informed decisions about search criteria

---

**Status:** ✅ Production Ready  
**Migration Required:** Yes (4 new database columns)  
**Implementation Date:** 2025-12-13
