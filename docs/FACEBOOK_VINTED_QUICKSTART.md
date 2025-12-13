# Facebook + Vinted Live Integration - Quick Start

## Local Development

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Build Marketplace Package
```bash
pnpm --filter @magnus-flipper-ai/marketplaces build
```

### 3. Set Environment Variables

Create `.env.local` in `apps/web/`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_LIVE_MARKETPLACES=facebook,vinted
```

Create `.env` in `apps/worker-realtime/` and `apps/worker-scheduler/`:
```bash
LIVE_MARKETPLACES=facebook,vinted
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 4. Run Locally

**Terminal 1 - Web:**
```bash
cd apps/web
pnpm dev
```

**Terminal 2 - Worker Realtime:**
```bash
cd apps/worker-realtime
pnpm dev
```

**Terminal 3 - Worker Scheduler:**
```bash
cd apps/worker-scheduler
pnpm dev
```

### 5. Test the Flow

**Submit a listing URL:**
```bash
curl -X POST http://localhost:3000/api/ingest/facebook/submit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.facebook.com/marketplace/item/123456789"}'
```

**Check listings:**
```bash
curl http://localhost:3000/api/marketplaces/facebook/live
```

**Check health:**
```bash
curl http://localhost:3000/api/health/workers
```

**View in browser:**
- http://localhost:3000/marketplaces/facebook
- http://localhost:3000/marketplaces/vinted

## Production Deployment

### Vercel (Web)
```bash
vercel env add NEXT_PUBLIC_API_BASE_URL
vercel env add NEXT_PUBLIC_LIVE_MARKETPLACES
vercel deploy --prod
```

### Workers (Azure/Render/etc.)
Set environment variables:
- `LIVE_MARKETPLACES=facebook,vinted`
- `DATABASE_URL=...`
- `SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`

Deploy workers to your infrastructure.

## Verification

1. **Submit test URL** → Wait 2-3 minutes
2. **Check API** → Should return listing
3. **Check UI** → Should show listing and "Live scanning" status
4. **Check health** → Should show "live" status

## Common Issues

**No listings appearing:**
- Check worker logs for errors
- Verify `LIVE_MARKETPLACES` is set
- Check database for pending listings

**UI shows "Pipeline offline":**
- Verify workers are running
- Check if listings exist in last 10 minutes
- Review health endpoint response
