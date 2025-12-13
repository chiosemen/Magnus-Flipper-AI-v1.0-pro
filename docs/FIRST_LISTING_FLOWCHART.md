# First Listing Launch - Flowchart

## Decision Tree: Which Method to Use?

```
┌─────────────────────────────────────┐
│  Need first listing in production   │
└──────────────┬──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Do you have a valid  │
    │ marketplace URL?     │
    └─────┬────────────┬───┘
          │ YES        │ NO
          ▼            ▼
    ┌─────────┐   ┌──────────────┐
    │ METHOD 1│   │  METHOD 2    │
    │ URL     │   │  Search      │
    │ Submit  │   │  Creation    │
    └────┬────┘   └──────┬───────┘
         │               │
         │               ▼
         │      ┌────────────────┐
         │      │ Wait 2-10 mins │
         │      │ for worker     │
         │      └────────┬───────┘
         │               │
         ▼               ▼
    ┌────────────────────────┐
    │ Listing appears in DB  │
    └───────────┬────────────┘
                │
                ▼
    ┌───────────────────────┐
    │ Verify in UI          │
    │ /marketplaces/...     │
    └───────────────────────┘
```

---

## Method 1: URL Submission Flow

```
┌──────────────────────┐
│ 1. Get Auth Token    │
│ (from browser)       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 2. POST /api/ingest/ │
│    :marketplace/     │
│    submit            │
│    {url: "..."}      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 3. Listing created   │
│    with status:      │
│    "Pending          │
│    hydration..."     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 4. worker-realtime   │
│    picks up listing  │
│    (every 2 minutes) │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 5. Worker hydrates   │
│    (fetches full     │
│    listing details)  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 6. Listing updated   │
│    with real data:   │
│    - Title           │
│    - Price           │
│    - Image           │
│    - Description     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 7. GET /api/deals    │
│    returns listing   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 8. UI displays       │
│    listing card      │
└──────────────────────┘

Time: 30 seconds - 2 minutes
```

---

## Method 2: Search Creation Flow

```
┌──────────────────────┐
│ 1. Get Auth Token    │
│ (from browser)       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 2. POST /api/searches│
│    {                 │
│      name: "...",    │
│      keywords: [...],│
│      marketplace: "" │
│    }                 │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 3. Search saved in   │
│    saved_search      │
│    table             │
│    isActive: true    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 4. Wait for          │
│    worker-scheduler  │
│    to run            │
│    (every 10 mins)   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 5. Worker fetches    │
│    all active        │
│    searches for      │
│    marketplace       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 6. Worker scrapes    │
│    marketplace for   │
│    matching listings │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 7. Worker saves      │
│    listings to DB    │
│    (listings table)  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 8. GET /api/deals    │
│    returns listings  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 9. UI displays       │
│    listing cards     │
└──────────────────────┘

Time: 2-10 minutes
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────┐
│                   USER                          │
└────────┬──────────────────────────┬─────────────┘
         │                          │
         │ POST /api/ingest/        │ POST /api/searches
         │ :marketplace/submit      │
         │                          │
         ▼                          ▼
┌──────────────────┐      ┌──────────────────┐
│  API Endpoint    │      │  API Endpoint    │
│  (Next.js API)   │      │  (Next.js API)   │
└────────┬─────────┘      └────────┬─────────┘
         │                         │
         │ INSERT                  │ INSERT
         ▼                         ▼
┌──────────────────────────────────────────┐
│         DATABASE (Prisma/Postgres)       │
│                                          │
│  ┌──────────────┐    ┌────────────────┐│
│  │  listings    │    │ saved_search   ││
│  │  table       │    │ table          ││
│  │              │    │                ││
│  │ - id         │    │ - id           ││
│  │ - title      │    │ - name         ││
│  │ - price      │    │ - keywords     ││
│  │ - url        │    │ - isActive     ││
│  │ - isActive   │    │ - marketplace  ││
│  └──────────────┘    └────────────────┘│
└───────┬──────────────────────┬──────────┘
        │                      │
        │ POLL (every 2 min)   │ POLL (every 10 min)
        ▼                      ▼
┌─────────────────┐    ┌──────────────────┐
│ worker-realtime │    │ worker-scheduler │
│                 │    │                  │
│ - Hydrates      │    │ - Scrapes        │
│   pending       │    │   marketplace    │
│   listings      │    │ - Matches        │
│                 │    │   searches       │
│                 │    │ - Saves listings │
└─────────────────┘    └──────────────────┘
        │                      │
        │ UPDATE               │ INSERT
        └──────────┬───────────┘
                   ▼
           ┌───────────────┐
           │   DATABASE    │
           │   (updated    │
           │    listings)  │
           └───────┬───────┘
                   │
                   │ GET /api/deals
                   ▼
           ┌───────────────┐
           │   API         │
           │   Endpoint    │
           └───────┬───────┘
                   │
                   │ JSON Response
                   ▼
           ┌───────────────┐
           │   FRONTEND    │
           │   UI          │
           │               │
           │ /marketplaces │
           │ /:marketplace │
           └───────────────┘
```

---

## Verification Flow

```
┌──────────────────────┐
│ Listing submitted    │
│ or search created    │
└──────────┬───────────┘
           │
           ▼
    ┌──────────────┐
    │ Wait 5-30s   │
    └──────┬───────┘
           │
           ▼
┌──────────────────────┐
│ CHECK 1:             │
│ Database             │
│                      │
│ GET /api/deals       │
│ ?marketplace=X       │
└──────────┬───────────┘
           │
           ├─── Length > 0? ─── YES ───┐
           │                           │
           └─── NO ───────────┐        │
                              │        │
                              ▼        ▼
                        ┌──────────┐   ┌──────────────────┐
                        │ WAIT     │   │ CHECK 2:         │
                        │ Restart  │   │ Data Quality     │
                        │ workers  │   │                  │
                        └──────────┘   │ Title != "Pending│
                                       │ hydration..."?   │
                                       └──────┬───────────┘
                                              │
                                              ├─── YES ───┐
                                              │           │
                                              └─── NO ────┼───┐
                                                          │   │
                                                          ▼   ▼
                                                    ┌─────────┐ ┌──────────┐
                                                    │ CHECK 3 │ │ WAIT 30s │
                                                    │ UI      │ │ Restart  │
                                                    │ Visible │ │ workers  │
                                                    └────┬────┘ └──────────┘
                                                         │
                                                         ├─── YES ───┐
                                                         │           │
                                                         └─── NO ────┼───┐
                                                                     │   │
                                                                     ▼   ▼
                                                              ┌──────────┐ ┌────────┐
                                                              │ SUCCESS! │ │ DEBUG  │
                                                              │ 🎉       │ │ Check  │
                                                              └──────────┘ │ console│
                                                                           └────────┘
```

---

## Timeline Comparison

```
Method 1: URL Submission
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0s                    30s              1min         2min
│─────────────────────┼────────────────┼────────────┼
│ Submit URL          │ Hydration      │ Complete   │
│ Listing created     │ in progress    │ ✅         │
└─────────────────────┴────────────────┴────────────┘
FASTEST ⚡


Method 2: Search Creation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0s        2min    4min    6min    8min    10min
│─────────┼───────┼───────┼───────┼───────┼
│ Create  │ Wait  │ Wait  │ Wait  │ Wait  │ Worker runs
│ search  │ for   │ for   │ for   │ for   │ ✅
│         │ worker│ worker│ worker│ worker│
└─────────┴───────┴───────┴───────┴───────┴
AUTOMATIC 🔄


Method 3: Direct DB Insert
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0s        10s
│─────────┼
│ INSERT  │ Complete ✅
│ SQL     │
└─────────┘
INSTANT 🚀 (requires DB access)
```

---

## Success Path (Happy Flow)

```
┌────────────────────┐
│ START              │
│ User needs listing │
└─────────┬──────────┘
          │
          ▼
┌─────────────────────────────────┐
│ METHOD SELECTION                │
├─────────────────────────────────┤
│ • URL Submit (30s)              │
│ • Search Create (2-10min)       │
│ • Direct DB (10s, requires DB)  │
└─────────┬───────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│ AUTHENTICATION                  │
├─────────────────────────────────┤
│ • Get token from browser        │
│ • Set AUTH_TOKEN env var        │
└─────────┬───────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│ EXECUTION                       │
├─────────────────────────────────┤
│ • Run curl command              │
│ • Or use automated script       │
│ • Response: success: true       │
└─────────┬───────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│ VERIFICATION                    │
├─────────────────────────────────┤
│ ✅ Database check               │
│ ✅ Data quality check           │
│ ✅ UI visibility check          │
└─────────┬───────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│ SUCCESS! 🎉                     │
├─────────────────────────────────┤
│ • Listing visible in UI         │
│ • Real data displayed           │
│ • Users can click "View Deal"   │
└─────────────────────────────────┘
```

---

## Error Handling Flow

```
┌────────────────────┐
│ API Call Failed    │
└─────────┬──────────┘
          │
          ▼
    ┌─────────────┐
    │ Error Type? │
    └──┬──────┬───┘
       │      │
   ┌───┘      └───┐
   │              │
   ▼              ▼
┌──────────┐  ┌─────────────┐
│ 401      │  │ 500         │
│ Unauth   │  │ Server Err  │
└────┬─────┘  └──────┬──────┘
     │               │
     ▼               ▼
┌──────────┐  ┌─────────────┐
│ Get new  │  │ Check logs  │
│ auth     │  │ Restart     │
│ token    │  │ workers     │
└────┬─────┘  └──────┬──────┘
     │               │
     └───────┬───────┘
             │
             ▼
      ┌──────────────┐
      │ RETRY        │
      └──────────────┘
```

---

**Visual Guide Complete**  
Use these flowcharts to understand the system architecture and decision flow.
