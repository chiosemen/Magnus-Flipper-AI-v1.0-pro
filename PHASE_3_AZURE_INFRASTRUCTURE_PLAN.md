# 🚀 PHASE 3: AZURE WORKER INFRASTRUCTURE PLAN
## Terraform Planning Complete

**Date:** 2025-12-09  
**Status:** ✅ **PLAN GENERATED** (Ready for Review)  
**Plan File:** `infra/azure/tfplan`

---

## ✅ AZURE PRE-FLIGHT CHECKS COMPLETE

### Azure Account Status:

- ✅ **Subscription ID:** `77e9f8a3-45bb-4d6b-8372-e593edc1848f`
- ✅ **Tenant ID:** `5ebfcb20-3394-4fe7-97a6-97ef42f2ebe4`
- ✅ **Authentication:** Service Principal (authenticated)
- ✅ **Account State:** Enabled

### Existing Resources Verified:

1. ✅ **Resource Group:** `magnus-rg`
   - Location: `eastus`
   - Status: `Succeeded`
   - Tags: Environment=production, ManagedBy=Terraform, Project=Magnus-Flipper-AI

2. ✅ **Azure Container Registry:** `magnusacr`
   - Login Server: `magnusacr.azurecr.io`
   - Location: `eastus`
   - SKU: Basic
   - Status: `Succeeded`
   - Admin User: Enabled

3. ✅ **Container Apps Environment:** `magnus-ca-env` (EXISTS)
   - Location: `East US`
   - Default Domain: `wittystone-f822e1ef.eastus.azurecontainerapps.io`
   - Status: `Succeeded`
   - Log Analytics: Already configured

---

## 📋 TERRAFORM PLAN SUMMARY

### Resources to Create: **4**

1. ✅ **Log Analytics Workspace:** `mf-law-prod`
   - SKU: PerGB2018
   - Retention: 30 days
   - Location: eastus

2. ⚠️ **Container Apps Environment:** `magnus-ca-env`
   - **NOTE:** Environment already exists!
   - Terraform will attempt to create it (may fail or use existing)
   - **Recommendation:** Use data source instead of resource

3. ✅ **Container App:** `mf-worker-realtime`
   - Image: `magnusacr.azurecr.io/magnus-worker-realtime:latest`
   - CPU: 0.5
   - Memory: 1Gi
   - Min Replicas: 1
   - Max Replicas: 3
   - Ingress: Internal (external_enabled = false)
   - Target Port: 3000

4. ✅ **Container App:** `mf-worker-scheduler`
   - Image: `magnusacr.azurecr.io/magnus-worker-scheduler:latest`
   - CPU: 0.25
   - Memory: 0.5Gi
   - Min Replicas: 1
   - Max Replicas: 1
   - Ingress: Internal (external_enabled = false)
   - Target Port: 3000

---

## ⚠️ ISSUES IDENTIFIED

### Issue 1: Container Apps Environment Already Exists

**Problem:**
- Terraform plan shows it will create `magnus-ca-env`
- But this environment already exists in Azure
- This will cause a conflict on `terraform apply`

**Solution Options:**

**Option A:** Use data source (recommended)
```hcl
data "azurerm_container_app_environment" "existing" {
  name                = var.cae_name
  resource_group_name = data.azurerm_resource_group.prod.name
}

# Then reference: data.azurerm_container_app_environment.existing.id
```

**Option B:** Import existing resource
```bash
terraform import azurerm_container_app_environment.this /subscriptions/.../resourceGroups/magnus-rg/providers/Microsoft.App/managedEnvironments/magnus-ca-env
```

**Option C:** Use existing environment's Log Analytics
- The existing environment already has Log Analytics configured
- We might not need to create a new Log Analytics workspace

**Recommendation:** Use Option A (data source) to reference existing environment.

---

### Issue 2: Container Images May Not Exist

**Problem:**
- Plan references images:
  - `magnusacr.azurecr.io/magnus-worker-realtime:latest`
  - `magnusacr.azurecr.io/magnus-worker-scheduler:latest`
- These images must exist in ACR before deployment

**Verification Needed:**
```bash
az acr repository list --name magnusacr --resource-group magnus-rg
az acr repository show-tags --name magnusacr --repository magnus-worker-realtime
az acr repository show-tags --name magnusacr --repository magnus-worker-scheduler
```

**Action Required:** Build and push images to ACR before applying Terraform.

---

### Issue 3: Missing Environment Variables

**Current State:**
- Only `NODE_ENV=production` is configured
- Missing critical env vars:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_DB_URL`
  - `REDIS_URL`
  - `OPENAI_API_KEY`
  - `GEMINI_API_KEY`

**Solution:**
- Add secrets to Container Apps after deployment:
```bash
az containerapp secret set \
  --name mf-worker-realtime \
  --resource-group magnus-rg \
  --secrets SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..."
```

Or update Terraform to use secret references (recommended for production).

---

## 🔧 TERRAFORM CONFIGURATION FIXES APPLIED

### Fixed Issues:

1. ✅ **Scale Block Syntax:** Moved `min_replicas` and `max_replicas` to `template` block root
2. ✅ **Ingress Traffic Weight:** Added required `traffic_weight` block to ingress configuration

### Files Modified:

- `infra/azure/main.tf` - Fixed Container App syntax

---

## 📊 TERRAFORM PLAN OUTPUT

**Plan File:** `infra/azure/tfplan`

**Summary:**
- **4 resources** to add
- **0 resources** to change
- **0 resources** to destroy

**To Apply:**
```bash
cd infra/azure
terraform apply tfplan
```

---

## 🎯 NEXT STEPS

### Before Applying Terraform:

1. ⚠️ **Fix Container Apps Environment Reference**
   - Update `main.tf` to use data source for existing environment
   - Or import existing environment into Terraform state

2. ⚠️ **Verify Container Images Exist**
   - Check ACR for `magnus-worker-realtime:latest`
   - Check ACR for `magnus-worker-scheduler:latest`
   - Build and push if missing

3. ⚠️ **Prepare Environment Variables**
   - Load secrets from `secrets/env.vault.local.json`
   - Plan secret injection strategy (Terraform vs Azure CLI)

### After Applying Terraform:

1. ✅ **Inject Secrets**
   - Use `az containerapp secret set` for each app
   - Or update Terraform to reference Key Vault secrets

2. ✅ **Verify Deployment**
   - Check Container App logs
   - Verify connectivity to Supabase
   - Test worker functionality

3. ✅ **Monitor**
   - Check Log Analytics workspace
   - Monitor Container App metrics
   - Verify scaling behavior

---

## 📝 RECOMMENDATIONS

### Immediate Actions:

1. **Update `main.tf`** to use data source for existing Container Apps Environment
2. **Verify images** exist in ACR before applying
3. **Plan secret management** (Key Vault vs direct injection)

### Future Improvements:

1. **Use Azure Key Vault** for secret management
2. **Add health probes** to Container Apps
3. **Configure auto-scaling rules** based on metrics
4. **Add Dapr components** for service mesh (if needed)
5. **Set up monitoring alerts** in Log Analytics

---

## ✅ PHASE 3 STATUS

**Azure Checks:** ✅ Complete  
**Terraform Plan:** ✅ Generated  
**Issues Identified:** ⚠️ 3 (all fixable)  
**Ready for Apply:** ⚠️ After fixes

---

**Next Command:** Fix Container Apps Environment reference, then proceed with `terraform apply` approval.
