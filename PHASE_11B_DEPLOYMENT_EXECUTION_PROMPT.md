# PHASE 11B — DEPLOYMENT EXECUTION PROMPT

**Date**: 2024-01-15  
**Status**: READY FOR EXECUTION  
**Prerequisites**: Phase 11A Complete

---

## EXECUTION OVERVIEW

This prompt guides the complete deployment of Magnus Flipper AI across all production platforms. Follow each section sequentially, verifying success before proceeding to the next.

**Estimated Time**: 6-10 hours  
**Risk Level**: HIGH (Production deployment)  
**Rollback Plan**: Documented in each section

---

## PRE-DEPLOYMENT VERIFICATION

### Step 1: Run Pre-Deployment Checks

```bash
# Verify production configuration
./scripts/deploy/verify-production-config.sh

# Verify worker images can be built
./scripts/deploy/verify-worker-images.sh

# Verify runtime configuration
node apps/web/scripts/verify-runtime.js
```

**Expected Result**: All checks pass (exit code 0)

**If Failures**: Fix issues before proceeding. Do NOT deploy with errors.

---

## SECTION 1: SUPABASE DEPLOYMENT

### Step 1.1: Database Schema Deployment

**Action**: Apply Prisma migrations to production database

```bash
# Set production database URL
export DATABASE_URL="postgresql://user:pass@host:5432/db"

# Generate Prisma client
pnpm generate

# Apply migrations
pnpm prisma migrate deploy
```

**Verification**:
- [ ] Migrations applied successfully
- [ ] No migration errors
- [ ] All tables exist
- [ ] Foreign key constraints verified

**Rollback**: Restore from backup if migrations fail

---

### Step 1.2: Row Level Security (RLS) Configuration

**Action**: Enable RLS and configure policies

1. **Enable RLS on all tables**:
   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
   ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
   ALTER TABLE sold_items ENABLE ROW LEVEL SECURITY;
   ALTER TABLE shipping_labels ENABLE ROW LEVEL SECURITY;
   ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
   ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
   ```

2. **Create policies** (see `SUPABASE_DEPLOYMENT_PLAN.md` for examples)

**Verification**:
- [ ] RLS enabled on all tables
- [ ] Policies created and tested
- [ ] Users can only access their own data
- [ ] Service role can access all data

**Rollback**: Disable RLS if policies cause issues (temporary)

---

### Step 1.3: Storage Buckets Configuration

**Action**: Create and configure storage buckets

1. **Create buckets**:
   - `shipping-labels` (private)
   - `inventory-images` (public with signed URLs)
   - `user-uploads` (private)

2. **Configure bucket policies** (see `SUPABASE_DEPLOYMENT_PLAN.md`)

**Verification**:
- [ ] Buckets created
- [ ] Policies configured
- [ ] Test upload/download works
- [ ] Signed URLs work correctly

---

### Step 1.4: Authentication Configuration

**Action**: Configure auth providers

1. **Enable Email/Password**:
   - [ ] Email confirmation required
   - [ ] Password reset enabled
   - [ ] Rate limiting configured

2. **Configure OAuth** (if applicable):
   - [ ] Google OAuth
   - [ ] GitHub OAuth
   - [ ] Apple OAuth

**Verification**:
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test password reset
- [ ] Test OAuth flows (if enabled)

---

## SECTION 2: STRIPE CONFIGURATION

### Step 2.1: Create Products in TEST Mode

**Action**: Create subscription products for testing

1. **Go to Stripe Dashboard** → Products
2. **Create Products**:
   - Basic Tier (if applicable)
   - Pro Tier
   - Premium Tier
   - Admin Tier (if applicable)

3. **Note Price IDs**: Copy all `price_xxxxx` IDs

**Verification**:
- [ ] All products created
- [ ] Price IDs documented
- [ ] Products have correct metadata

---

### Step 2.2: Configure TEST Webhook

**Action**: Set up webhook endpoint for testing

1. **Go to Stripe Dashboard** → Developers → Webhooks
2. **Add Endpoint**:
   - URL: `https://[preview-url]/api/stripe/webhook`
   - Events: Select all subscription and invoice events
3. **Copy Signing Secret**: `whsec_xxxxx`

**Verification**:
- [ ] Webhook endpoint created
- [ ] Signing secret copied
- [ ] Test webhook event sent
- [ ] Webhook received and processed

---

### Step 2.3: Create Products in LIVE Mode

**Action**: Create production products

1. **Switch to LIVE mode** in Stripe Dashboard
2. **Create same products** as TEST mode
3. **Note LIVE Price IDs**

**Verification**:
- [ ] All products created in LIVE mode
- [ ] LIVE Price IDs documented
- [ ] Products match TEST products

---

### Step 2.4: Configure LIVE Webhook

**Action**: Set up production webhook

1. **Add Endpoint**:
   - URL: `https://[production-url]/api/stripe/webhook`
   - Events: Select all subscription and invoice events
2. **Copy LIVE Signing Secret**

**Verification**:
- [ ] Production webhook created
- [ ] Signing secret copied
- [ ] Webhook URL is correct

---

### Step 2.5: Configure Customer Portal

**Action**: Enable and configure Stripe Customer Portal

1. **Go to Settings** → Billing → Customer Portal
2. **Enable Customer Portal**
3. **Configure Features**:
   - [ ] Allow payment method updates
   - [ ] Allow subscription cancellation
   - [ ] Allow billing information updates
   - [ ] Allow invoice viewing

**Verification**:
- [ ] Customer portal enabled
- [ ] Features configured
- [ ] Test portal access works

---

## SECTION 3: AZURE WORKER DEPLOYMENT

### Step 3.1: Create Azure Resources

**Action**: Create required Azure infrastructure

```bash
# Set variables
export RESOURCE_GROUP="magnus-flipper-rg"
export LOCATION="eastus"
export REGISTRY_NAME="magnusflipperacr"
export ENV_NAME="magnus-flipper-env"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Container Registry
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $REGISTRY_NAME \
  --sku Basic \
  --admin-enabled true

# Create Container App Environment
az containerapp env create \
  --name $ENV_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION
```

**Verification**:
- [ ] Resource group created
- [ ] Container Registry created
- [ ] Container App Environment created
- [ ] All resources accessible

---

### Step 3.2: Configure Container Registry Secrets

**Action**: Store Supabase credentials as secrets

```bash
# Get registry login server
REGISTRY_SERVER=$(az acr show --name $REGISTRY_NAME --query loginServer -o tsv)

# Create secrets in Container App Environment
az containerapp env secret set \
  --name $ENV_NAME \
  --resource-group $RESOURCE_GROUP \
  --secrets \
    supabase-url="https://xxxxx.supabase.co" \
    supabase-service-role-key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Verification**:
- [ ] Secrets created
- [ ] Secrets accessible
- [ ] No secrets exposed in logs

---

### Step 3.3: Build and Push Worker Images

**Action**: Build Docker images and push to registry

```bash
# Login to ACR
az acr login --name $REGISTRY_NAME

# Set registry variable
export REGISTRY=$REGISTRY_SERVER

# Build and push worker-scraper
docker build -t $REGISTRY/worker-scraper:latest \
  -f infra/azure-workers/worker-scraper/Dockerfile .
docker push $REGISTRY/worker-scraper:latest

# Build and push worker-tracker
docker build -t $REGISTRY/worker-tracker:latest \
  -f infra/azure-workers/worker-tracker/Dockerfile .
docker push $REGISTRY/worker-tracker:latest

# Build and push worker-autosell
docker build -t $REGISTRY/worker-autosell:latest \
  -f infra/azure-workers/worker-autosell/Dockerfile .
docker push $REGISTRY/worker-autosell:latest
```

**Verification**:
- [ ] All images built successfully
- [ ] All images pushed to registry
- [ ] Images visible in ACR
- [ ] Image sizes reasonable (< 500MB each)

**Use Script**:
```bash
./scripts/deploy/verify-worker-images.sh
```

---

### Step 3.4: Deploy Container Apps

**Action**: Deploy workers to Azure Container Apps

```bash
# Deploy worker-scraper
az containerapp create \
  --name worker-scraper \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image $REGISTRY/worker-scraper:latest \
  --target-port 8080 \
  --min-replicas 1 \
  --max-replicas 5 \
  --env-vars \
    NODE_ENV=production \
    WORKER_ID=worker-scraper-001 \
  --secrets \
    supabase-url=supabase-url \
    supabase-service-role-key=supabase-service-role-key

# Deploy worker-tracker
az containerapp create \
  --name worker-tracker \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image $REGISTRY/worker-tracker:latest \
  --target-port 8080 \
  --min-replicas 1 \
  --max-replicas 3 \
  --env-vars \
    NODE_ENV=production \
    WORKER_ID=worker-tracker-001 \
  --secrets \
    supabase-url=supabase-url \
    supabase-service-role-key=supabase-service-role-key

# Deploy worker-autosell
az containerapp create \
  --name worker-autosell \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image $REGISTRY/worker-autosell:latest \
  --target-port 8080 \
  --min-replicas 1 \
  --max-replicas 3 \
  --env-vars \
    NODE_ENV=production \
    WORKER_ID=worker-autosell-001 \
  --secrets \
    supabase-url=supabase-url \
    supabase-service-role-key=supabase-service-role-key
```

**Verification**:
- [ ] All Container Apps created
- [ ] Health checks passing
- [ ] Containers running
- [ ] Logs show no errors
- [ ] Workers can connect to Supabase

**Check Health**:
```bash
# Check worker-scraper
az containerapp show --name worker-scraper --resource-group $RESOURCE_GROUP --query properties.runningStatus

# Check worker-tracker
az containerapp show --name worker-tracker --resource-group $RESOURCE_GROUP --query properties.runningStatus

# Check worker-autosell
az containerapp show --name worker-autosell --resource-group $RESOURCE_GROUP --query properties.runningStatus
```

---

## SECTION 4: VERCEL WEB APP DEPLOYMENT

### Step 4.1: Connect GitHub Repository

**Action**: Link repository to Vercel

1. **Go to Vercel Dashboard** → Add New Project
2. **Import Git Repository**: Select Magnus Flipper AI repo
3. **Configure Project**:
   - Framework Preset: Next.js
   - Root Directory: `apps/web` (or leave empty if using root)
   - Build Command: `pnpm --filter web build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

**Verification**:
- [ ] Project created
- [ ] Repository connected
- [ ] Build settings configured

---

### Step 4.2: Configure Environment Variables

**Action**: Set all required environment variables in Vercel

**Go to**: Project Settings → Environment Variables

**Add Variables** (see `DEPLOYMENT_ENV_MATRIX.md` for complete list):

**Production Environment**:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ID_BASIC=price_xxxxx
STRIPE_PRICE_ID_PRO=price_xxxxx
STRIPE_PRICE_ID_PREMIUM=price_xxxxx
STRIPE_PRICE_ID_ADMIN=price_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
NEXT_PUBLIC_APP_URL=https://magnusflipper.ai
NODE_ENV=production
```

**Preview Environment** (use TEST keys):
```
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx (TEST)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

**Verification**:
- [ ] All variables set
- [ ] Production uses LIVE Stripe keys
- [ ] Preview uses TEST Stripe keys
- [ ] No placeholder values

---

### Step 4.3: Deploy to Preview

**Action**: Deploy to preview environment first

1. **Create Pull Request** or push to preview branch
2. **Vercel automatically deploys** preview
3. **Wait for deployment** to complete

**Verification**:
- [ ] Preview deployment successful
- [ ] Preview URL accessible
- [ ] Health check passes: `https://[preview-url]/api/health`
- [ ] No build errors
- [ ] No runtime errors in logs

**Test Preview**:
- [ ] Login works
- [ ] Signup works
- [ ] API routes respond
- [ ] Stripe checkout works (TEST mode)
- [ ] Webhook receives test events

---

### Step 4.4: Deploy to Production

**Action**: Deploy to production

**Option A: Automatic Deployment**
1. **Merge to main branch** (triggers automatic production deployment)
2. **Wait for deployment** to complete

**Option B: Manual Deployment**
1. **Go to Vercel Dashboard** → Deployments
2. **Click "Promote to Production"** on preview deployment

**Verification**:
- [ ] Production deployment successful
- [ ] Production URL accessible
- [ ] Health check passes: `https://[production-url]/api/health`
- [ ] No errors in production logs

**Test Production**:
- [ ] Homepage loads
- [ ] Login works
- [ ] Signup works
- [ ] Dashboard accessible
- [ ] API routes respond
- [ ] Stripe checkout works (LIVE mode)
- [ ] Webhook receives events

---

### Step 4.5: Configure Custom Domain

**Action**: Add custom domain (if applicable)

1. **Go to**: Project Settings → Domains
2. **Add Domain**: Enter your domain
3. **Configure DNS**: Follow Vercel instructions
4. **Wait for SSL**: Automatic SSL provisioning

**Verification**:
- [ ] Domain added
- [ ] DNS configured correctly
- [ ] SSL certificate active
- [ ] Domain accessible

---

## SECTION 5: MOBILE APP DEPLOYMENT (EAS)

### Step 5.1: Install Missing Dependencies

**Action**: Install expo-build-properties

```bash
cd apps/mobile
pnpm add expo-build-properties
```

**Verification**:
- [ ] Package installed
- [ ] Appears in `package.json`
- [ ] No installation errors

---

### Step 5.2: Configure EAS Secrets

**Action**: Set all required secrets in EAS

```bash
# Login to EAS
eas login

# Set Supabase secrets
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxxxx.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Set Stripe secret
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "pk_live_xxxxx"

# Set API URL
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.magnusflipper.ai"

# Set Project ID
eas secret:create --scope project --name EXPO_PUBLIC_PROJECT_ID --value "your-project-id"
```

**Verification**:
```bash
# List all secrets
eas secret:list
```

- [ ] All secrets created
- [ ] Secrets visible in list
- [ ] No placeholder values

---

### Step 5.3: Create EAS Build Configuration

**Action**: Create `apps/mobile/eas.json` (if not exists)

See `EAS_DEPLOYMENT_PLAN.md` for full configuration.

**Verification**:
- [ ] `eas.json` exists
- [ ] Build profiles configured
- [ ] iOS and Android profiles set

---

### Step 5.4: Build Development Version

**Action**: Build development version for testing

```bash
cd apps/mobile

# Build iOS development
pnpm eas:build:dev:ios

# Build Android development
pnpm eas:build:dev:android
```

**Verification**:
- [ ] Builds complete successfully
- [ ] Install on test devices
- [ ] App launches without crashes
- [ ] Supabase connection works
- [ ] API calls succeed

---

### Step 5.5: Build Production Version

**Action**: Build production version for app stores

```bash
cd apps/mobile

# Build iOS production
pnpm eas:build:prod:ios

# Build Android production
pnpm eas:build:prod:android
```

**Verification**:
- [ ] Production builds complete
- [ ] Build artifacts available
- [ ] Version numbers correct
- [ ] Bundle identifiers correct

---

### Step 5.6: Submit to App Stores

**Action**: Submit builds to iOS App Store and Google Play

**iOS**:
```bash
pnpm eas:submit:prod:ios
```

**Android**:
```bash
pnpm eas:submit:prod:android
```

**Verification**:
- [ ] Submissions successful
- [ ] Apps appear in App Store Connect / Play Console
- [ ] Metadata complete
- [ ] Screenshots uploaded (if required)

---

## SECTION 6: POST-DEPLOYMENT VERIFICATION

### Step 6.1: Comprehensive System Check

**Action**: Verify all systems operational

**Web App**:
- [ ] Production URL accessible
- [ ] Health endpoint: `GET /api/health` returns 200
- [ ] Authentication works
- [ ] Subscription creation works
- [ ] Payment processing works
- [ ] Admin dashboard accessible

**Workers**:
- [ ] All workers running
- [ ] Health checks passing
- [ ] Workers processing jobs
- [ ] No errors in worker logs
- [ ] Supabase connections working

**Database**:
- [ ] Database accessible
- [ ] RLS policies working
- [ ] Storage buckets accessible
- [ ] No connection errors

**Stripe**:
- [ ] Webhooks receiving events
- [ ] Subscription creation works
- [ ] Payment processing works
- [ ] Customer portal accessible

**Mobile**:
- [ ] App installs on devices
- [ ] App launches successfully
- [ ] API connections work
- [ ] Authentication works

---

### Step 6.2: Functional Testing

**Action**: Test critical user flows

**User Journey 1: Signup → Subscription**
- [ ] User can sign up
- [ ] User receives confirmation email
- [ ] User can upgrade to Pro tier
- [ ] Stripe checkout works
- [ ] Subscription created in database
- [ ] User tier updated

**User Journey 2: Listing Management**
- [ ] User can create listing
- [ ] Listing appears in dashboard
- [ ] Listing data stored correctly

**User Journey 3: Sale Detection**
- [ ] Worker detects sale
- [ ] Sale finalized correctly
- [ ] Ledger entries created
- [ ] Profit calculated

**User Journey 4: Shipping**
- [ ] Shipping label generated
- [ ] Tracking updates work
- [ ] Worker tracks shipments

---

### Step 6.3: Monitoring Setup

**Action**: Configure monitoring and alerts

**Vercel**:
- [ ] Error tracking enabled (if using Sentry)
- [ ] Log aggregation configured
- [ ] Performance monitoring enabled

**Azure**:
- [ ] Application Insights configured
- [ ] Alerts set up for:
  - Container failures
  - High error rates
  - Resource exhaustion

**Supabase**:
- [ ] Database monitoring enabled
- [ ] Storage usage alerts
- [ ] API usage monitoring

**Stripe**:
- [ ] Webhook delivery monitoring
- [ ] Failed payment alerts
- [ ] Revenue tracking

---

### Step 6.4: Documentation Update

**Action**: Document deployment details

**Update**:
- [ ] Production URLs documented
- [ ] Environment variables documented (without secrets)
- [ ] Deployment dates recorded
- [ ] Known issues documented
- [ ] Rollback procedures documented

---

## ROLLBACK PROCEDURES

### Web App Rollback (Vercel)

```bash
# Option 1: Revert to previous deployment
# Go to Vercel Dashboard → Deployments
# Click "Promote to Production" on previous deployment

# Option 2: Revert code and redeploy
git revert HEAD
git push origin main
```

### Worker Rollback (Azure)

```bash
# Rollback Container App to previous revision
az containerapp revision list \
  --name worker-scraper \
  --resource-group $RESOURCE_GROUP

az containerapp update \
  --name worker-scraper \
  --resource-group $RESOURCE_GROUP \
  --revision-suffix previous-revision
```

### Database Rollback (Supabase)

```bash
# Restore from backup
# Go to Supabase Dashboard → Database → Backups
# Select backup point and restore
```

### Stripe Rollback

**No rollback needed** - Webhooks are idempotent. Fix webhook handler and redeploy.

---

## EMERGENCY CONTACTS

- **Vercel Support**: [Vercel Dashboard → Support]
- **Supabase Support**: [Supabase Dashboard → Support]
- **Stripe Support**: [Stripe Dashboard → Support]
- **Azure Support**: [Azure Portal → Support]

---

## DEPLOYMENT CHECKLIST SUMMARY

### Pre-Deployment
- [ ] All Phase 11A files reviewed
- [ ] Pre-deployment checks passed
- [ ] All secrets ready (not placeholders)
- [ ] Backup strategy confirmed

### Supabase
- [ ] Migrations applied
- [ ] RLS policies configured
- [ ] Storage buckets created
- [ ] Auth providers configured

### Stripe
- [ ] Products created (TEST and LIVE)
- [ ] Webhooks configured (TEST and LIVE)
- [ ] Customer portal enabled
- [ ] Price IDs documented

### Azure Workers
- [ ] Resources created
- [ ] Images built and pushed
- [ ] Container Apps deployed
- [ ] Health checks passing

### Vercel Web App
- [ ] Repository connected
- [ ] Environment variables set
- [ ] Preview deployment tested
- [ ] Production deployment successful
- [ ] Custom domain configured (if applicable)

### Mobile App
- [ ] expo-build-properties installed
- [ ] EAS secrets configured
- [ ] Development builds tested
- [ ] Production builds created
- [ ] Submitted to app stores

### Post-Deployment
- [ ] System checks passed
- [ ] Functional testing complete
- [ ] Monitoring configured
- [ ] Documentation updated

---

## SUCCESS CRITERIA

Phase 11B is **COMPLETE** when:

1. ✅ Web app deployed and accessible at production URL
2. ✅ All workers running and healthy
3. ✅ Database accessible with RLS enabled
4. ✅ Stripe webhooks receiving and processing events
5. ✅ Mobile app builds successful (if deploying mobile)
6. ✅ All critical user flows tested and working
7. ✅ Monitoring and alerts configured
8. ✅ No critical errors in logs

---

## NEXT STEPS AFTER DEPLOYMENT

1. **Monitor** for 24-48 hours
2. **Review** error logs daily
3. **Optimize** based on performance metrics
4. **Iterate** on user feedback
5. **Scale** resources as needed

---

**END OF PHASE 11B DEPLOYMENT EXECUTION PROMPT**

**Ready to Execute**: ✅ YES  
**Risk Level**: HIGH  
**Estimated Time**: 6-10 hours

