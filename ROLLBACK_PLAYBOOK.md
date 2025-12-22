# Rollback Playbook - Quick Reference

**Emergency Contact:** [Your on-call engineer]
**Last Updated:** 2025-12-22

---

## 🚨 Emergency: Rollback Immediately

**When to use this:** Production is broken, users are affected, need instant rollback.

### Option 1: Kill Switch (Fastest - 1 minute)

```bash
# Stop all scraping globally
psql $DATABASE_URL -c "UPDATE admin_controls SET disable_all_scraping = true;"

# OR use admin UI:
# 1. Go to https://app.example.com/dashboard
# 2. Toggle "Disable All Scraping" → ON
# 3. Wait 1-5 min for workers to read flag
```

**Use when:** Workers are causing issues (errors, rate limits, crashes)
**Recovery Time:** 1-5 minutes (eventual consistency)

---

### Option 2: Vercel Rollback (Fast - 2 minutes)

```bash
# Via CLI
vercel rollback --yes

# OR via Dashboard:
# 1. Go to https://vercel.com/<your-project>/deployments
# 2. Find last known-good deployment (before your deploy)
# 3. Click "..." → "Promote to Production"
```

**Use when:** Web UI is broken (5xx errors, blank pages)
**Recovery Time:** 1-5 minutes

---

### Option 3: Container Rollback (Slower - 10 minutes)

```bash
# Identify previous stable image
docker images | grep worker-scheduler

# Redeploy previous tag
# (specific steps depend on your deployment tool: Kubernetes, Azure Container Apps, etc.)

# Generic example:
kubectl set image deployment/worker-scheduler worker-scheduler=registry.example.com/worker-scheduler:v1.2.3
```

**Use when:** Worker containers are broken (crashes, errors)
**Recovery Time:** 5-10 minutes

---

## 🔥 Common Scenarios

### Scenario 1: "Website is down" (5xx errors)

**Symptoms:** Users see "500 Internal Server Error"

**Steps:**
1. Check Vercel logs for exceptions
2. Rollback web deployment (Option 2 above)
3. Verify site loads: `curl https://app.example.com/`
4. Investigate root cause in logs

**Expected Recovery:** 2-5 minutes

---

### Scenario 2: "No new deals"

**Symptoms:** Deals stopped updating 10+ minutes ago

**Steps:**
1. Check worker health:
   ```sql
   SELECT * FROM worker_heartbeat ORDER BY last_heartbeat DESC;
   ```
2. If heartbeat is stale (>5 min), check kill switch:
   ```sql
   SELECT disable_all_scraping FROM admin_controls;
   ```
3. If kill switch is ON, toggle OFF via admin panel
4. If kill switch is OFF, redeploy worker-scheduler (Option 3 above)

**Expected Recovery:** 5-10 minutes

---

### Scenario 3: "Rate limit errors everywhere"

**Symptoms:** Logs show "429 Too Many Requests", error rate >5%

**Steps:**
1. Slow down scraping:
   ```sql
   UPDATE admin_controls SET global_rate_multiplier = 0.5;
   ```
2. Wait 5 min for workers to throttle
3. If still seeing 429s, disable affected marketplace:
   ```sql
   UPDATE admin_controls SET disable_marketplace_facebook = true;
   ```
4. Investigate why rate limits changed (marketplace API changes?)

**Expected Recovery:** 5-10 minutes

---

### Scenario 4: "Database is locked"

**Symptoms:** Queries timing out, migration stuck

**Steps:**
1. Find blocking queries:
   ```sql
   SELECT * FROM pg_stat_activity WHERE state = 'active';
   ```
2. Kill migration if stuck:
   ```sql
   SELECT pg_terminate_backend(<pid>) WHERE query LIKE '%migration%';
   ```
3. Rollback migration:
   ```bash
   npx prisma migrate resolve --rolled-back <migration-name>
   ```
4. If data is corrupted, restore from Supabase backup (see below)

**Expected Recovery:** 10-30 minutes

---

### Scenario 5: "Alerts not sending"

**Symptoms:** Users report not receiving deal alerts

**Steps:**
1. Check worker-alerts health:
   ```sql
   SELECT * FROM worker_heartbeat WHERE worker_id LIKE '%alerts%';
   ```
2. If worker is down, redeploy worker-alerts container (Option 3 above)
3. If worker is healthy, check alert queue:
   ```sql
   SELECT * FROM alert_notifications WHERE status = 'PENDING' LIMIT 10;
   ```
4. If queue is backed up, check email/SMS provider status (Mailgun, Twilio)

**Expected Recovery:** 5-15 minutes

---

## 🛠️ Kill Switch Reference

**Access:** https://app.example.com/dashboard → Admin Controls Panel

| Switch | Effect | Propagation Time | When to Use |
|--------|--------|------------------|-------------|
| **Disable All Scraping** | Stops all workers globally | 1-5 min | Emergency: workers causing outage |
| **Disable Marketplace: Facebook** | Stops Facebook scraping only | 1-5 min | Facebook API issues, rate limits |
| **Disable Marketplace: Cars** | Stops Cars.com scraping only | 1-5 min | Cars.com API issues |
| **Rate Multiplier: 0.5** | Slows scraping to 50% speed | 1-5 min | Rate limits, throttle without stopping |
| **Rate Multiplier: 0** | Effectively stops scraping | 1-5 min | Alternative to global disable |

**Never-Disappear Contract:** All switches disable BEHAVIOR, not UI visibility. Users see disabled states, not blank pages.

---

## 📊 Health Check URLs

| Component | URL | Expected Response |
|-----------|-----|-------------------|
| Web App | `https://app.example.com/api/health` | `{ "status": "ok" }` |
| Worker Scheduler | Check `worker_heartbeat` table | `last_heartbeat` < 5 min ago |
| Worker Realtime | Check `worker_heartbeat` table | `last_heartbeat` < 5 min ago |
| Worker Scraper | Azure Functions: `/api/scraper/health` | `{ "status": "ok" }` |

---

## 🔍 Debugging Commands

### Check Worker Health

```sql
-- All workers
SELECT worker_id, last_heartbeat,
       EXTRACT(EPOCH FROM (NOW() - last_heartbeat::timestamp)) AS seconds_ago
FROM worker_heartbeat
ORDER BY last_heartbeat DESC;

-- Stale workers (>5 min)
SELECT worker_id, last_heartbeat
FROM worker_heartbeat
WHERE last_heartbeat < NOW() - INTERVAL '5 minutes';
```

### Check Scraping Activity

```sql
-- Recent deals (last 10 min)
SELECT marketplace, COUNT(*) AS deal_count, MAX(first_seen_at) AS latest_deal
FROM scraped_listings
WHERE first_seen_at > NOW() - INTERVAL '10 minutes'
GROUP BY marketplace;

-- Error rate by marketplace
SELECT marketplace,
       COUNT(*) FILTER (WHERE error IS NOT NULL) AS errors,
       COUNT(*) AS total,
       ROUND(100.0 * COUNT(*) FILTER (WHERE error IS NOT NULL) / COUNT(*), 2) AS error_rate
FROM scraper_runs
WHERE started_at > NOW() - INTERVAL '1 hour'
GROUP BY marketplace;
```

### Check Queue Status (if using BullMQ)

```bash
# Redis CLI
redis-cli

# Check queue length
LLEN bull:scraping:wait

# Check failed jobs
LLEN bull:scraping:failed

# Peek at failed job
LINDEX bull:scraping:failed 0
```

---

## 📁 Backup & Restore

### Supabase Backup Restore

**When:** Database corruption, migration rollback needed

**Steps:**
1. Go to Supabase dashboard
2. Navigate to Database → Backups
3. Find backup from before incident
4. Click "Restore" (this will overwrite current database)
5. Wait 10-30 min depending on database size
6. Verify data integrity after restore

**WARNING:** This will lose all data written AFTER the backup timestamp.

---

### Vercel Deployment Logs

**When:** Need to debug 5xx errors, find exception stack trace

**Access:**
1. Go to https://vercel.com/<your-project>/deployments
2. Click on current deployment
3. Navigate to "Logs" tab
4. Filter by "Errors" or search for specific error message

**Alternative (CLI):**
```bash
vercel logs <deployment-url> --follow
```

---

## 🚦 Escalation Path

1. **First 5 minutes:** Attempt rollback using playbook
2. **After 5 minutes:** If rollback doesn't work, escalate to senior engineer
3. **After 15 minutes:** If still broken, notify users via status page
4. **After 30 minutes:** Consider full rollback (all components) to last known-good state

**Status Page:** [Your status page URL]
**Incident Template:** "We're experiencing issues with [component]. Team is investigating. ETA: [time]"

---

## ✅ Post-Rollback Checklist

After successfully rolling back:

- [ ] Verify all health checks green
- [ ] Verify users can access app
- [ ] Verify new deals are appearing (if scraping was affected)
- [ ] Check error rate <1% for 10 minutes
- [ ] Document what broke and why
- [ ] Create post-mortem issue in GitHub
- [ ] Fix root cause in development
- [ ] Test fix in staging
- [ ] Deploy fix (with extra caution)

---

## 📞 Emergency Contacts

**On-Call Engineer:** [Phone number]
**DevOps Lead:** [Phone number]
**CTO:** [Phone number]
**Status Page:** [URL]
**Incident Slack Channel:** #incidents

---

**Remember:** Rollback first, debug second. Users are waiting.
