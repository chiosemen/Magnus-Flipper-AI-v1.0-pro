# Magnus Flipper AI - Azure Migration Complete Implementation Guide

## 🎯 Overview

This document provides a complete guide for the Azure migration and Marketplace Monitor saved search feature implementation.

**Feature**: EWM01 - Saved Search & Alerts
**Status**: Backend & Infrastructure Complete
**Remaining**: Mobile & Web UI Components

---

## 📦 What Has Been Implemented

### ✅ 1. Shared Domain Types (`packages/core`)
- **File**: `packages/core/src/search.ts`
- **Exports**:
  - `MarketplaceSite`, `Condition` types
  - `SearchFilter`, `SavedSearch`, `Listing`, `ListingMatch` interfaces
  - API request/response types
  - `User` interface with expo_push_token

### ✅ 2. Shared UI Config (`packages/ui-config`)
- **File**: `packages/ui-config/src/searchConfig.ts`
- **Exports**:
  - `CATEGORIES` - 10 product categories (phones, laptops, cars, etc.)
  - `MANUFACTURERS_BY_CATEGORY` - Manufacturer lists per category
  - `MODELS_BY_MANUFACTURER` - Model series and variants
  - Helper functions: `getManufacturersForCategory()`, `getModelsForManufacturer()`

### ✅ 3. Database Schema (`supabase/migrations`)
- **File**: `supabase/migrations/20250123_saved_searches.sql`
- **Tables Created**:
  1. `saved_searches` - User-defined search criteria
  2. `listings` - Scraped marketplace items
  3. `listing_matches` - Join table with notification tracking
  4. `users.expo_push_token` column added
- **Features**:
  - Row Level Security (RLS) policies
  - Foreign key constraints
  - Optimized indexes
  - Auto-update triggers

### ✅ 4. API Routes (`apps/api`)
**New Files**:
- `apps/api/src/lib/db.ts` - Supabase client
- `apps/api/src/middleware/auth.ts` - JWT authentication
- `apps/api/src/routes/savedSearches.ts` - CRUD for saved searches
- `apps/api/src/routes/listings.ts` - Listings feed & search
- `apps/api/src/routes/alerts.ts` - Alert history & stats

**Endpoints**:
```
GET    /api/saved-searches          - List user's saved searches
POST   /api/saved-searches          - Create new saved search
PATCH  /api/saved-searches/:id      - Update saved search
DELETE /api/saved-searches/:id      - Delete saved search
GET    /api/listings/feed           - Get matched listings (paginated)
GET    /api/listings/:id            - Get single listing
GET    /api/listings/search/run     - Ad-hoc search (preview)
GET    /api/alerts/recent           - Recent alerts with details
GET    /api/alerts/stats            - Alert statistics
```

### ✅ 5. Saved Search Alert Worker (`apps/worker-alerts`)
- **File**: `apps/worker-alerts/src/savedSearchJob.ts`
- **Functionality**:
  - Fetches active saved searches from DB
  - Queries listings table with filters
  - Applies haversine distance calculation for radius
  - Creates `listing_matches` records for new matches
  - Sends Expo push notifications to mobile users
  - Updates `last_run_at` timestamp
  - Limits results per `max_results_per_run`

**Run Command**:
```bash
pnpm --filter worker-alerts start:saved-search
```

### ✅ 6. Dockerfiles
**Files Created**:
- `Dockerfile.api` - Multi-stage build for API
- `Dockerfile.worker-alerts` - Multi-stage build for alerts worker

**Features**:
- pnpm workspace support
- Optimized layer caching
- Non-root user (nodejs:nodejs)
- Health check for API
- Production-ready

### ✅ 7. Azure Infrastructure (Terraform)
**Directory**: `infra/azure/`

**Files**:
- `main.tf` - Complete Azure resources
- `variables.tf` - All configuration variables
- `outputs.tf` - Resource outputs (URLs, credentials)
- `README.md` - Deployment and management guide

**Resources Created**:
1. **Resource Group** - `magnus-rg`
2. **Container Registry** - `magnusacr` (stores Docker images)
3. **Log Analytics Workspace** - Centralized logging
4. **Redis Cache** - Standard tier for queues/cache
5. **Container Apps Environment** - Shared environment
6. **Container App (API)** - `magnus-api` with autoscaling
7. **Container Apps Job** - `worker-alerts-job` (cron: */5 * * * *)

**Deployment**:
```bash
cd infra/azure
terraform init
terraform plan
terraform apply
```

### ✅ 8. GitHub Actions CI/CD
**File**: `.github/workflows/azure-deploy.yml`

**Workflow**:
1. **Build & Push Job**:
   - Builds `magnus-api:latest` and `magnus-api:{sha}`
   - Builds `alerts-worker:latest` and `alerts-worker:{sha}`
   - Pushes to Azure Container Registry

2. **Deploy Job**:
   - Updates `magnus-api` Container App
   - Updates `worker-alerts-job` Container Apps Job
   - Runs health check on API
   - Triggers test execution of alerts worker

3. **Notify Job**:
   - Posts deployment summary

**Triggers**:
- Push to `main` or `claude/*` branches
- Manual dispatch with target selection

---

## 🚧 What Needs To Be Implemented

### ❌ 1. Mobile UI Components (Expo)

**Directory Structure**:
```
apps/mobile/
  app/
    search/
      create/
        step1-category.tsx       - Category selector
        step2-manufacturer.tsx   - Manufacturer selector
        step3-models.tsx         - Multi-select model picker
        step4-filters.tsx        - Price/radius sliders
        step5-review.tsx         - Review & save

  components/
    sheets/
      CategorySheet.tsx          - Bottom sheet for categories
      ManufacturerSheet.tsx      - Bottom sheet for manufacturers
      ModelSheet.tsx             - Bottom sheet for models
      FiltersSheet.tsx           - Filters bottom sheet
    listings/
      ListingsGrid.tsx           - FlashList masonry grid
      ListingCard.tsx            - Individual listing card
```

**Key Libraries Needed**:
```json
{
  "@gorhom/bottom-sheet": "^4",
  "@shopify/flash-list": "^1.6",
  "@react-native-community/slider": "^4",
  "expo-notifications": "^0.27",
  "nativewind": "^4"
}
```

**API Integration**:
```typescript
import { SavedSearch, Listing } from '@magnus-flipper-ai/core';
import { CATEGORIES, MANUFACTURERS_BY_CATEGORY, MODELS_BY_MANUFACTURER } from '@magnus-flipper-ai/ui-config';

// Example: Create saved search
const response = await fetch(`${API_URL}/api/saved-searches`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: "NYC iPhone 15 flips",
    category: "phones",
    manufacturer: "apple",
    models: ["iPhone 15 Pro Max", "iPhone 15 Pro"],
    minPrice: 500,
    maxPrice: 1200,
    radiusMiles: 25,
    locationCity: "New York",
    locationLat: 40.7128,
    locationLng: -74.0060,
    conditions: ["LIKE_NEW", "GOOD"],
    sites: ["OFFERUP", "CRAIGSLIST"],
    maxResultsPerRun: 20,
    active: true,
  }),
});
```

### ❌ 2. Web UI Components (Next.js)

**Directory Structure**:
```
apps/web/
  app/
    searches/
      page.tsx                   - List of saved searches
      new/
        page.tsx                 - Wizard controller
        StepCategory.tsx         - Category selection
        StepManufacturer.tsx     - Manufacturer selection
        StepModels.tsx           - Model selection
        StepFilters.tsx          - Filters
        StepReview.tsx           - Review & save
    results/
      page.tsx                   - Results grid with filters

  components/
    search/
      FiltersSheet.tsx           - shadcn Dialog for filters
    listings/
      ListingsGrid.tsx           - Responsive grid
      ListingCard.tsx            - Card component
```

**Key Libraries**:
```json
{
  "@radix-ui/react-dialog": "^1.0",
  "@radix-ui/react-slider": "^1.1",
  "swr": "^2.2",
  "class-variance-authority": "^0.7"
}
```

**Example Usage**:
```typescript
// apps/web/app/searches/page.tsx
'use client';

import useSWR from 'swr';
import { SavedSearch } from '@magnus-flipper-ai/core';

const fetcher = (url: string) =>
  fetch(url, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  }).then((r) => r.json());

export default function SavedSearchesPage() {
  const { data: searches, isLoading } = useSWR<SavedSearch[]>(
    '/api/saved-searches',
    fetcher
  );

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Saved Searches</h1>
      {searches?.map((search) => (
        <Link key={search.id} href={`/results?savedSearchId=${search.id}`}>
          <div className="border rounded-lg p-4 mb-3">
            <h3 className="font-semibold">{search.name}</h3>
            <p className="text-sm text-gray-500">
              {search.category} • {search.manufacturer} • ${search.minPrice}-${search.maxPrice}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
```

---

## 🔧 Environment Variables

### Required for API (`apps/api`)
```bash
# Supabase
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres

# Redis
REDIS_HOST=magnus-redis.redis.cache.windows.net
REDIS_PORT=6380
REDIS_KEY=your-redis-key
REDIS_TLS=true

# Auth
JWT_SECRET=your-jwt-secret

# Server
NODE_ENV=production
PORT=4000
```

### Required for Alerts Worker (`apps/worker-alerts`)
```bash
# Supabase (same as API)
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
DATABASE_URL=postgresql://...

# Redis (same as API)
REDIS_HOST=magnus-redis.redis.cache.windows.net
REDIS_PORT=6380
REDIS_KEY=your-redis-key
REDIS_TLS=true

NODE_ENV=production
```

### Required for Terraform
```hcl
# infra/azure/terraform.tfvars
subscription_id           = "your-azure-subscription-id"
location                  = "eastus"
resource_group_name       = "magnus-rg"
acr_name                  = "magnusacr"
database_url              = "postgresql://..."
supabase_url              = "https://yourproject.supabase.co"
supabase_anon_key         = "eyJ..."
supabase_service_role_key = "eyJ..."
jwt_secret                = "your-secret"
node_env                  = "production"
api_min_replicas          = 1
api_max_replicas          = 5
```

### Required for GitHub Actions
**Secrets to add** (Repository → Settings → Secrets):
```
AZURE_CREDENTIALS         - JSON service principal credentials
```

Generate Azure credentials:
```bash
az ad sp create-for-rbac \
  --name "GitHub-Actions-Magnus" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/magnus-rg \
  --sdk-auth
```

---

## ✅ Verification Checklist

### Phase 1: Database & API
- [ ] Run database migration: `psql $DATABASE_URL < supabase/migrations/20250123_saved_searches.sql`
- [ ] Install dependencies: `pnpm install`
- [ ] Build packages: `pnpm -r --filter './packages/*' build`
- [ ] Build API: `pnpm --filter api build`
- [ ] Start API locally: `pnpm --filter api dev`
- [ ] Test health endpoint: `curl http://localhost:4000/health`
- [ ] Test saved searches CRUD:
  ```bash
  # Create
  curl -X POST http://localhost:4000/api/saved-searches \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test Search",
      "category": "phones",
      "manufacturer": "apple",
      "models": ["iPhone 15 Pro"],
      "minPrice": 500,
      "maxPrice": 1000,
      "active": true
    }'

  # List
  curl http://localhost:4000/api/saved-searches \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```

### Phase 2: Alerts Worker
- [ ] Build worker: `pnpm --filter worker-alerts build`
- [ ] Test locally: `pnpm --filter worker-alerts start:saved-search`
- [ ] Verify it queries saved_searches table
- [ ] Verify it creates listing_matches records
- [ ] Check console logs for Expo push attempts

### Phase 3: Docker & Local Testing
- [ ] Build API image: `docker build -f Dockerfile.api -t magnus-api:test .`
- [ ] Run API container:
  ```bash
  docker run -p 4000:4000 \
    -e DATABASE_URL=$DATABASE_URL \
    -e SUPABASE_URL=$SUPABASE_URL \
    -e SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
    -e NODE_ENV=production \
    magnus-api:test
  ```
- [ ] Build worker image: `docker build -f Dockerfile.worker-alerts -t alerts-worker:test .`
- [ ] Run worker container:
  ```bash
  docker run \
    -e DATABASE_URL=$DATABASE_URL \
    -e SUPABASE_URL=$SUPABASE_URL \
    -e SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
    alerts-worker:test
  ```

### Phase 4: Azure Infrastructure
- [ ] Navigate to `infra/azure`
- [ ] Create `terraform.tfvars` with your values
- [ ] Run `terraform init`
- [ ] Run `terraform plan` and review
- [ ] Run `terraform apply`
- [ ] Save outputs (API URL, ACR server, etc.)
- [ ] Verify resources in Azure Portal:
  - Resource Group: `magnus-rg`
  - Container Registry: `magnusacr`
  - Container App: `magnus-api`
  - Container Apps Job: `worker-alerts-job`
  - Redis Cache: `magnus-redis`

### Phase 5: CI/CD Deployment
- [ ] Add `AZURE_CREDENTIALS` secret to GitHub
- [ ] Push code to `main` or `claude/*` branch
- [ ] Watch GitHub Actions workflow run
- [ ] Verify images pushed to ACR:
  ```bash
  az acr repository list --name magnusacr
  ```
- [ ] Check API deployment:
  ```bash
  az containerapp show --name magnus-api --resource-group magnus-rg
  ```
- [ ] Test deployed API:
  ```bash
  API_URL=$(az containerapp show \
    --name magnus-api \
    --resource-group magnus-rg \
    --query 'properties.configuration.ingress.fqdn' \
    --output tsv)

  curl https://$API_URL/health
  ```
- [ ] Check alerts job executions:
  ```bash
  az containerapp job execution list \
    --name worker-alerts-job \
    --resource-group magnus-rg
  ```

### Phase 6: End-to-End Testing
- [ ] Create a test user account in Supabase
- [ ] Use API to create a saved search
- [ ] Manually add test listings to `listings` table
- [ ] Trigger alerts job manually:
  ```bash
  az containerapp job start \
    --name worker-alerts-job \
    --resource-group magnus-rg
  ```
- [ ] Verify `listing_matches` records created
- [ ] Check job logs:
  ```bash
  az containerapp job logs show \
    --name worker-alerts-job \
    --resource-group magnus-rg
  ```

### Phase 7: Mobile & Web UI (TODO)
- [ ] Implement mobile wizard (5 steps)
- [ ] Implement mobile filters sheet
- [ ] Implement mobile listings grid
- [ ] Integrate Expo push notifications
- [ ] Implement web wizard (Next.js)
- [ ] Implement web filters dialog
- [ ] Implement web listings grid
- [ ] Test end-to-end flow: Create search → Match listings → Receive notification

---

## 🚀 Next Steps

### Immediate:
1. **Run database migration** on your Supabase project
2. **Deploy infrastructure** using Terraform
3. **Set up GitHub Actions secrets**
4. **Push to trigger CI/CD deployment**

### Short-term:
5. **Implement mobile UI** components (Category → Manufacturer → Models → Filters → Review)
6. **Implement web UI** components (same flow, Next.js)
7. **Test saved search creation** from both platforms
8. **Verify alerts worker** runs every 5 minutes

### Long-term:
9. **Add more marketplace scrapers** (integrate existing crawler workers)
10. **Implement subscription tiers** (Starter/Basic/Premium/Ultra)
11. **Add push notification handling** in mobile app
12. **Implement results feed pagination** and infinite scroll
13. **Add analytics and monitoring** dashboards

---

## 📚 Key Files Reference

### Backend & Infrastructure
```
packages/
  core/src/search.ts                    # Shared types
  ui-config/src/searchConfig.ts         # Categories, manufacturers, models

apps/
  api/src/
    lib/db.ts                            # Supabase client
    middleware/auth.ts                   # JWT auth
    routes/savedSearches.ts              # CRUD endpoints
    routes/listings.ts                   # Listings feed
    routes/alerts.ts                     # Alert history

  worker-alerts/src/
    savedSearchJob.ts                    # Cron job runner

supabase/migrations/
  20250123_saved_searches.sql            # Database schema

Dockerfile.api                           # API container
Dockerfile.worker-alerts                 # Worker container

infra/azure/
  main.tf                                # Azure resources
  variables.tf                           # Config variables
  outputs.tf                             # Resource outputs
  README.md                              # Deployment guide

.github/workflows/
  azure-deploy.yml                       # CI/CD pipeline
```

### Frontend (TODO)
```
apps/mobile/                             # Expo app
apps/web/                                # Next.js app
```

---

## 🆘 Troubleshooting

### API won't start
- Check environment variables are set
- Verify Supabase connection: `psql $DATABASE_URL -c "SELECT 1"`
- Check logs: `pnpm --filter api dev`

### Worker job fails
- Check DATABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- Verify listings table has data
- Check job logs in Azure Portal

### Terraform apply fails
- Verify Azure CLI is logged in: `az account show`
- Check subscription has required permissions
- Verify resource names are globally unique (especially ACR)

### GitHub Actions fails
- Check AZURE_CREDENTIALS secret is valid
- Verify service principal has contributor role
- Check workflow logs for specific errors

---

## 🎉 Success Criteria

When complete, you will have:

✅ **Backend**:
- Real-time saved search creation/management
- Automated listing matching every 5 minutes
- Push notifications to mobile users
- Paginated results feeds
- Alert history and statistics

✅ **Infrastructure**:
- Production-ready Azure Container Apps deployment
- Auto-scaling API (1-5 replicas)
- Scheduled alerts worker (cron)
- Redis cache for performance
- Centralized logging

✅ **DevOps**:
- Automated Docker builds
- Zero-downtime deployments
- Health checks
- Manual and automatic triggers

---

**Ready to complete the migration!** 🚀

For questions or issues, check:
- `infra/azure/README.md` - Azure deployment details
- API logs: `az containerapp logs show --name magnus-api --resource-group magnus-rg --follow`
- Job logs: `az containerapp job logs show --name worker-alerts-job --resource-group magnus-rg`
