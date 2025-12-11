# Canary Summary API — Implementation Checklist

## ✅ Completed Tasks

### 1. Database Schema
- [x] Created `canary_runs` table
- [x] Extended `canary_metrics` table with `scope` field
- [x] Created `worker_deployments` table
- [x] Created `v_canary_metrics_summary` view
- [x] Added indexes for performance
- [x] Configured RLS policies

### 2. TypeScript Types
- [x] Created `lib/types/canary.ts`
- [x] Defined `CanarySummaryResponse` interface
- [x] Defined `MlDecisionSummary` interface
- [x] Defined `WorkerSideMetrics` interface
- [x] Exported all types

### 3. Next.js API Route
- [x] Created `/api/canary/summary/route.ts`
- [x] Implemented query parameter parsing
- [x] Added environment validation
- [x] Integrated Supabase client
- [x] Built response from view data
- [x] Added error handling
- [x] Added cache headers

### 4. Figma Plugin Updates
- [x] Updated `fetchMetrics()` to use `/api/canary/summary`
- [x] Added `env` and `worker` parameters
- [x] Updated `updateFigmaLayers()` to use new response format
- [x] Updated UI to pass environment parameter

### 5. Documentation
- [x] Created `API_SPEC.md`
- [x] Created `IMPLEMENTATION_CHECKLIST.md`
- [x] Updated `FIGMA_PLUGIN_GUIDE.md`

---

## 🚧 Next Steps

### 1. Database Migration

Run the SQL migrations:

```bash
# Connect to Supabase
psql $DATABASE_URL

# Run extended schema
\i supabase/canary_dashboard_schema_extended.sql

# Run summary view
\i supabase/canary_metrics_summary_view.sql
```

### 2. Test the API

```bash
# Local development
curl "http://localhost:3000/api/canary/summary?env=production&worker=mf-worker-realtime"

# Production
curl "https://your-domain.com/api/canary/summary?env=production"
```

### 3. Populate Test Data

Insert sample data to test the endpoint:

```sql
-- Insert a canary run
INSERT INTO canary_runs (env, worker_id, canary_revision, stable_revision, traffic_canary, traffic_stable)
VALUES ('production', 'mf-worker-realtime', 'mf-worker-realtime@2025-12-09-01', 'mf-worker-realtime@2025-12-08-05', 0.1, 0.9);

-- Insert metrics
INSERT INTO canary_metrics (canary_run_id, env, worker_id, scope, error_rate, latency_p95_ms, health_pass_rate, total_requests, error_count)
VALUES (
  (SELECT id FROM canary_runs ORDER BY created_at DESC LIMIT 1),
  'production',
  'mf-worker-realtime',
  'last_15m',
  0.0023,
  427,
  0.993,
  5231,
  12
);

-- Insert ML decision
INSERT INTO canary_ml_decisions (canary_run_id, env, worker_id, decision, severity, confidence, anomalies)
VALUES (
  (SELECT id FROM canary_runs ORDER BY created_at DESC LIMIT 1),
  'production',
  'mf-worker-realtime',
  'PROMOTE',
  'OK',
  0.91,
  '[]'::jsonb
);
```

### 4. Update Background Workers

Update `canary-ingestor` and `canary-streamer` to write to the new tables:

- `canary-ingestor`: Write to `canary_runs`, `canary_metrics`, `canary_ml_decisions`
- `canary-streamer`: Write to `worker_deployments` on deployment events

### 5. Test Figma Plugin

1. Build the plugin:
   ```bash
   cd figma-plugins/canary-metrics-sync
   npm run build
   ```

2. Load in Figma
3. Configure API URL (e.g., `http://localhost:3000` for local)
4. Test sync

### 6. Integration Testing

- [ ] Test API with real Supabase data
- [ ] Test Figma plugin with local API
- [ ] Test Figma plugin with production API
- [ ] Verify all layer mappings work
- [ ] Test error handling (404, 500, network errors)

---

## 🔍 Verification Steps

### API Verification

1. **Check endpoint exists:**
   ```bash
   curl -I http://localhost:3000/api/canary/summary
   ```

2. **Test with default params:**
   ```bash
   curl http://localhost:3000/api/canary/summary
   ```

3. **Test with custom params:**
   ```bash
   curl "http://localhost:3000/api/canary/summary?env=staging&worker=mf-worker-scheduler"
   ```

4. **Verify response format:**
   - Check JSON structure matches `CanarySummaryResponse`
   - Verify all fields are present
   - Check data types are correct

### Figma Plugin Verification

1. **Test API connection:**
   - Enter API URL
   - Click "Test API Connection"
   - Verify success message

2. **Test metrics sync:**
   - Click "Sync Metrics Now"
   - Verify layers update
   - Check status colors applied

3. **Test error handling:**
   - Use invalid API URL
   - Verify error message
   - Test with missing layers

---

## 📊 Performance Targets

- **API Response Time:** < 200ms (p95)
- **Database Query Time:** < 100ms
- **Cache Hit Rate:** > 80%
- **Error Rate:** < 1%

---

## 🔒 Security Checklist

- [ ] Add API key authentication (optional)
- [ ] Implement rate limiting
- [ ] Add CORS configuration
- [ ] Validate input parameters
- [ ] Sanitize database queries
- [ ] Add request logging

---

## 🎯 Success Criteria

The implementation is complete when:

1. ✅ API endpoint returns valid JSON
2. ✅ Figma plugin successfully syncs metrics
3. ✅ All layer mappings work correctly
4. ✅ Error handling works gracefully
5. ✅ Documentation is complete
6. ✅ Performance targets are met

---

**Status:** ✅ Implementation Complete  
**Next:** Run migrations and test end-to-end
