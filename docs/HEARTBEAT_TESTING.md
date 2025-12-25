# Worker Heartbeat Testing Guide

## Overview

The worker heartbeat system enables real-time visibility of worker status on the landing page. This guide covers how to test the complete flow:

```
Worker → /api/system/heartbeat → Supabase → /api/system/status → Landing Page UI
```

## Prerequisites

1. **Database schema applied** - Ensure `scan_windows` and `worker_heartbeats` tables exist
2. **Environment variables set**:
   ```bash
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_API_URL=http://localhost:3000  # or your deployment URL
   HEARTBEAT_TOKEN=optional_shared_secret      # optional
   ```

## Quick Test (Automated)

Run the test script to simulate a worker:

```bash
cd /home/user/Magnus-Flipper-AI-v1.0-pro-reset
NEXT_PUBLIC_API_URL=http://localhost:3000 tsx scripts/test-heartbeat.ts
```

This will:
1. Send idle heartbeat
2. Send scanning heartbeat
3. Send cooldown heartbeat
4. Send error heartbeat
5. Start 5s interval
6. Run for 20 seconds
7. Shutdown gracefully

**Expected Results:**
- Landing page at http://localhost:3000 shows worker as active
- Worker count updates in real-time
- Status changes from idle → scanning → cooldown → error → idle

## Manual Testing

### Step 1: Start the Next.js Dev Server

```bash
cd apps/web
pnpm dev
```

Navigate to http://localhost:3000 in your browser.

### Step 2: Verify API Endpoints

Test the status endpoint:
```bash
curl http://localhost:3000/api/system/status | jq
```

Expected response:
```json
{
  "server_time": "2025-12-25T...",
  "scan_window": null,
  "workers": {
    "active": 0,
    "idle": 0,
    "error": 0
  },
  "alive_workers": [],
  "next_window_in_seconds": null,
  "closes_in_seconds": null
}
```

### Step 3: Send Test Heartbeat

```bash
curl -X POST http://localhost:3000/api/system/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "worker_id": "test-worker-001",
    "worker_type": "test-scanner",
    "marketplace": "Facebook",
    "state": "scanning",
    "meta": {
      "test": true
    }
  }'
```

Expected response:
```json
{"ok": true}
```

### Step 4: Verify Status Update

```bash
curl http://localhost:3000/api/system/status | jq
```

Should now show:
```json
{
  "workers": {
    "active": 1,
    "idle": 0,
    "error": 0
  },
  "alive_workers": [
    {
      "worker_id": "test-worker-001",
      "worker_type": "test-scanner",
      "marketplace": "Facebook",
      "state": "scanning",
      ...
    }
  ]
}
```

### Step 5: Check Landing Page UI

Refresh http://localhost:3000 and verify:
- **Worker Status Pill** shows "Scanners active · live ingest running"
- **Worker Status Section** shows "1 active · Facebook"
- Status updates automatically every 5 seconds

### Step 6: Test Worker Lifecycle

Start the actual worker scheduler:
```bash
cd apps/worker-scheduler
pnpm dev
```

Watch the console for:
```
[worker-scheduler-001] System heartbeat started (30s interval)
[worker-scheduler-001] Starting risk-tier aware scheduling...
```

Landing page should show the real worker within 30 seconds.

## Testing with Real Scan Windows

### Create a Test Scan Window

```sql
INSERT INTO public.scan_windows (marketplace, opens_at, closes_at, status)
VALUES (
  'Facebook',
  NOW(),
  NOW() + INTERVAL '12 hours',
  'active'
);
```

Expected UI behavior:
- **Scan Status Strip** shows "● Active window"
- **Countdown** shows "Closes in Xh Xm"
- **Pricing Page** shows live indicator (if window is active)

### Create a Scheduled Window

```sql
INSERT INTO public.scan_windows (marketplace, opens_at, closes_at, status)
VALUES (
  'Facebook',
  NOW() + INTERVAL '3 hours',
  NOW() + INTERVAL '15 hours',
  'scheduled'
);
```

Expected UI behavior:
- **Scan Status Strip** shows "● No active window"
- **Countdown** shows "Next scan opens in 3h 0m"

## Troubleshooting

### Workers not showing on landing page

**Check 1**: Verify heartbeat is being sent
```bash
curl http://localhost:3000/api/system/status
```

**Check 2**: Check Supabase `worker_heartbeats` table
```sql
SELECT * FROM public.worker_heartbeats;
```

**Check 3**: Verify `last_seen_at` is recent (within 90 seconds)

**Fix**: Ensure worker has correct `NEXT_PUBLIC_API_URL` env var

### "Unauthorized heartbeat" error

**Cause**: `HEARTBEAT_TOKEN` mismatch

**Fix**: Either:
- Set `HEARTBEAT_TOKEN` env var consistently across worker and API
- Or unset `HEARTBEAT_TOKEN` to disable authentication

### Countdown not updating

**Check**: Verify `useSystemStatus` hook is polling
```javascript
// In browser console:
fetch('/api/system/status').then(r => r.json()).then(console.log)
```

**Fix**: Check browser console for errors, ensure API is responding

### Worker shows as idle when it should be scanning

**Check**: Verify worker is calling `systemHeartbeat.startScanning()`

**Fix**: Ensure worker state transitions are being reported:
```typescript
await systemHeartbeat.startScanning({ ... });
// ... do work ...
await systemHeartbeat.goIdle();
```

## Production Deployment

1. **Set environment variables** on your hosting platform
2. **Deploy web app** with API routes
3. **Deploy worker scheduler** with heartbeat enabled
4. **Verify** worker appears on production landing page within 30s

## Monitoring

Watch for these log patterns:

**Worker logs (healthy):**
```
[worker-scheduler-001] System heartbeat started (30s interval)
[worker-scheduler-001] Starting risk-tier aware scheduling...
```

**API logs (healthy):**
```
POST /api/system/heartbeat 200
GET /api/system/status 200
```

**Browser console (healthy):**
```
// No errors, status updates every 5s
```

## Architecture Notes

- **Heartbeat Interval**: 30s (worker) → 90s stale threshold (API)
- **Status Poll**: 5s (landing page)
- **Worker State Machine**: idle → scanning → cooldown | error → idle
- **Window Status**: scheduled → active → closed

Truth flows from:
1. Worker reports state via POST /api/system/heartbeat
2. API writes to `worker_heartbeats` table
3. API reads from DB via GET /api/system/status
4. Landing page polls status endpoint
5. UI renders countdown and worker state

**No client-side calculation of countdowns** - all time math happens server-side.
