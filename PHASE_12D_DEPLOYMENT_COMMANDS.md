# PHASE 12D — ACR PUSH + AZURE CONTAINER APP DEPLOYMENT

**Date**: 2024-01-15  
**Status**: 🔄 **READY FOR DEPLOYMENT**

---

## PREREQUISITES

- ✅ Docker images built locally
- ✅ Azure CLI authenticated
- ✅ ACR access verified
- ⚠️  **Required**: Set environment variables before deployment

---

## STEP 1: ACR LOGIN

```bash
az acr login --name magnusacr
```

**Expected Output**: `Login Succeeded`

---

## STEP 2: TAG IMAGES FOR ACR

```bash
docker tag worker-scraper:v1 magnusacr.azurecr.io/worker-scraper:v1
docker tag worker-tracker:v1 magnusacr.azurecr.io/worker-tracker:v1
docker tag worker-autosell:v1 magnusacr.azurecr.io/worker-autosell:v1
```

**Verification**:
```bash
docker images | grep magnusacr
```

---

## STEP 3: PUSH IMAGES TO ACR

```bash
# Push worker-scraper
docker push magnusacr.azurecr.io/worker-scraper:v1

# Push worker-tracker
docker push magnusacr.azurecr.io/worker-tracker:v1

# Push worker-autosell
docker push magnusacr.azurecr.io/worker-autosell:v1
```

**Verification**:
```bash
az acr repository list --name magnusacr --output table
az acr repository show-tags --name magnusacr --repository worker-scraper --output table
az acr repository show-tags --name magnusacr --repository worker-tracker --output table
az acr repository show-tags --name magnusacr --repository worker-autosell --output table
```

---

## STEP 4: SET ENVIRONMENT VARIABLES

**⚠️ IMPORTANT**: Set these before deploying:

```bash
export SUPABASE_URL="https://[PROJECT_ID].supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="[SERVICE_ROLE_KEY]"
export SUPABASE_ANON_KEY="[ANON_KEY]"
```

---

## STEP 5: DEPLOY WORKER-SCRAPER

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

---

## STEP 6: DEPLOY WORKER-TRACKER

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

---

## STEP 7: DEPLOY WORKER-AUTOSELL

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

## ALTERNATIVE: USE DEPLOYMENT SCRIPT

```bash
# Set environment variables
export SUPABASE_URL="https://[PROJECT_ID].supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="[SERVICE_ROLE_KEY]"
export SUPABASE_ANON_KEY="[ANON_KEY]"

# Run deployment script
./scripts/deploy/deploy-azure-workers.sh
```

---

## VERIFICATION COMMANDS

### 1. List All Container Apps

```bash
az containerapp list \
  --resource-group magnus-rg \
  --query "[].{Name:name, Status:properties.provisioningState, Replicas:properties.template.scale.minReplicas, Image:properties.template.containers[0].image}" \
  --output table
```

### 2. Check Container App Status

```bash
# Worker Scraper
az containerapp show \
  --name worker-scraper \
  --resource-group magnus-rg \
  --query "{Name:name, Status:properties.provisioningState, Replicas:properties.template.scale, Image:properties.template.containers[0].image}" \
  --output json

# Worker Tracker
az containerapp show \
  --name worker-tracker \
  --resource-group magnus-rg \
  --query "{Name:name, Status:properties.provisioningState, Replicas:properties.template.scale, Image:properties.template.containers[0].image}" \
  --output json

# Worker Autosell
az containerapp show \
  --name worker-autosell \
  --resource-group magnus-rg \
  --query "{Name:name, Status:properties.provisioningState, Replicas:properties.template.scale, Image:properties.template.containers[0].image}" \
  --output json
```

### 3. View Logs

```bash
# Worker Scraper
az containerapp logs show \
  --name worker-scraper \
  --resource-group magnus-rg \
  --follow

# Worker Tracker
az containerapp logs show \
  --name worker-tracker \
  --resource-group magnus-rg \
  --follow

# Worker Autosell
az containerapp logs show \
  --name worker-autosell \
  --resource-group magnus-rg \
  --follow
```

### 4. Check Replica Status

```bash
az containerapp replica list \
  --name worker-scraper \
  --resource-group magnus-rg \
  --query "[].{Name:name, Status:properties.runningState, RestartCount:properties.restartCount}" \
  --output table
```

### 5. Test Health Endpoints (if ingress enabled)

```bash
# Get worker URL
WORKER_URL=$(az containerapp show \
  --name worker-scraper \
  --resource-group magnus-rg \
  --query "properties.configuration.ingress.fqdn" \
  --output tsv)

# Test health endpoint
curl "https://${WORKER_URL}/health"
```

---

## HEALTH CHECK CHECKLIST

After deployment, verify:

- [ ] **Container is running**: `properties.runningState = "Running"`
- [ ] **Restart count is 0**: `properties.restartCount = 0`
- [ ] **No crash loops**: Check logs for repeated errors
- [ ] **Supabase connectivity**: Logs show successful connections
- [ ] **Replicas healthy**: All replicas in "Running" state
- [ ] **Image pulled successfully**: No image pull errors in logs

---

## TROUBLESHOOTING

### Issue: Container App creation fails

**Error**: "Container app already exists"
```bash
# Update instead of create
az containerapp update \
  --name worker-scraper \
  --resource-group magnus-rg \
  --image magnusacr.azurecr.io/worker-scraper:v1
```

### Issue: Image pull fails

**Error**: "Failed to pull image"
```bash
# Verify ACR access
az acr repository show --name magnusacr --repository worker-scraper

# Check registry authentication
az containerapp registry list \
  --name worker-scraper \
  --resource-group magnus-rg
```

### Issue: Container crashes on startup

**Check logs**:
```bash
az containerapp logs show \
  --name worker-scraper \
  --resource-group magnus-rg \
  --tail 50
```

**Common causes**:
- Missing environment variables
- Invalid Supabase credentials
- Port conflicts
- Missing dependencies

---

## DEPLOYMENT SUMMARY

### Resources Created

| Resource | Name | Image | Status |
|----------|------|-------|--------|
| Container App | worker-scraper | magnusacr.azurecr.io/worker-scraper:v1 | Pending |
| Container App | worker-tracker | magnusacr.azurecr.io/worker-tracker:v1 | Pending |
| Container App | worker-autosell | magnusacr.azurecr.io/worker-autosell:v1 | Pending |

### Configuration

- **Resource Group**: `magnus-rg`
- **Environment**: `magnus-ca-env`
- **Region**: `eastus`
- **ACR**: `magnusacr.azurecr.io`
- **CPU**: 0.5 cores per worker
- **Memory**: 1.0Gi per worker
- **Replicas**: 1-3 (auto-scaling)

---

## NEXT STEPS

1. ✅ **Execute deployment commands** (above)
2. ✅ **Verify deployments** (health checks)
3. ✅ **Monitor logs** (ensure no errors)
4. ✅ **Test worker functionality** (trigger jobs)
5. ✅ **Proceed to Phase 12E** (Integration testing)

---

**Status**: ✅ **READY FOR DEPLOYMENT**

**Action Required**: Execute deployment commands after setting environment variables.

---

**END OF DEPLOYMENT COMMANDS**

