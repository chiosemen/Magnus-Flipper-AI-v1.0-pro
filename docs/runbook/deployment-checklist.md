# Deployment Checklist

## Overview

This checklist ensures safe and successful deployments to production.

## Pre-Deployment Checklist

### Code Review

- [ ] All changes reviewed and approved
- [ ] No secrets or credentials in code
- [ ] Environment variables documented
- [ ] Breaking changes documented
- [ ] Migration scripts prepared (if needed)

### Testing

- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing (if applicable)
- [ ] Manual testing completed
- [ ] Performance testing completed (if major changes)

### Documentation

- [ ] Changelog updated
- [ ] API changes documented
- [ ] Configuration changes documented
- [ ] Runbook updated (if procedures changed)

## Vercel Pre-Deployment Checklist

### Environment Variables

- [ ] All required environment variables set
- [ ] No placeholder values in production
- [ ] Supabase keys verified (test connection)
- [ ] Stripe keys verified (test API call)
- [ ] Webhook secrets verified
- [ ] API URLs correct for production

**Verify Environment Variables**:
```bash
# Use validation script
node scripts/validate-env.ts
```

### Build Verification

- [ ] Local build succeeds: `pnpm --filter web build`
- [ ] TypeScript compiles: `pnpm --filter web typecheck`
- [ ] No build warnings or errors
- [ ] Bundle size acceptable
- [ ] No missing dependencies

### Configuration

- [ ] `next.config.mjs` reviewed
- [ ] Security headers configured
- [ ] ISR settings appropriate
- [ ] Cache settings configured
- [ ] Redirect rules correct

### Preview Deployment

- [ ] Deploy to preview environment first
- [ ] Test preview deployment
- [ ] Verify health endpoint: `GET /api/health`
- [ ] Test critical user flows
- [ ] Verify no console errors

## Supabase Environment Verification

### Database

- [ ] Database migrations applied (if any)
- [ ] Schema changes tested
- [ ] RLS policies reviewed
- [ ] Indexes optimized
- [ ] Backup taken (if major changes)

### Authentication

- [ ] Auth providers configured
- [ ] Email templates updated (if changed)
- [ ] Session settings appropriate
- [ ] Password policies configured

### API Keys

- [ ] `NEXT_PUBLIC_SUPABASE_URL` correct
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` correct
- [ ] `SUPABASE_SERVICE_ROLE_KEY` correct (server-side only)
- [ ] Keys tested (connection successful)

**Test Connection**:
```bash
curl -X POST https://your-project-id.supabase.co/rest/v1/users \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Prefer: return=minimal"
```

## Stripe Key Verification

### API Keys

- [ ] `STRIPE_SECRET_KEY` is live key (not test)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is live key
- [ ] Keys match Stripe dashboard
- [ ] Keys have correct permissions

**Test Stripe Connection**:
```bash
curl https://api.stripe.com/v1/balance \
  -u sk_live_YOUR_SECRET_KEY:
```

### Webhook Configuration

- [ ] Webhook endpoint URL correct: `https://magnusflipper.com/api/stripe/webhook`
- [ ] `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- [ ] Required events enabled:
  - `customer.created`
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

**Test Webhook**:
```bash
# Use Stripe CLI
stripe listen --forward-to https://magnusflipper.com/api/stripe/webhook
stripe trigger payment_intent.succeeded
```

### Price IDs

- [ ] `STRIPE_PRO_PRICE` (or `PRICE_PRO`) set and valid
- [ ] `STRIPE_AGENCY_PRICE` (or `PRICE_AGENCY`) set and valid
- [ ] Price IDs match Stripe dashboard
- [ ] Prices are active in Stripe

## EAS Build Verification

### Configuration

- [ ] `app.config.js` reviewed
- [ ] `eas.json` configuration correct
- [ ] Environment variables set in EAS
- [ ] Build profiles configured

### Secrets

- [ ] `EXPO_PUBLIC_SUPABASE_URL` set
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` set
- [ ] `EXPO_PUBLIC_API_URL` set

**Verify EAS Secrets**:
```bash
eas secret:list
```

### Build Testing

- [ ] Test build succeeds: `eas build --platform ios --profile preview`
- [ ] Test build succeeds: `eas build --platform android --profile preview`
- [ ] App functionality verified in test build
- [ ] Environment variables loaded correctly

## Deployment Steps

### 1. Final Pre-Deployment Check

- [ ] All checklist items completed
- [ ] Team notified of deployment
- [ ] Deployment window scheduled (if needed)
- [ ] Rollback plan prepared

### 2. Deploy to Vercel

**Via Dashboard**:
1. Go to Vercel dashboard
2. Select project
3. Click "Deployments"
4. Click "Redeploy" on latest deployment
5. Or push to main branch to trigger auto-deploy

**Via CLI**:
```bash
cd apps/web
vercel --prod
```

### 3. Monitor Deployment

- [ ] Watch deployment logs
- [ ] Verify build succeeds
- [ ] Check for deployment errors
- [ ] Verify deployment completes

### 4. Post-Deployment Verification

**Health Check**:
```bash
curl https://magnusflipper.com/api/health
# Should return status: "ok"
```

**Functional Tests**:
- [ ] Homepage loads
- [ ] Login works
- [ ] Admin dashboard accessible (if admin)
- [ ] API endpoints responding
- [ ] Payment flow works (test mode)

**Performance Check**:
```bash
curl -H "Cookie: <admin-session>" \
  https://magnusflipper.com/api/system/telemetry
# Check latency and error rates
```

### 5. Monitor for Issues

**First 15 Minutes**:
- [ ] Monitor error logs
- [ ] Check error rates
- [ ] Verify no spike in errors
- [ ] Check worker status

**First Hour**:
- [ ] Monitor system telemetry
- [ ] Check user reports
- [ ] Verify critical features
- [ ] Review performance metrics

## Canary Release Flow (If Needed)

### Phase 1: Internal Testing (10% traffic)

1. **Deploy to Preview**
   - Deploy to preview environment
   - Test internally
   - Verify functionality

2. **Monitor**
   - Check error rates
   - Verify performance
   - Review logs

### Phase 2: Limited Production (25% traffic)

1. **Enable Feature Flag** (if applicable)
   - Enable for subset of users
   - Monitor closely

2. **Monitor Metrics**
   - Error rates
   - Performance metrics
   - User feedback

### Phase 3: Full Rollout (100% traffic)

1. **Enable for All Users**
   - Remove feature flags
   - Full deployment

2. **Continue Monitoring**
   - Monitor for 24-48 hours
   - Watch for issues
   - Be ready to rollback

## Rollback Procedure

### When to Rollback

- Error rate > 10% for 10+ minutes
- Critical feature broken
- Performance degradation > 50%
- Security issue discovered
- Data corruption detected

### Rollback Steps

1. **Identify Last Good Deployment**
   - Go to Vercel dashboard
   - Find last known good deployment
   - Note deployment URL/ID

2. **Promote Previous Deployment**
   - Click on previous deployment
   - Click "Promote to Production"
   - Confirm promotion

3. **Verify Rollback**
   ```bash
   curl https://magnusflipper.com/api/health
   # Should return status: "ok"
   ```

4. **Monitor Recovery**
   - Check error rates return to normal
   - Verify functionality restored
   - Document rollback reason

## Post-Deployment Checklist

### Immediate (First Hour)

- [ ] Health endpoint returns "ok"
- [ ] No critical errors in logs
- [ ] Error rates within normal range
- [ ] Performance metrics acceptable
- [ ] Workers processing jobs
- [ ] Payment processing working

### Short-term (First 24 Hours)

- [ ] Monitor error logs daily
- [ ] Review performance metrics
- [ ] Check user feedback
- [ ] Verify all features working
- [ ] Review alert history

### Documentation

- [ ] Update deployment log
- [ ] Document any issues encountered
- [ ] Update runbook if procedures changed
- [ ] Share deployment summary with team

## Emergency Deployment

For critical security patches or urgent fixes:

1. **Expedited Review**: Fast-track code review
2. **Minimal Testing**: Focus on critical paths
3. **Deploy Immediately**: Don't wait for full checklist
4. **Monitor Closely**: Watch for issues
5. **Post-Deployment Review**: Complete full checklist after deployment

## Deployment Communication

### Pre-Deployment

- Notify team of planned deployment
- Share deployment window
- Communicate expected changes

### During Deployment

- Update team on deployment status
- Share any issues encountered
- Communicate delays if any

### Post-Deployment

- Confirm successful deployment
- Share deployment summary
- Document any issues
- Update changelog

## Related Documents

- [Health Checks](./health-checks.md) - Post-deployment health verification
- [Restart and Recovery](./restart-and-recovery.md) - Recovery procedures
- [Incident Response](./incident-response.md) - Handling deployment issues

