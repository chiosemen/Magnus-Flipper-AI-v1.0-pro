# Restart and Recovery Runbook

## Overview

This document provides step-by-step procedures for restarting services, recovering from failures, and restoring system functionality.

## Pre-Restart Health Check

Before restarting any service, perform a health check:

```bash
# Check current system health
curl https://magnusflipper.com/api/health

# Or use the pre-restart health check utility
# (if implemented in your environment)
```

**Checklist**:
- [ ] Review current health status
- [ ] Check for critical alerts
- [ ] Verify worker status
- [ ] Review recent errors
- [ ] Document current state

See [Health Checks](./health-checks.md) for detailed procedures.

## Web Application Restart (Vercel)

### Redeploy on Vercel

#### Via Vercel Dashboard

1. **Navigate to Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Select your project

2. **Redeploy Latest**
   - Click on the latest deployment
   - Click "Redeploy" button
   - Confirm redeployment

3. **Monitor Deployment**
   - Watch deployment logs
   - Verify build succeeds
   - Check for deployment errors

4. **Verify Health**
   ```bash
   curl https://magnusflipper.com/api/health
   ```

#### Via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link to project (if not already linked)
cd apps/web
vercel link

# Deploy to production
vercel --prod

# Or redeploy specific deployment
vercel redeploy <deployment-url>
```

### Rollback to Previous Deployment

1. **Identify Previous Deployment**
   - Go to Vercel dashboard
   - View deployment history
   - Find last known good deployment

2. **Promote to Production**
   - Click on the deployment
   - Click "Promote to Production"
   - Confirm promotion

3. **Verify Rollback**
   ```bash
   curl https://magnusflipper.com/api/health
   ```

### Environment Variable Updates

**Important**: Environment variable changes require redeployment.

1. **Update in Vercel Dashboard**
   - Go to Project Settings → Environment Variables
   - Add/update variables
   - Select environments (Production, Preview, Development)

2. **Redeploy**
   - Environment variables take effect on next deployment
   - Trigger redeploy or wait for next deployment

3. **Verify Changes**
   - Check application logs
   - Verify new values are used
   - Test affected functionality

## Worker Restart

### Worker Process Restart

**Note**: Worker processes run separately from the web application.

1. **Identify Worker Process**
   - Check worker deployment location
   - Verify worker process manager (PM2, systemd, etc.)

2. **Stop Worker**
   ```bash
   # If using PM2
   pm2 stop magnus-worker
   
   # If using systemd
   sudo systemctl stop magnus-worker
   
   # If using Docker
   docker stop magnus-worker
   ```

3. **Start Worker**
   ```bash
   # If using PM2
   pm2 start magnus-worker
   
   # If using systemd
   sudo systemctl start magnus-worker
   
   # If using Docker
   docker start magnus-worker
   ```

4. **Verify Worker Health**
   ```sql
   -- Check worker heartbeat
   SELECT * FROM worker_heartbeat 
   ORDER BY last_heartbeat DESC 
   LIMIT 10;
   ```

### Worker Configuration Reset

If worker configuration needs updating:

1. **Update Environment Variables**
   - Update worker environment variables
   - Ensure database connection strings are correct
   - Verify API keys are valid

2. **Restart Worker**
   - Follow restart procedure above

3. **Clear Stuck Jobs** (if needed)
   ```sql
   -- Reset stuck jobs
   UPDATE job_queue 
   SET status = 'pending' 
   WHERE status = 'active' 
     AND started_at < NOW() - INTERVAL '1 hour';
   ```

## Supabase Key Reset

### Service Role Key Reset

**Warning**: Resetting the service role key will break all existing connections using the old key.

1. **Generate New Key**
   - Go to Supabase Dashboard
   - Navigate to: Project Settings → API
   - Click "Reset" next to service_role key
   - Copy new key immediately

2. **Update Environment Variables**
   - Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel
   - Update worker environment variables
   - Update any other services using the key

3. **Redeploy Services**
   - Redeploy web application on Vercel
   - Restart worker processes
   - Verify all services reconnect

4. **Verify Connection**
   ```bash
   curl https://magnusflipper.com/api/health
   # Should show supabase: "ok"
   ```

### Anon Key Reset

1. **Generate New Key**
   - Go to Supabase Dashboard
   - Navigate to: Project Settings → API
   - Click "Reset" next to anon/public key
   - Copy new key

2. **Update Environment Variables**
   - Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
   - Update mobile app EAS secrets
   - Update any client-side configurations

3. **Redeploy**
   - Redeploy web application
   - Rebuild mobile app (if needed)
   - Clear client-side caches

## Stripe Webhook Secret Reset

### Reset Webhook Secret

1. **Create New Webhook Endpoint** (if needed)
   - Go to Stripe Dashboard
   - Navigate to: Developers → Webhooks
   - Create new endpoint or edit existing
   - Set URL: `https://magnusflipper.com/api/stripe/webhook`

2. **Get New Signing Secret**
   - Click on webhook endpoint
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_`)

3. **Update Environment Variable**
   - Update `STRIPE_WEBHOOK_SECRET` in Vercel
   - Update in worker environment (if workers handle webhooks)

4. **Redeploy**
   - Redeploy web application
   - Restart workers (if applicable)

5. **Test Webhook**
   - Use Stripe CLI to send test event:
   ```bash
   stripe listen --forward-to https://magnusflipper.com/api/stripe/webhook
   stripe trigger payment_intent.succeeded
   ```

### Verify Webhook Delivery

1. **Check Stripe Dashboard**
   - Go to: Developers → Webhooks
   - Click on webhook endpoint
   - Review "Recent deliveries"
   - Check for failed deliveries

2. **Check Application Logs**
   - Review webhook handler logs
   - Look for signature verification errors
   - Check for processing errors

## Cache Invalidation

### Vercel Cache Invalidation

Vercel automatically caches static assets and API responses.

**Manual Cache Purge**:

1. **Via Vercel Dashboard**
   - Go to project settings
   - Navigate to "Cache" section
   - Click "Purge Cache"
   - Select cache type (Edge, Browser, etc.)

2. **Via Vercel CLI**
   ```bash
   vercel cache purge
   ```

3. **Programmatic Purge** (if implemented)
   ```typescript
   import { purgeCache } from '@/lib/ops/runbook';
   
   await purgeCache(['*']); // Purge all
   ```

### API Response Cache

API responses use cache headers. To force refresh:

1. **Add Cache-Busting Header**
   ```bash
   curl -H "Cache-Control: no-cache" \
     https://magnusflipper.com/api/admin/jobs
   ```

2. **Update Cache Headers** (if needed)
   - Modify cache headers in API routes
   - Redeploy application

### Browser Cache

Users may need to clear browser cache:
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Clear cache in browser settings

## Database Recovery

### Connection Pool Reset

If experiencing connection pool exhaustion:

1. **Check Active Connections**
   ```sql
   SELECT count(*) 
   FROM pg_stat_activity 
   WHERE datname = 'postgres';
   ```

2. **Kill Idle Connections** (if needed)
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE datname = 'postgres'
     AND state = 'idle'
     AND state_change < NOW() - INTERVAL '5 minutes';
   ```

3. **Restart Application**
   - Restart web application
   - Restart workers
   - Connections will be re-established

### Database Backup Restore

1. **Access Supabase Dashboard**
   - Go to: Project Settings → Database
   - Navigate to "Backups" section

2. **Select Backup**
   - Choose backup point
   - Verify backup timestamp

3. **Restore Backup**
   - Click "Restore" button
   - Confirm restoration
   - Wait for restore to complete

4. **Verify Data**
   - Check critical tables
   - Verify data integrity
   - Test application functionality

## Recovery Procedures by Issue Type

### Complete Service Outage

1. **Check Vercel Status**: https://vercel.com/status
2. **Check Supabase Status**: https://status.supabase.com
3. **Check Recent Deployments**: Review Vercel deployment history
4. **Rollback if Needed**: Promote previous deployment
5. **Verify Health**: Check health endpoint after rollback

### Partial Service Degradation

1. **Identify Affected Routes**: Check telemetry endpoint
2. **Review Error Logs**: Identify error patterns
3. **Check Dependencies**: Verify Supabase and Stripe connectivity
4. **Scale Resources**: If resource-constrained
5. **Disable Non-Critical Features**: Temporary mitigation

### Worker Failures

1. **Check Worker Heartbeat**: Query database
2. **Review Worker Logs**: Identify crash cause
3. **Restart Workers**: Follow restart procedure
4. **Clear Stuck Jobs**: Reset failed jobs
5. **Monitor Recovery**: Verify jobs processing

### Payment Processing Issues

1. **Check Stripe Dashboard**: Review webhook deliveries
2. **Verify Webhook Secret**: Ensure matches configuration
3. **Test Webhook Endpoint**: Use Stripe CLI
4. **Manual Subscription Updates**: If webhooks failing
5. **Monitor Recovery**: Verify new payments processing

## Recovery Verification Checklist

After any recovery procedure:

- [ ] Health endpoint returns `status: "ok"`
- [ ] All dependencies show "ok" status
- [ ] Workers are online and processing jobs
- [ ] API endpoints responding normally
- [ ] Error rates within acceptable range
- [ ] Payment processing working
- [ ] No critical alerts active
- [ ] System telemetry shows healthy metrics

## Emergency Contacts

If recovery procedures fail:

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Stripe Support**: https://support.stripe.com

## Related Documents

- [Health Checks](./health-checks.md) - Verify system health
- [Incident Response](./incident-response.md) - Incident handling
- [Diagnostics](./diagnostics.md) - Diagnostic procedures

