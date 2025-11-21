# 🔐 Magnus Flipper - Environment Variables Setup Guide

**Complete guide for configuring environment variables locally and on Render**

---

## 📋 Overview

This guide covers:
1. Creating local `.env.production` file
2. Syncing environment variables to Render
3. Manual configuration via Render Dashboard
4. Troubleshooting common issues

---

## 🚀 Quick Start

### 1. Create Local Environment File

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro

# Copy template
cp .env.production.template .env.production

# Edit with your values
nano .env.production
```

### 2. Fill in Required Values

#### Get Supabase Credentials
1. Go to https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy:
   - Project URL
   - anon/public key
   - service_role key

#### Create Render Redis
1. Go to https://dashboard.render.com
2. New → Redis
3. Name: `magnus-redis`
4. Copy Internal Redis URL

#### Create Telegram Bot
1. Open Telegram → @BotFather
2. `/newbot`
3. Follow prompts
4. Copy bot token

#### Generate API Key
```bash
openssl rand -hex 32
```

### 3. Example `.env.production` File

```bash
### Magnus Flipper Production ENV ###

NODE_ENV=production

MAGNUS_API_KEY=8f7d6e5c4b3a2918f7d6e5c4b3a2918f7d6e5c4b3a2918f7d6e5c4b3a2918

# API URL (Render)
NEXT_PUBLIC_API_URL=https://magnus-flipper-api.onrender.com

# Supabase
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Redis
REDIS_URL=redis://default:abc123xyz@oregon-redis.render.com:6379

# Telegram
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Mobile app
EXPO_PUBLIC_API_URL=https://magnus-flipper-api.onrender.com

# Workers
QUEUE_RETRY_LIMIT=5
QUEUE_BACKOFF=2000
```

---

## 🔄 Sync to Render (Automated)

### Prerequisites

1. **Get Render API Key**:
   - Go to https://dashboard.render.com/u/settings#api-keys
   - Create new API key
   - Copy the key

2. **Get Service ID**:
   - Go to your service in Render Dashboard
   - Settings → Service ID
   - Copy the ID (looks like `srv-xxxxx`)

### Run Sync Script

```bash
# Set your Render API key
export RENDER_API_KEY='rnd_abc123xyz...'

# Edit script with your service ID
nano scripts/render-sync-env.sh
# Change: SERVICE_ID="<your-render-service-id>"
# To:     SERVICE_ID="srv-abc123xyz"

# Run sync
./scripts/render-sync-env.sh
```

**Output**:
```
🔄 Syncing .env.production → Render Environment Variables...

➡️  Setting NODE_ENV...
➡️  Setting MAGNUS_API_KEY...
➡️  Setting NEXT_PUBLIC_API_URL...
➡️  Setting SUPABASE_URL...
...

🎉 Render Environment Sync Complete!
```

---

## 🖱️ Manual Configuration (Render Dashboard)

If you prefer manual setup or the script doesn't work:

### Step 1: Navigate to Service

1. Go to https://dashboard.render.com
2. Click on your service (e.g., `magnus-flipper-api`)
3. Click **Environment** tab
4. Click **Bulk Edit**

### Step 2: Paste Environment Variables

**For API Service**:
```bash
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_API_URL=https://magnus-flipper-api.onrender.com
MAGNUS_API_KEY=<your-32-char-key>
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
REDIS_URL=redis://default:<password>@<host>:<port>
TELEGRAM_BOT_TOKEN=<your-bot-token>
ALLOWED_ORIGINS=https://magnus-flipper.vercel.app
LOG_LEVEL=info
```

**For Workers** (see `RENDER_ENV_TEMPLATES.md` for all services)

### Step 3: Save

1. Click **Save Changes**
2. Service will automatically redeploy
3. Wait 2-5 minutes for deployment

---

## 📝 Environment Variables Reference

### Core Variables (All Services)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment name | `production` |
| `REDIS_URL` | Redis connection | `redis://default:pass@host:6379` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | `eyJhbGc...` |
| `MAGNUS_API_KEY` | Internal API key | 32-char hex string |

### API Service Only

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | API port | `3001` |
| `SUPABASE_ANON_KEY` | Public Supabase key | `eyJhbGc...` |
| `TELEGRAM_BOT_TOKEN` | Bot token | `1234567890:ABC...` |
| `ALLOWED_ORIGINS` | CORS origins | `https://app.com` |

### Crawler Worker Only

| Variable | Description | Example |
|----------|-------------|---------|
| `CHROMIUM_PATH` | Browser path | `/usr/bin/chromium-browser` |
| `WORKER_CONCURRENCY` | Jobs at once | `3` |
| `REQUEST_TIMEOUT` | Timeout (ms) | `30000` |
| `MAX_RETRIES` | Retry count | `3` |

### Bot Service Only

| Variable | Description | Example |
|----------|-------------|---------|
| `MAGNUS_API_URL` | API endpoint | `https://api.onrender.com` |
| `TELEGRAM_BOT_TOKEN` | Bot token | `1234567890:ABC...` |

---

## 🔍 Verification

### Check Local Environment

```bash
# Source your .env file
source .env.production

# Verify variables are set
echo $MAGNUS_API_KEY
echo $SUPABASE_URL
echo $REDIS_URL
```

### Check Render Environment

1. Go to Render Dashboard
2. Select service
3. Click **Environment** tab
4. Verify all variables are present
5. Check **Logs** tab for startup messages

Expected in logs:
```
✅ Environment variables validated
📍 Environment: production
🔗 Redis: redis://...
💾 Supabase: https://...
```

---

## 🆘 Troubleshooting

### Issue: Script fails with "SERVICE_ID not found"

**Solution**:
1. Go to Render Dashboard → Your Service → Settings
2. Copy Service ID (e.g., `srv-abc123xyz`)
3. Edit `scripts/render-sync-env.sh`
4. Replace `<your-render-service-id>` with actual ID

### Issue: "RENDER_API_KEY not set"

**Solution**:
```bash
# Get API key from Render Dashboard
export RENDER_API_KEY='rnd_your_key_here'

# Or add to ~/.bashrc or ~/.zshrc for persistence
echo 'export RENDER_API_KEY="rnd_your_key_here"' >> ~/.bashrc
```

### Issue: Variables not updating in Render

**Cause**: Render caches environment variables

**Solution**:
1. Go to Render Dashboard
2. Click service
3. Click **Manual Deploy** → **Deploy latest commit**
4. Or wait 2-5 minutes for auto-redeploy

### Issue: "curl: (6) Could not resolve host"

**Cause**: Network issue or wrong Render API endpoint

**Solution**:
1. Check internet connection
2. Verify Render API endpoint: `https://api.render.com/v1`
3. Check RENDER_API_KEY is valid

### Issue: Service won't start after env update

**Check**:
1. Go to service → **Logs** tab
2. Look for environment validation errors
3. Common issues:
   - Missing required variables
   - Invalid REDIS_URL format
   - Wrong Supabase URL format

**Fix**:
1. Verify all required variables are set
2. Check format of URLs (include `https://`)
3. Ensure no quotes around values in Render Dashboard

---

## 📚 Related Documentation

- **Render Templates**: See `RENDER_ENV_TEMPLATES.md` for all service templates
- **Quick Setup**: See `RENDER_QUICK_SETUP.md` for 5-minute setup
- **Master Guide**: See `DEPLOY_MASTER_GUIDE.md` for complete deployment

---

## 🔐 Security Best Practices

### 1. Never Commit Secrets

```bash
# Add to .gitignore
echo ".env.production" >> .gitignore
echo ".env.local" >> .gitignore
```

### 2. Rotate Keys Regularly

- Regenerate `MAGNUS_API_KEY` monthly
- Rotate Telegram bot token if compromised
- Update Supabase keys on security updates

### 3. Use Different Keys for Each Environment

- Development: `.env.development`
- Staging: `.env.staging`
- Production: `.env.production`

### 4. Limit Access

- Only share Render API key with authorized team members
- Use Render's team access controls
- Revoke unused API keys

---

## ✅ Checklist

Before deploying:

- [ ] `.env.production` created from template
- [ ] All `<placeholder>` values filled in
- [ ] MAGNUS_API_KEY generated (32 chars)
- [ ] Supabase credentials obtained
- [ ] Render Redis created
- [ ] Telegram bot created
- [ ] Environment variables synced to Render
- [ ] All 6 services have env vars configured
- [ ] Services deployed successfully
- [ ] Startup logs verified (no env errors)

---

## 📞 Need Help?

1. **Check logs**: `Render Dashboard → Service → Logs`
2. **Verify env vars**: `Render Dashboard → Service → Environment`
3. **Test locally**: `source .env.production && node`
4. **Review templates**: See `RENDER_ENV_TEMPLATES.md`

---

**Environment configuration complete!** 🎉

All services should now have the correct environment variables and be ready for production use.
