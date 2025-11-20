# Magnus Flipper AI - Deployment Runbook

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Migration](#database-migration)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedure](#rollback-procedure)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Incident Response](#incident-response)

---

## Pre-Deployment Checklist

**Before deploying to production, ensure:**

- [ ] All tests pass (`pnpm test`)
- [ ] Smoke tests pass locally (`pnpm test:smoke`)
- [ ] Environment variables configured (see `.env.example`)
- [ ] Database migrations reviewed and tested
- [ ] Supabase project provisioned
- [ ] Redis instance available (for rate limiting)
- [ ] Sentry project configured (optional)
- [ ] GitHub Container Registry credentials set up
- [ ] Deployment target (Leap/Vercel) configured

---

## Environment Setup

### Required Environment Variables

**Production API (.env):**
```bash
# Application
NODE_ENV=production
PORT=4000
LOG_LEVEL=info

# Database (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=sbp_xxxxxxxxxxxxx
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Rate Limiting (RECOMMENDED)
REDIS_URL=redis://your-redis-host:6379
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring (OPTIONAL)
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ENV=production
```

### Validate Configuration

```bash
# Test locally first
cp .env.example .env
# Edit .env with your values
pnpm dev

# Check health endpoints
curl http://localhost:4000/health
curl http://localhost:4000/health/readiness
curl http://localhost:4000/metrics
```

---

## Database Migration

### 1. Apply Base Schema

```bash
# Connect to Supabase SQL editor or use psql
psql -h db.your-project.supabase.co \
     -U postgres \
     -d postgres \
     -f db/schema.sql
```

### 2. Apply Migrations

```bash
psql -h db.your-project.supabase.co \
     -U postgres \
     -d postgres \
     -f db/migrations/001_add_deals_alerts_watchlists.sql
```

### 3. Verify Tables Created

```sql
-- In Supabase SQL editor
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Expected tables:
-- profiles, flips, wins, deals, alerts, watchlists
```

### 4. Seed Sample Data (Optional)

```bash
cd api
pnpm seed --count=100
```

---

## Deployment Steps

### Option A: Deploy to Leap (Backend API)

#### 1. Build Docker Image

```bash
cd api
docker build -t ghcr.io/your-org/magnus-api:latest .
docker build -t ghcr.io/your-org/magnus-api:$(git rev-parse --short HEAD) .
```

#### 2. Push to GitHub Container Registry

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
docker push ghcr.io/your-org/magnus-api:latest
docker push ghcr.io/your-org/magnus-api:$(git rev-parse --short HEAD)
```

#### 3. Deploy via Leap Script

```bash
cd ../infra/scripts
./leap_deploy.sh
```

#### 4. Set Environment Variables on Leap

```bash
# Via Leap dashboard or CLI
leap env set SUPABASE_URL="https://..."
leap env set SUPABASE_SERVICE_ROLE="sbp_..."
leap env set REDIS_URL="redis://..."
leap env set NODE_ENV="production"
```

---

### Option B: Deploy to Vercel (Frontend + API)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Deploy Web Frontend

```bash
cd web
vercel --prod
```

#### 3. Set Environment Variables

Via Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`

---

### Option C: Docker Compose (Self-Hosted)

#### 1. Configure Production Compose

Edit `infra/docker-compose.prod.yml` with your environment variables.

#### 2. Deploy Stack

```bash
docker compose -f infra/docker-compose.prod.yml up -d
```

#### 3. Verify Services

```bash
docker compose -f infra/docker-compose.prod.yml ps
docker compose -f infra/docker-compose.prod.yml logs api
```

---

## Post-Deployment Verification

### 1. Run Smoke Tests

```bash
API_URL=https://your-production-api.com pnpm test:smoke
```

### 2. Manual Health Checks

```bash
# Basic health
curl https://your-api.com/health

# Readiness (includes DB check)
curl https://your-api.com/health/readiness

# Detailed status
curl https://your-api.com/health/status

# Metrics
curl https://your-api.com/metrics
```

### 3. Test Critical Endpoints

```bash
# Get deals
curl https://your-api.com/api/deals

# Test rate limiting
for i in {1..105}; do curl -s https://your-api.com/api/deals > /dev/null && echo "Request $i: OK" || echo "Request $i: FAILED"; done

# Test authentication
curl -X POST https://your-api.com/api/alerts \
  -H "Content-Type: application/json" \
  -d '{"deal_id":"test","channel":"email"}'
# Should return 401 Unauthorized
```

### 4. Check Logs

```bash
# Docker
docker logs magnus-api --tail=100 -f

# Leap
leap logs api --tail=100 -f

# Vercel
vercel logs
```

### 5. Verify Metrics in Grafana

1. Open Grafana dashboard: `http://your-grafana:3001`
2. Check "Magnus Flipper Ops v3" dashboard
3. Verify metrics are populating:
   - Request rate
   - Error rate (should be < 1%)
   - P95 latency (should be < 200ms)
   - Active connections

---

## Rollback Procedure

### If Deployment Fails

#### Quick Rollback (Docker)

```bash
# Rollback to previous image
docker pull ghcr.io/your-org/magnus-api:previous-sha
docker stop magnus-api
docker run -d --name magnus-api \
  --env-file .env \
  -p 4000:4000 \
  ghcr.io/your-org/magnus-api:previous-sha
```

#### Leap Rollback

```bash
leap deploy rollback api
```

#### Vercel Rollback

Via Vercel dashboard:
1. Go to Deployments
2. Find previous working deployment
3. Click "Promote to Production"

---

### If Database Migration Fails

```bash
# Connect to Supabase
psql -h db.your-project.supabase.co -U postgres

# Check current state
\dt

# Rollback migration (if needed)
-- Create rollback script for each migration
-- Example: DROP TABLE IF EXISTS deals;
```

**⚠️ WARNING:** Always backup database before migrations!

---

## Monitoring & Alerts

### Prometheus Scrape Config

Already configured in `infra/prometheus/prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'magnus-api'
    scrape_interval: 5s
    static_configs:
      - targets: ['api:4000']
```

### Grafana Alerts

Configure in `infra/grafana/provisioning/alerting/rules.yml`:

```yaml
groups:
  - name: magnus-api-alerts
    interval: 1m
    rules:
      - alert: HighErrorRate
        expr: rate(http_errors_total[5m]) > 0.05
        for: 2m
        annotations:
          summary: "High error rate detected"

      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 0.5
        for: 5m
        annotations:
          summary: "P95 latency above 500ms"

      - alert: APIDown
        expr: up{job="magnus-api"} == 0
        for: 1m
        annotations:
          summary: "API is down"
```

### Log Aggregation (Optional)

**With Loki:**

```bash
# Add to docker-compose.prod.yml
loki:
  image: grafana/loki:latest
  ports:
    - "3100:3100"
```

**Configure API to send logs:**

```bash
# Install pino-loki
pnpm add pino-loki

# Add to logger.ts
transport: {
  target: 'pino-loki',
  options: {
    host: 'http://loki:3100'
  }
}
```

---

## Incident Response

### Critical Issues

#### API Returns 500 Errors

1. **Check logs:**
   ```bash
   docker logs magnus-api --tail=500 | grep -i error
   ```

2. **Check database connectivity:**
   ```bash
   curl https://your-api.com/health/readiness
   ```

3. **Common causes:**
   - Database connection failed → Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE`
   - Redis connection failed → Verify `REDIS_URL`
   - Out of memory → Increase container resources

#### API Not Responding

1. **Check service health:**
   ```bash
   curl https://your-api.com/health
   ```

2. **Check container status:**
   ```bash
   docker ps | grep magnus-api
   docker inspect magnus-api
   ```

3. **Restart service:**
   ```bash
   docker restart magnus-api
   # or
   leap restart api
   ```

#### High Latency

1. **Check Grafana dashboard** for P95 latency spike
2. **Check database performance:**
   - Supabase dashboard → Performance tab
   - Look for slow queries
3. **Check active connections:**
   ```bash
   curl https://your-api.com/metrics | grep active_connections
   ```
4. **Scale horizontally** if needed

#### Rate Limit Issues

1. **Check Redis connection:**
   ```bash
   redis-cli -h your-redis-host ping
   ```

2. **Adjust limits** if legitimate traffic:
   ```bash
   # Update environment variables
   RATE_LIMIT_MAX_REQUESTS=200
   ```

3. **Investigate if attack:**
   - Check logs for repeated IPs
   - Consider adding IP blocklist

---

## Maintenance Windows

### Planned Downtime

1. **Announce in advance** (Discord, status page)
2. **Schedule during low-traffic hours**
3. **Enable maintenance mode:**
   ```bash
   # Add to nginx/load balancer
   return 503 "Scheduled maintenance in progress";
   ```

### Database Backups

**Supabase handles automated backups**, but you can also:

```bash
# Manual backup
pg_dump -h db.your-project.supabase.co \
        -U postgres \
        -F c \
        -f backup_$(date +%Y%m%d).dump \
        postgres
```

---

## Deployment Checklist

**Pre-Deploy:**
- [ ] Tests pass
- [ ] Changelog updated
- [ ] Database migrations reviewed
- [ ] Environment variables verified
- [ ] Rollback plan ready

**Deploy:**
- [ ] Build & push Docker image
- [ ] Apply database migrations
- [ ] Deploy to production
- [ ] Set environment variables

**Post-Deploy:**
- [ ] Smoke tests pass
- [ ] Health checks green
- [ ] Metrics showing in Grafana
- [ ] Error rate < 1%
- [ ] Latency < 200ms
- [ ] Logs streaming correctly

**Cleanup:**
- [ ] Update documentation
- [ ] Notify team of deployment
- [ ] Monitor for 24 hours
- [ ] Remove old Docker images

---

## Support Contacts

- **Infrastructure:** [Your DevOps Team]
- **Database:** Supabase Support
- **Monitoring:** Grafana/Prometheus docs
- **On-Call:** [Your On-Call Schedule]

---

## Useful Commands

```bash
# Quick health check
curl -s https://your-api.com/health/status | jq

# Watch logs in real-time
docker logs -f magnus-api

# Check resource usage
docker stats magnus-api

# Force pull latest image
docker pull ghcr.io/your-org/magnus-api:latest

# Restart with zero downtime (behind load balancer)
docker-compose up -d --no-deps --build api

# Backup database
pnpm seed --clear  # Clear test data first
pg_dump ... # Backup production

# Test rate limiting
ab -n 1000 -c 10 https://your-api.com/api/deals
```

---

**Last Updated:** 2025-11-08
**Version:** 1.0.0
**Maintainer:** Magnus Flipper Team
