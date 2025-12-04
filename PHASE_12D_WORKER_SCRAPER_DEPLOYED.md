# PHASE 12D — WORKER-SCRAPER DEPLOYMENT

**Date**: 2024-12-04  
**Status**: ✅ **DEPLOYED** (Verification in progress)

---

## DEPLOYMENT COMPLETED

### Worker-Scraper Container App

- **Name**: `worker-scraper`
- **Resource Group**: `magnus-rg`
- **Environment**: `magnus-ca-env`
- **Image**: `magnusacr.azurecr.io/worker-scraper:v1`
- **Platform**: `linux/amd64` (rebuilt for Azure)

### Configuration

- **CPU**: 0.5 cores
- **Memory**: 1.0Gi
- **Replicas**: 1-3 (auto-scaling)
- **Ingress**: Internal
- **Target Port**: 8080

### Secrets Configured

- ✅ `supabase-url` — Supabase project URL
- ✅ `supabase-service-role-key` — Service role key
- ✅ `supabase-anon-key` — Anonymous key

### Environment Variables

- ✅ `SUPABASE_URL` — From secret
- ✅ `SUPABASE_SERVICE_ROLE_KEY` — From secret
- ✅ `SUPABASE_ANON_KEY` — From secret
- ✅ `NODE_ENV=production`
- ✅ `LOG_LEVEL=info`

---

## ISSUES RESOLVED

### Issue 1: Secret Name Format
- **Problem**: Secret names must be lowercase with hyphens
- **Fix**: Changed `SUPABASE_URL` → `supabase-url`

### Issue 2: Image Platform Mismatch
- **Problem**: Images built for `arm64` (macOS), Azure needs `linux/amd64`
- **Fix**: Rebuilt all images with `--platform linux/amd64`
- **Result**: Images successfully pushed and deployed

---

## VERIFICATION COMMANDS

### Check Status
```bash
az containerapp show \
  --name worker-scraper \
  --resource-group magnus-rg \
  --query "{Name:name, Status:properties.provisioningState, LatestRevision:properties.latestRevisionName}" \
  --output json
```

### Check Revisions
```bash
az containerapp revision list \
  --name worker-scraper \
  --resource-group magnus-rg \
  --output table
```

### View Logs
```bash
az containerapp logs show \
  --name worker-scraper \
  --resource-group magnus-rg \
  --tail 50 \
  --follow
```

### Check Replicas
```bash
az containerapp replica list \
  --name worker-scraper \
  --resource-group magnus-rg \
  --output table
```

---

## NEXT STEPS

1. ✅ **Verify worker-scraper is running** — Check logs and status
2. ⏳ **Deploy worker-tracker** — Use same pattern
3. ⏳ **Deploy worker-autosell** — Use same pattern
4. ⏳ **Final verification** — All workers healthy

---

**Status**: ✅ **WORKER-SCRAPER DEPLOYED**

**Next**: Deploy worker-tracker and worker-autosell using the same corrected commands.

---

**END OF WORKER-SCRAPER DEPLOYMENT**

