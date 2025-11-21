# 🔥 Render Dashboard - Environment Variables Templates

**Copy/paste these directly into Render → Services → [Service Name] → Environment → Bulk Edit**

**Last Updated**: November 20, 2025

---

## 📋 Quick Instructions

1. Go to Render Dashboard: https://dashboard.render.com
2. Select your service
3. Click **Environment** tab
4. Click **Bulk Edit** button
5. Copy/paste the template below
6. Replace all `<placeholder>` values with your actual credentials
7. Click **Save Changes**

---

## 🌐 Web Service — Quick Paste

```bash
NEXT_PUBLIC_API_URL=https://api.magnusflipper.com
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Paste into **Web Service → Environment → Bulk Edit**, then replace the Supabase placeholders.

---

## 🛠️ Worker Services — Quick Paste

```bash
REDIS_URL=redis://your-render-redis:6379
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_ROLE=YOUR_SERVICE_ROLE_KEY
```

Use for crawler/analyzer/alerts workers in **Environment → Bulk Edit**, swapping in your values.

---

## 🌐 A) API Service — `magnus-flipper-api`

**Service Type**: Web Service
**Region**: Oregon (recommended)
**Plan**: Starter or higher

### Environment Variables

```bash
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_API_URL=https://api.magnusflipper.com
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_ROLE=YOUR_SERVICE_ROLE_KEY
REDIS_URL=redis://your-render-redis:6379
TELEGRAM_BOT_TOKEN=your-bot-token
MAGNUS_API_KEY=any-random-uuid
```

### Notes
- Replace `<your-project-id>` with your Supabase project ID
- Get Supabase keys from: https://app.supabase.com → Project Settings → API
- Create Telegram bot: https://t.me/BotFather
- Generate MAGNUS_API_KEY: `openssl rand -hex 32`

---

## 🕐 B) Scheduler Worker — `magnus-flipper-scheduler`

**Service Type**: Background Worker
**Region**: Oregon (same as API)
**Plan**: Starter

### Environment Variables

```bash
NODE_ENV=production

# Redis Queue
REDIS_URL=redis://default:<password>@<host>:<port>

# Internal API
MAGNUS_API_KEY=<same-as-api-service>

# Supabase
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Scheduler Settings
SCHEDULER_INTERVAL=300000
# 300000ms = 5 minutes between scan cycles

# Optional: Logging
LOG_LEVEL=info
```

### Notes
- Use the **same REDIS_URL** as API service
- Use the **same MAGNUS_API_KEY** as API service
- SCHEDULER_INTERVAL in milliseconds (300000 = 5 min)

---

## 🕷️ C) Crawler Worker — `magnus-flipper-worker-crawler`

**Service Type**: Background Worker
**Region**: Oregon
**Plan**: Starter (or Standard for more memory)

### Environment Variables

```bash
NODE_ENV=production

# Redis Queue
REDIS_URL=redis://default:<password>@<host>:<port>

# Supabase
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Playwright Chromium Path (Render uses system Chromium)
CHROMIUM_PATH=/usr/bin/chromium-browser

# Worker Performance
WORKER_CONCURRENCY=3
# Number of jobs to process simultaneously (3-5 recommended)

# Optional: Marketplace Proxies
# FB_MARKETPLACE_PROXY_URL=http://proxy-server:8080
# VINTED_API_KEY=<vinted-key>

# Optional: Performance Tuning
REQUEST_TIMEOUT=30000
MAX_RETRIES=3

# Optional: Logging
LOG_LEVEL=info
```

### Notes
- **CHROMIUM_PATH**: Required for Render's Playwright installation (uses system Chromium)
- Increase WORKER_CONCURRENCY to 5 for faster crawling (uses more memory)
- Add proxies if hitting rate limits
- Standard plan recommended for production (more memory for browser)
- The `npx playwright install --with-deps chromium` in render.yaml handles browser installation

---

## 🧮 D) Analyzer Worker — `magnus-flipper-worker-analyzer`

**Service Type**: Background Worker
**Region**: Oregon
**Plan**: Starter

### Environment Variables

```bash
NODE_ENV=production

# Redis Queue
REDIS_URL=redis://default:<password>@<host>:<port>

# Supabase
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Internal API Key (if analyzer calls API)
MAGNUS_API_KEY=<same-as-api-service>

# Worker Performance
WORKER_CONCURRENCY=5
# Analyzer can handle more concurrent jobs than crawler

# Optional: Logging
LOG_LEVEL=info
```

### Notes
- Use the **same MAGNUS_API_KEY** as API service
- Higher concurrency than crawler (no browser overhead)

---

## 📣 E) Alerts Worker — `magnus-flipper-worker-alerts`

**Service Type**: Background Worker
**Region**: Oregon
**Plan**: Starter

### Environment Variables

```bash
NODE_ENV=production

# Redis Queue
REDIS_URL=redis://default:<password>@<host>:<port>

# Supabase
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Telegram Bot
TELEGRAM_BOT_TOKEN=<your-telegram-bot-token>

# Internal API Key
MAGNUS_API_KEY=<same-as-api-service>

# Optional: Email Alerts (if using)
# SENDGRID_API_KEY=<your-sendgrid-key>
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USER=apikey
# SMTP_PASS=<your-sendgrid-key>

# Optional: SMS Alerts (if using)
# TWILIO_ACCOUNT_SID=<your-twilio-sid>
# TWILIO_AUTH_TOKEN=<your-twilio-token>
# TWILIO_PHONE_NUMBER=+1234567890

# Optional: Logging
LOG_LEVEL=info
```

---

## 🤖 F) Telegram Bot — `magnus-flipper-bot-telegram`

**Service Type**: Background Worker
**Region**: Oregon
**Plan**: Starter

### Environment Variables

```bash
NODE_ENV=production

# Telegram Bot
TELEGRAM_BOT_TOKEN=<your-telegram-bot-token>

# Magnus API
MAGNUS_API_URL=https://magnus-flipper-api.onrender.com
MAGNUS_API_KEY=<same-as-api-service>

# Redis (for state management)
REDIS_URL=redis://default:<password>@<host>:<port>

# Optional: Logging
LOG_LEVEL=info
```

### Notes
- MAGNUS_API_URL should point to your deployed API service
- Use the **same MAGNUS_API_KEY** as API service

---

## 🔐 How to Get Your Credentials

### Supabase

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use as `SUPABASE_URL`
   - **anon public** key → Use as `SUPABASE_ANON_KEY`
   - **service_role** key → Use as `SUPABASE_SERVICE_ROLE_KEY`

### Redis (Render Redis)

1. In Render Dashboard, create a **Redis** service
2. After creation, go to **Info** tab
3. Copy **Internal Redis URL** → Use as `REDIS_URL`
4. Format: `redis://default:<password>@<host>:<port>`

### Redis (Upstash Alternative)

1. Go to https://upstash.com
2. Create a Redis database
3. Copy **TLS Connection String** → Use as `REDIS_URL`
4. Format: `rediss://default:<password>@<host>:<port>` (note the double 's')

### Telegram Bot Token

1. Open Telegram and find [@BotFather](https://t.me/BotFather)
2. Send `/newbot`
3. Follow prompts to create bot
4. Copy the token provided → Use as `TELEGRAM_BOT_TOKEN`
5. Format: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### Magnus API Key (Internal)

Generate a secure random key:

```bash
# On Mac/Linux
openssl rand -hex 32

# Output example:
# 8f7d6e5c4b3a2918f7d6e5c4b3a2918f7d6e5c4b3a2918f7d6e5c4b3a2918
```

Use the output as `MAGNUS_API_KEY` (same value across all services)

---

## 📊 Service-by-Service Checklist

### After Setting Environment Variables

- [ ] **API Service**
  - [ ] Environment variables set
  - [ ] Build successful
  - [ ] Service status: Live
  - [ ] Health check: `curl https://magnus-flipper-api.onrender.com/health`

- [ ] **Scheduler Worker**
  - [ ] Environment variables set
  - [ ] Build successful
  - [ ] Service status: Live
  - [ ] Check logs for "Scheduler started"

- [ ] **Crawler Worker**
  - [ ] Environment variables set
  - [ ] Playwright installed (check build logs)
  - [ ] Service status: Live
  - [ ] Check logs for "Crawler Worker started"

- [ ] **Analyzer Worker**
  - [ ] Environment variables set
  - [ ] Build successful
  - [ ] Service status: Live
  - [ ] Check logs for "Analyzer Worker started"

- [ ] **Alerts Worker**
  - [ ] Environment variables set
  - [ ] Build successful
  - [ ] Service status: Live
  - [ ] Check logs for "Alerts Worker started"

- [ ] **Telegram Bot**
  - [ ] Environment variables set
  - [ ] Build successful
  - [ ] Service status: Live
  - [ ] Test: Send `/start` to bot

---

## 🧪 Testing Your Configuration

### 1. Test API Health

```bash
curl https://magnus-flipper-api.onrender.com/health
# Expected: {"status":"ok"}
```

### 2. Test API with Key

```bash
curl https://magnus-flipper-api.onrender.com/api/v1/telegram/123456789/profiles \
  -H "x-api-key: your-magnus-api-key"
# Expected: {"ok":false,"message":"No Magnus account linked..."}
```

### 3. Test Telegram Bot

1. Open Telegram
2. Find your bot by username
3. Send `/start`
4. Expected: Welcome message with "Link Account" button

### 4. Check Worker Logs

In Render Dashboard:
1. Go to each worker service
2. Click **Logs** tab
3. Look for:
   - ✅ Environment variables validated
   - 🚀 Worker started
   - 📡 Listening on queue

---

## ⚠️ Common Issues

### Issue: Service won't start

**Check**:
1. Are all required env vars set? (no `<placeholders>`)
2. Is REDIS_URL in correct format?
3. Check build logs for errors

**Solution**:
```bash
# Verify in Render Dashboard → Environment
# Make sure no variable has < or > in the value
```

### Issue: Workers can't connect to Redis

**Check**:
- REDIS_URL format correct?
- Using Internal Redis URL (not External)?

**Solution**:
```bash
# Should be: redis://default:<password>@<internal-host>:<port>
# NOT: redis://red-abc123.render.com (external URL)
```

### Issue: API can't reach Supabase

**Check**:
- SUPABASE_URL includes `https://`?
- SERVICE_ROLE_KEY is correct (not anon key)?

**Solution**:
```bash
# Test Supabase connection
curl https://your-project.supabase.co/rest/v1/ \
  -H "apikey: your-service-role-key"
```

### Issue: Telegram bot not responding

**Check**:
- TELEGRAM_BOT_TOKEN correct?
- MAGNUS_API_URL points to deployed API?
- Bot service is "Live"?

**Solution**:
1. Check bot logs in Render
2. Verify token with BotFather: `/mybots` → Your Bot → API Token
3. Test API accessibility from bot

---

## 🔄 Updating Environment Variables

### Steps

1. Go to Render Dashboard
2. Select service
3. Click **Environment** tab
4. Click **Bulk Edit** or edit individual vars
5. Make changes
6. Click **Save Changes**
7. Service will **automatically redeploy**

### Important Notes

- ⚠️ Changing env vars triggers a redeploy
- 🕐 Redeploy takes 2-5 minutes
- 🔄 Service will restart (brief downtime)
- 📊 Monitor logs during redeploy

---

## 💡 Pro Tips

### 1. Use Render Redis for Simplicity

Create a Render Redis instance in the same region as your services:
- Faster (same data center)
- Automatic backups
- Easy scaling
- Internal networking (more secure)

### 2. Secret Management

For sensitive values, use Render's **Secret Files** feature:
1. Environment → Add Secret File
2. Upload .env file
3. Mount at runtime

### 3. Shared Environment Groups

Create an **Environment Group** for shared vars:
1. Dashboard → Environment Groups → New
2. Add common vars (REDIS_URL, SUPABASE_URL, etc.)
3. Link to multiple services
4. Update once, applies everywhere

### 4. Health Checks

Add health check endpoints to all services:
```bash
# In Render service settings
Health Check Path: /health
```

### 5. Monitoring

Enable notifications:
1. Service → Settings → Notifications
2. Add email or Slack webhook
3. Get alerts for failures

---

## 📞 Need Help?

### Documentation

- Render Docs: https://render.com/docs
- Supabase Docs: https://supabase.com/docs
- Redis Docs: https://redis.io/docs

### Troubleshooting

1. Check service logs in Render Dashboard
2. Verify all env vars are set (no placeholders)
3. Test connections with curl
4. Check service status (should be "Live")
5. Review build logs for errors

### Support

- Render Support: https://render.com/support
- Community Forum: https://community.render.com

---

## ✅ Final Checklist

Before marking as complete:

- [ ] All 6 services created in Render
- [ ] Environment variables set for each service
- [ ] No `<placeholder>` values remaining
- [ ] All services status: **Live**
- [ ] API health check passing
- [ ] Telegram bot responding
- [ ] Workers showing up in logs
- [ ] Redis connection successful
- [ ] Supabase connection successful

---

**🎉 Your Render deployment is complete!**

Next: Test end-to-end flow from user signup → profile creation → crawl → alert!
