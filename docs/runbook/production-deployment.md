# Production Deployment Runbook

## Overview

This runbook provides step-by-step procedures for deploying Magnus Flipper AI to production environments.

## Pre-Deployment Checklist

### 1. Code Quality
- [ ] All tests passing (`pnpm test`)
- [ ] Lint checks passing (`pnpm lint`)
- [ ] Type checks passing (`pnpm typecheck`)
- [ ] No critical security vulnerabilities
- [ ] Code review approved

### 2. Environment Variables
- [ ] All required environment variables configured
- [ ] Secrets stored securely (GitHub Secrets, Azure Key Vault)
- [ ] No hardcoded credentials
- [ ] Environment-specific configs validated

### 3. Database Migrations
- [ ] Migrations tested in staging
- [ ] Backup created before migration
- [ ] Rollback plan documented
- [ ] Migration scripts reviewed

### 4. Infrastructure
- [ ] Azure resources provisioned
- [ ] Container registry accessible
- [ ] Log Analytics workspace configured
- [ ] Alert rules configured
- [ ] Health checks configured

### 5. Monitoring & Observability
- [ ] Health check endpoints accessible
- [ ] Log aggregation configured
- [ ] Metrics collection enabled
- [ ] Alert notifications tested
- [ ] Dashboard access verified

## Deployment Procedures

### Web App Deployment (Vercel)

#### Automatic Deployment (via GitHub Actions)

1. **Merge to main branch**
   ```bash
   git checkout main
   git pull origin main
   git merge feature-branch
   git push origin main
   ```

2. **Monitor GitHub Actions**
   - Workflow: `.github/workflows/deploy-web.yml`
   - Check for successful build and deployment
   - Verify preview URL (for PRs) or production URL

3. **Post-Deployment Verification**
   ```bash
   # Health check
   curl https://magnusflipper.com/api/health
   
   # Detailed health check
   curl https://magnusflipper.com/api/health/detailed
   ```

#### Manual Deployment (Vercel CLI)

```bash
cd apps/web
vercel --prod
```

### API Deployment (Azure Container Apps)

#### Staging Deployment

1. **Trigger staging workflow**
   ```bash
   # Via GitHub Actions UI:
   # Actions → "Stage & Promote Workers" → Run workflow
   ```

2. **Monitor deployment**
   - Check Azure Container Apps dashboard
   - Verify staging slot is updated
   - Check logs for errors

3. **Verify staging**
   ```bash
   curl https://api-staging.magnusflipper.com/health
   ```

#### Production Promotion

1. **Run smoke tests on staging**
   ```bash
   pnpm test:production:api-smoke
   ```

2. **Promote to production**
   ```bash
   # Via GitHub Actions UI:
   # Actions → "Stage & Promote Workers" → Run workflow
   # Input: promote_to_prod = true
   ```

3. **Monitor canary deployment**
   - Check canary dashboard
   - Monitor error rates
   - Verify ML analyzer decisions

4. **Full rollout**
   - If canary successful, promote to 100%
   - If canary fails, rollback automatically

### Worker Deployment (Azure Container Apps)

#### Deploy Workers

1. **Build and push images**
   ```bash
   # Automated via GitHub Actions
   # Workflow: .github/workflows/stage-and-promote.yml
   ```

2. **Update Container Apps**
   - Images tagged with `staging-{run_number}` or `prod-{run_number}`
   - Image digest pinning for reproducibility
   - Zero-downtime deployment

3. **Verify worker health**
   ```bash
   curl https://worker-scraper.magnusflipper.com/health
   curl https://worker-tracker.magnusflipper.com/health
   curl https://worker-autosell.magnusflipper.com/health
   ```

### Mobile App Deployment

#### iOS (App Store)

1. **Build for production**
   ```bash
   cd apps/mobile
   eas build --platform ios --profile production
   ```

2. **Submit to App Store**
   ```bash
   eas submit --platform ios
   ```

3. **Monitor submission**
   - Check App Store Connect
   - Review build status
   - Handle any rejections

#### Android (Google Play)

1. **Build for production**
   ```bash
   cd apps/mobile
   eas build --platform android --profile production
   ```

2. **Submit to Google Play**
   ```bash
   eas submit --platform android
   ```

3. **Monitor submission**
   - Check Google Play Console
   - Review build status
   - Handle any rejections

## Rollback Procedures

### Web App Rollback (Vercel)

```bash
# Via Vercel Dashboard:
# Deployments → Select previous deployment → Promote to Production

# Or via CLI:
vercel rollback
```

### API/Worker Rollback (Azure)

```bash
# Via GitHub Actions:
# Actions → "Stage & Promote Workers" → Run workflow
# Input: rollback_tag = prod-{previous-run-number}

# Or via Azure CLI:
az containerapp update \
  --name worker-scraper \
  --resource-group magnus-rg \
  --image <registry>/worker-scraper:prod-{previous-run-number}
```

### Database Rollback

```bash
# Restore from backup
supabase db restore <backup-file>

# Or rollback migration
supabase migration down
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# Web app
curl https://magnusflipper.com/api/health
curl https://magnusflipper.com/api/health/detailed

# API
curl https://api.magnusflipper.com/health

# Workers
curl https://worker-scraper.magnusflipper.com/health
curl https://worker-tracker.magnusflipper.com/health
curl https://worker-autosell.magnusflipper.com/health
```

### 2. Smoke Tests

```bash
# Run production smoke tests
pnpm test:production:api-smoke
pnpm test:production:worker-integration
```

### 3. Monitoring

- Check Azure Monitor dashboards
- Review error rates
- Verify alert rules are firing correctly
- Check log aggregation

### 4. User-Facing Verification

- [ ] Homepage loads correctly
- [ ] Dashboard accessible
- [ ] Authentication works
- [ ] Core features functional
- [ ] No console errors

## Troubleshooting

### Deployment Failures

1. **Check GitHub Actions logs**
   - Identify failing step
   - Review error messages
   - Check environment variables

2. **Check Azure Container Apps logs**
   ```bash
   az containerapp logs show \
     --name worker-scraper \
     --resource-group magnus-rg \
     --follow
   ```

3. **Check Vercel deployment logs**
   - Vercel Dashboard → Deployments → View logs

### Health Check Failures

1. **Database connectivity issues**
   - Verify Supabase credentials
   - Check network connectivity
   - Review firewall rules

2. **Service unavailable**
   - Check Container App status
   - Verify resource limits
   - Review scaling configuration

### Performance Issues

1. **Slow response times**
   - Check database query performance
   - Review API response times
   - Check worker execution times

2. **High error rates**
   - Review error logs
   - Check alert notifications
   - Investigate root cause

## Emergency Procedures

### Immediate Rollback

```bash
# Rollback to previous known-good version
# Via GitHub Actions or Azure CLI (see Rollback Procedures above)
```

### Service Degradation

1. **Identify affected service**
   - Check health endpoints
   - Review monitoring dashboards
   - Check alert notifications

2. **Scale resources**
   ```bash
   az containerapp update \
     --name worker-scraper \
     --resource-group magnus-rg \
     --min-replicas 2 \
     --max-replicas 10
   ```

3. **Enable maintenance mode** (if needed)
   - Update environment variables
   - Redeploy with maintenance flag

## Communication

### Stakeholder Notifications

- **Deployment start**: Notify team via Slack/Teams
- **Deployment complete**: Confirm success
- **Issues detected**: Alert immediately
- **Rollback**: Notify of rollback and reason

### Incident Response

- Follow incident response runbook
- Document all actions taken
- Post-mortem for significant issues

## References

- [Health Checks Runbook](./health-checks.md)
- [Incident Response Runbook](./incident-response.md)
- [SLO/SLA Runbook](./slo-sla.md)
- [Diagnostics Runbook](./diagnostics.md)
