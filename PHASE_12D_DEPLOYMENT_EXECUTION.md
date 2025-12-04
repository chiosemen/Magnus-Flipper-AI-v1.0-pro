# PHASE 12D — DEPLOYMENT EXECUTION GUIDE

**Date**: 2024-01-15  
**Status**: 🔄 **IN PROGRESS**

---

## COMPLETED STEPS

### ✅ Step 1: ACR Login
- **Status**: ✅ **COMPLETE**
- Command: `az acr login --name magnusacr`
- Result: Login Succeeded

### ✅ Step 2: Tag Images
- **Status**: ✅ **COMPLETE**
- All three images tagged:
  - `worker-scraper:v1` → `magnusacr.azurecr.io/worker-scraper:v1`
  - `worker-tracker:v1` → `magnusacr.azurecr.io/worker-tracker:v1`
  - `worker-autosell:v1` → `magnusacr.azurecr.io/worker-autosell:v1`

### ✅ Step 3: Push Images (Partial)
- **Status**: ⚠️  **PARTIAL**
- ✅ `worker-scraper:v1` — Pushed successfully
- ⏳ `worker-tracker:v1` — Pending
- ⏳ `worker-autosell:v1` — Pending

---

## PENDING STEPS

### ⏳ Step 4: Complete Image Push
```bash
docker push magnusacr.azurecr.io/worker-tracker:v1
docker push magnusacr.azurecr.io/worker-autosell:v1
```

### ⏳ Step 5: Deploy Container Apps

**⚠️ IMPORTANT**: Set environment variables first:
```bash
export SUPABASE_URL="https://[PROJECT_ID].supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="[SERVICE_ROLE_KEY]"
export SUPABASE_ANON_KEY="[ANON_KEY]"
```

Then deploy each worker (see commands below).

---

## DEPLOYMENT COMMANDS

### Deploy Worker-Scraper

```bash
az containerapp create \
  --name worker-scraper \
  --resource-group magnus-rg \
  --environment magnus-ca-env \
  --image magnusacr.azurecr.io/worker-scraper:v1 \
  --registry-server magnusacr.azurecr.io \
  --cpu 0.5 \
  --memory 1.0Gi \
  --min-replicas 1 \
  --max-replicas 3 \
  --secrets \
    supabase-url="${SUPABASE_URL}" \
    supabase-service-role-key="${SUPABASE_SERVICE_ROLE_KEY}" \
    supabase-anon-key="${SUPABASE_ANON_KEY}" \
  --env-vars \
    SUPABASE_URL="secretref:supabase-url" \
    SUPABASE_SERVICE_ROLE_KEY="secretref:supabase-service-role-key" \
    SUPABASE_ANON_KEY="secretref:supabase-anon-key" \
    NODE_ENV=production \
    LOG_LEVEL=info \
  --ingress internal \
  --target-port 8080
```

### Deploy Worker-Tracker

```bash
az containerapp create \
  --name worker-tracker \
  --resource-group magnus-rg \
  --environment magnus-ca-env \
  --image magnusacr.azurecr.io/worker-tracker:v1 \
  --registry-server magnusacr.azurecr.io \
  --cpu 0.5 \
  --memory 1.0Gi \
  --min-replicas 1 \
  --max-replicas 3 \
  --secrets \
    supabase-url="${SUPABASE_URL}" \
    supabase-service-role-key="${SUPABASE_SERVICE_ROLE_KEY}" \
    supabase-anon-key="${SUPABASE_ANON_KEY}" \
  --env-vars \
    SUPABASE_URL="secretref:supabase-url" \
    SUPABASE_SERVICE_ROLE_KEY="secretref:supabase-service-role-key" \
    SUPABASE_ANON_KEY="secretref:supabase-anon-key" \
    NODE_ENV=production \
    LOG_LEVEL=info \
  --ingress internal \
  --target-port 8080
```

### Deploy Worker-Autosell

```bash
az containerapp create \
  --name worker-autosell \
  --resource-group magnus-rg \
  --environment magnus-ca-env \
  --image magnusacr.azurecr.io/worker-autosell:v1 \
  --registry-server magnusacr.azurecr.io \
  --cpu 0.5 \
  --memory 1.0Gi \
  --min-replicas 1 \
  --max-replicas 3 \
  --secrets \
    supabase-url="${SUPABASE_URL}" \
    supabase-service-role-key="${SUPABASE_SERVICE_ROLE_KEY}" \
    supabase-anon-key="${SUPABASE_ANON_KEY}" \
  --env-vars \
    SUPABASE_URL="secretref:supabase-url" \
    SUPABASE_SERVICE_ROLE_KEY="secretref:supabase-service-role-key" \
    SUPABASE_ANON_KEY="secretref:supabase-anon-key" \
    NODE_ENV=production \
    LOG_LEVEL=info \
  --ingress internal \
  --target-port 8080
```

---

## VERIFICATION COMMANDS

After deployment, run these to verify:

```bash
# List all Container Apps
az containerapp list \
  --resource-group magnus-rg \
  --query "[].{Name:name, Status:properties.provisioningState, Replicas:properties.template.scale.minReplicas}" \
  --output table

# Check logs for each worker
az containerapp logs show --name worker-scraper --resource-group magnus-rg --tail 20
az containerapp logs show --name worker-tracker --resource-group magnus-rg --tail 20
az containerapp logs show --name worker-autosell --resource-group magnus-rg --tail 20

# Check replica status
az containerapp replica list --name worker-scraper --resource-group magnus-rg --output table
```

---

**Status**: 🔄 **IN PROGRESS** — Continuing with image push and deployment

**Next**: Complete image push, then deploy Container Apps

