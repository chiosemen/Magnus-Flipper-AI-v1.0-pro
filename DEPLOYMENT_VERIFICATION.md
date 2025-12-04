# DEPLOYMENT VERIFICATION CHECKLIST

**Last Updated**: 2024-01-15  
**Purpose**: Pre-deployment verification steps to ensure production readiness

---

## PRE-DEPLOYMENT CHECKS

### 1. Code Quality & Build Verification

- [ ] All TypeScript errors resolved (`pnpm tsc --noEmit`)
- [ ] All linting errors resolved (`pnpm lint`)
- [ ] All tests passing (if applicable)
- [ ] No console errors in build output
- [ ] Build completes successfully (`pnpm build`)
- [ ] Web app builds successfully (`pnpm --filter web build`)
- [ ] All worker packages build successfully
- [ ] Mobile app builds successfully (`pnpm --filter mobile build`)

### 2. Environment Variables

- [ ] All required environment variables documented in `DEPLOYMENT_ENV_MATRIX.md`
- [ ] Vercel environment variables configured
- [ ] Azure Container App secrets configured
- [ ] Expo EAS secrets configured
- [ ] No placeholder values in production environments
- [ ] All high-risk variables stored securely

### 3. Required Keys & Credentials

#### Supabase
- [ ] Project URL configured
- [ ] Anon key configured
- [ ] Service role key configured (server-only)
- [ ] Database connection verified
- [ ] RLS policies reviewed and tested

#### Stripe
- [ ] LIVE secret key configured (production)
- [ ] TEST secret key configured (staging)
- [ ] Publishable keys configured
- [ ] Webhook signing secrets configured
- [ ] Price IDs verified
- [ ] Product IDs verified

#### Azure
- [ ] Container Registry credentials configured
- [ ] Resource group created
- [ ] Container App environment created
- [ ] Worker secrets configured

### 4. GitHub → Vercel Linking

- [ ] Vercel project connected to GitHub repository
- [ ] Production branch configured (typically `main` or `master`)
- [ ] Preview deployments enabled for PRs
- [ ] Automatic deployments enabled
- [ ] Build command verified: `pnpm --filter web build`
- [ ] Output directory verified: `.next`
- [ ] Node.js version specified (18.x or 20.x)
- [ ] Environment variables synced from Vercel dashboard

### 5. Stripe Webhook Verification

- [ ] Webhook endpoint created: `/api/stripe/webhook`
- [ ] Webhook URL configured in Stripe dashboard
- [ ] Webhook signing secret retrieved from Stripe
- [ ] Webhook secret set in Vercel environment variables
- [ ] Test webhook events sent and verified
- [ ] Webhook handler tested with test events:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### 6. Supabase Policies Check

- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Policies reviewed for:
  - `users` table
  - `inventory` table
  - `listings` table
  - `sold_items` table
  - `shipping_labels` table
  - `ledger_entries` table
  - `subscriptions` table
- [ ] Service role key usage verified (server-side only)
- [ ] Anon key usage verified (client-side with RLS)
- [ ] Storage buckets configured with proper policies
- [ ] Storage bucket policies tested

### 7. Worker → Azure Registry Build Check

- [ ] Docker images built for all workers:
  - [ ] `worker-scraper`
  - [ ] `worker-tracker`
  - [ ] `worker-autosell`
- [ ] Images pushed to Azure Container Registry
- [ ] Container health checks verified
- [ ] Environment variables injected into containers
- [ ] Scaling rules configured (min/max replicas)
- [ ] Health probes configured
- [ ] Container App deployments verified

### 8. Database Schema Verification

- [ ] Prisma schema up to date
- [ ] Database migrations applied
- [ ] Seed data loaded (if applicable)
- [ ] Foreign key constraints verified
- [ ] Indexes created for performance
- [ ] Backup strategy configured

### 9. API Route Verification

- [ ] All API routes tested:
  - [ ] `/api/health` - Health check
  - [ ] `/api/stripe/webhook` - Stripe webhooks
  - [ ] `/api/subscription` - Subscription management
  - [ ] `/api/profit/*` - Profit analytics
  - [ ] `/api/shipping/*` - Shipping management
  - [ ] `/api/admin/*` - Admin endpoints
- [ ] Authentication middleware verified
- [ ] Authorization checks in place
- [ ] Rate limiting configured (if applicable)
- [ ] Error handling verified

### 10. Security Checks

- [ ] HTTPS enforced (Vercel default)
- [ ] CORS configured correctly
- [ ] Security headers configured
- [ ] API rate limiting configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified (using Prisma)
- [ ] XSS prevention verified
- [ ] CSRF protection verified (Next.js default)

---

## REQUIRED BUILDS

### Before Deployment

1. **Engine Packages**
   ```bash
   pnpm --filter '@magnus-flipper-ai/*' build
   ```

2. **Workers**
   ```bash
   pnpm --filter worker-scraper build
   pnpm --filter worker-tracker build
   pnpm --filter worker-autosell build
   ```

3. **Web App**
   ```bash
   pnpm --filter web build
   ```

4. **Mobile App** (if deploying)
   ```bash
   pnpm --filter mobile build
   ```

---

## DEPLOYMENT ORDER

1. **Supabase** (if schema changes)
   - Run migrations
   - Verify RLS policies
   - Test database connections

2. **Workers** (Azure)
   - Build Docker images
   - Push to registry
   - Deploy Container Apps
   - Verify health checks

3. **Web App** (Vercel)
   - Deploy to preview/staging first
   - Verify all routes
   - Test Stripe webhooks
   - Deploy to production

4. **Mobile App** (EAS)
   - Build with EAS
   - Test on TestFlight/Internal Testing
   - Submit to app stores

---

## POST-DEPLOYMENT VERIFICATION

### Immediate Checks

- [ ] Web app accessible at production URL
- [ ] Health check endpoint returns 200
- [ ] Workers running and healthy
- [ ] Database connections working
- [ ] Stripe webhooks receiving events
- [ ] No errors in logs

### Functional Tests

- [ ] User authentication works
- [ ] Subscription creation works
- [ ] Payment processing works
- [ ] Webhook events processed correctly
- [ ] Admin dashboard accessible
- [ ] API endpoints respond correctly

### Monitoring

- [ ] Error tracking configured (Sentry, etc.)
- [ ] Log aggregation configured
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Alerting rules configured

---

## ROLLBACK PLAN

If deployment fails:

1. **Vercel**: Revert to previous deployment
2. **Azure**: Rollback Container App revision
3. **Database**: Restore from backup if schema changes
4. **Stripe**: No rollback needed (webhooks are idempotent)

---

## SUPPORT CONTACTS

- **Vercel Support**: [Vercel Dashboard → Support]
- **Supabase Support**: [Supabase Dashboard → Support]
- **Stripe Support**: [Stripe Dashboard → Support]
- **Azure Support**: [Azure Portal → Support]

---

**END OF DEPLOYMENT VERIFICATION CHECKLIST**

