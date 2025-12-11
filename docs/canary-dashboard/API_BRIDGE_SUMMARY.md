# Supabase → Next.js API → Figma Plugin Bridge

## ✅ Implementation Complete

The bridge between Supabase, Next.js API, and Figma plugin is now fully implemented.

---

## 📁 Files Created/Updated

### 1. TypeScript Types
**File:** `apps/canary-dashboard/lib/types/canary.ts`
- `CanarySummaryResponse` interface
- `MlDecisionSummary` interface
- `WorkerSideMetrics` interface
- All type definitions for API contract

### 2. Supabase Schema Extensions
**Files:**
- `supabase/canary_dashboard_schema_extended.sql` - Extended tables
- `supabase/canary_metrics_summary_view.sql` - Summary view
- `supabase/canary_dashboard_schema_complete.sql` - Complete migration

**New Tables:**
- `canary_runs` - Canary deployment runs
- `worker_deployments` - Deployment history
- Extended `canary_metrics` with `scope` field

**View:**
- `v_canary_metrics_summary` - Aggregated summary for API

### 3. Next.js API Route
**File:** `apps/canary-dashboard/app/api/canary/summary/route.ts`
- GET endpoint: `/api/canary/summary`
- Query params: `env`, `worker`
- Returns: `CanarySummaryResponse` JSON
- Includes fallback for missing view
- Cache headers for performance

### 4. Figma Plugin Updates
**Files:**
- `figma-plugins/canary-metrics-sync/src/code.ts` - Updated to use `/api/canary/summary`
- `figma-plugins/canary-metrics-sync/src/ui.ts` - Added env/worker params
- `figma-plugins/canary-metrics-sync/manifest.json` - Plugin manifest
- `figma-plugins/canary-metrics-sync/package.json` - Dependencies
- `figma-plugins/canary-metrics-sync/tsconfig.json` - TypeScript config
- `figma-plugins/canary-metrics-sync/src/ui.html` - UI template
- `figma-plugins/canary-metrics-sync/README.md` - Documentation

### 5. Documentation
**Files:**
- `docs/canary-dashboard/API_SPEC.md` - Complete API specification
- `docs/canary-dashboard/IMPLEMENTATION_CHECKLIST.md` - Implementation checklist
- `docs/canary-dashboard/API_BRIDGE_SUMMARY.md` - This file

---

## 🔄 Data Flow

```
Supabase Tables
  ↓
v_canary_metrics_summary (View)
  ↓
GET /api/canary/summary
  ↓
┌─────────────────┬─────────────────┐
│                 │                 │
Next.js Dashboard  Figma Plugin
│                 │
└─────────────────┴─────────────────┘
```

---

## 🚀 Quick Start

### 1. Run Database Migrations

```bash
# Connect to Supabase
psql $DATABASE_URL

# Run complete schema
\i supabase/canary_dashboard_schema_complete.sql
```

### 2. Test API Endpoint

```bash
# Local
curl "http://localhost:3000/api/canary/summary?env=production&worker=mf-worker-realtime"

# Production
curl "https://your-dashboard.vercel.app/api/canary/summary?env=production"
```

### 3. Test Figma Plugin

```bash
cd figma-plugins/canary-metrics-sync
npm install
npm run build

# Load in Figma:
# Plugins → Development → Import plugin from manifest
# Select: figma-plugins/canary-metrics-sync/manifest.json
```

---

## 📊 API Contract

### Request
```
GET /api/canary/summary?env=production&worker=mf-worker-realtime
```

### Response
```json
{
  "env": "production",
  "worker": "mf-worker-realtime",
  "canary": {
    "revision": "...",
    "traffic": { "canary": 0.1, "stable": 0.9 },
    "errorRate": 0.0023,
    "latencyP95": 427,
    "healthPassRate": 0.993,
    "mlDecision": {
      "decision": "PROMOTE",
      "confidence": 0.91,
      "severity": "OK",
      "anomalies": []
    }
  },
  "stable": { ... },
  "traffic": { ... },
  "timestamps": { ... }
}
```

---

## ✅ Verification Checklist

- [x] TypeScript types defined
- [x] Supabase view created
- [x] API route implemented
- [x] Figma plugin updated
- [x] Error handling added
- [x] Fallback queries implemented
- [x] Documentation complete
- [x] Cache headers configured

---

## 🎯 Next Steps

1. **Run migrations** in Supabase
2. **Test API** with real data
3. **Load Figma plugin** and test sync
4. **Update background workers** to write to new tables
5. **Monitor performance** and optimize queries

---

**Status:** ✅ Bridge Implementation Complete  
**Ready for:** Production deployment and testing
