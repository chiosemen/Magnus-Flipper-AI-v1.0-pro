# Magnus Flipper AI - Environment Variables Reference

Complete reference for all environment variables across the Magnus Flipper AI monorepo.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Core Variables](#core-variables)
- [Database Variables](#database-variables)
- [Authentication Variables](#authentication-variables)
- [External Services](#external-services)
- [Optional Features](#optional-features)
- [Per-App Configuration](#per-app-configuration)

---

## 🚀 Quick Start

### Minimum Required Variables

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://postgres:password@host:6543/postgres?pgbouncer=true

# Security
CRON_SECRET=your-random-secret
```

---

## 🔧 Core Variables

### NODE_ENV

**Required**: No
**Default**: `development`
**Valid Values**: `development` | `production` | `test`

Determines the runtime environment.

```bash
NODE_ENV=production
```

**Usage**: All apps

---

## 🗄️ Database Variables

### DATABASE_URL

**Required**: Yes
**Format**: PostgreSQL connection string

PostgreSQL database connection URL. For Supabase, use the pgBouncer port (6543) for connection pooling in serverless environments.

```bash
# Production (with pgBouncer)
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:6543/postgres?pgbouncer=true

# Development (direct connection)
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres

# Local development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/magnus_dev
```

**Usage**: All apps that access database
**Apps**: `api`, `api-serverless`, `worker-*`

### SUPABASE_URL

**Required**: Yes
**Format**: HTTPS URL

Supabase project URL.

```bash
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
```

**Where to find**:
1. Supabase Dashboard → Your Project
2. Settings → API → URL

**Usage**: All apps

### SUPABASE_SERVICE_ROLE_KEY

**Required**: Yes (backend only)
**Format**: JWT token

Supabase service role key for server-side operations. **Bypasses Row Level Security (RLS)** - use with caution.

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find**:
1. Supabase Dashboard → Your Project
2. Settings → API → service_role (secret)

**Usage**: Backend apps only
**Apps**: `api`, `api-serverless`, `worker-*`
**⚠️ NEVER expose this key to client-side code**

### SUPABASE_ANON_KEY

**Required**: Yes (frontend only)
**Format**: JWT token

Supabase anonymous key for client-side operations. **Respects Row Level Security (RLS)**.

```bash
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find**:
1. Supabase Dashboard → Your Project
2. Settings → API → anon (public)

**Usage**: Frontend apps
**Apps**: `web`, `mobile`

---

## 🔐 Authentication Variables

### CRON_SECRET

**Required**: Yes (for cron jobs)
**Format**: Random string (min 32 characters)

Secret key for securing cron endpoints. Prevents unauthorized triggering of scheduled tasks.

```bash
CRON_SECRET=your-random-secret-minimum-32-characters-long
```

**Generate**:
```bash
# macOS/Linux
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Usage**: Serverless API
**Apps**: `api-serverless`

### NEXTAUTH_SECRET

**Required**: Only if using NextAuth
**Format**: Random string

Secret for NextAuth.js session encryption.

```bash
NEXTAUTH_SECRET=your-nextauth-secret-here
```

**Usage**: Web app (if using NextAuth)
**Apps**: `web`

### NEXTAUTH_URL

**Required**: Only if using NextAuth
**Format**: HTTPS URL

Canonical URL of your web application.

```bash
# Production
NEXTAUTH_URL=https://magnusflipper.com

# Development
NEXTAUTH_URL=http://localhost:3000
```

**Usage**: Web app (if using NextAuth)
**Apps**: `web`

---

## 🌐 External Services

### eBay API

#### EBAY_APP_ID

**Required**: No (eBay crawler won't work without it)
**Format**: String

eBay Developer App ID for accessing eBay Finding API.

```bash
EBAY_APP_ID=YourAppI-YourApp-PRD-1234567890-12345678
```

**Get your App ID**:
1. Go to https://developer.ebay.com
2. Create an application
3. Copy **App ID (Client ID)**

**Usage**: eBay crawler
**Apps**: `api-serverless`, `worker-crawler`

### Telegram Bot

#### TELEGRAM_BOT_TOKEN

**Required**: No (optional feature)
**Format**: String

Telegram bot token for sending notifications via Telegram.

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
```

**Get your token**:
1. Message @BotFather on Telegram
2. Send `/newbot` and follow instructions
3. Copy the token

**Usage**: Notifications
**Apps**: `worker-alerts`, `notifications`

#### TELEGRAM_BOT_USERNAME

**Required**: No
**Format**: String (without @)

Username of your Telegram bot.

```bash
TELEGRAM_BOT_USERNAME=MagnusFlipperBot
```

**Usage**: Notifications
**Apps**: `worker-alerts`

### Stripe (Billing)

#### STRIPE_SECRET_KEY

**Required**: No (billing won't work without it)
**Format**: String starting with `sk_`

Stripe secret key for processing payments.

```bash
# Test mode
STRIPE_SECRET_KEY=sk_test_...

# Production mode
STRIPE_SECRET_KEY=sk_live_...
```

**Get your key**:
1. Go to https://dashboard.stripe.com
2. Developers → API keys
3. Copy **Secret key**

**Usage**: Billing
**Apps**: `api`, `api-serverless`, `web`

#### STRIPE_PUBLISHABLE_KEY

**Required**: No (frontend billing won't work)
**Format**: String starting with `pk_`

Stripe publishable key for client-side Stripe.js.

```bash
# Test mode
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Production mode
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Usage**: Web app billing UI
**Apps**: `web`

### Upstash Redis (Queue System)

#### UPSTASH_REDIS_REST_URL

**Required**: No (queue will use in-memory fallback)
**Format**: HTTPS URL

Upstash Redis REST API URL for serverless-compatible queue.

```bash
UPSTASH_REDIS_REST_URL=https://your-redis-name.upstash.io
```

**Get your URL**:
1. Go to https://console.upstash.com
2. Create a Redis database
3. Copy **REST URL**

**Usage**: Queue system
**Apps**: `api-serverless`, `worker-*`

#### UPSTASH_REDIS_REST_TOKEN

**Required**: No (required if using Upstash)
**Format**: String

Upstash Redis REST API token.

```bash
UPSTASH_REDIS_REST_TOKEN=your-upstash-token-here
```

**Get your token**:
1. Upstash Console → Your Database
2. Copy **REST Token**

**Usage**: Queue system
**Apps**: `api-serverless`, `worker-*`

---

## ⚙️ Optional Features

### Logging

#### LOG_LEVEL

**Required**: No
**Default**: `info`
**Valid Values**: `error` | `warn` | `info` | `debug`

Application logging level.

```bash
LOG_LEVEL=info
```

**Usage**: All apps

#### SENTRY_DSN

**Required**: No
**Format**: HTTPS URL

Sentry DSN for error tracking.

```bash
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7654321
```

**Get your DSN**:
1. Go to https://sentry.io
2. Create a project
3. Copy **DSN**

**Usage**: Error tracking
**Apps**: All apps

### Rate Limiting

#### RATE_LIMIT_WINDOW_MS

**Required**: No
**Default**: `60000` (1 minute)
**Format**: Number (milliseconds)

Time window for rate limiting.

```bash
RATE_LIMIT_WINDOW_MS=60000
```

**Usage**: API rate limiting
**Apps**: `api`, `api-serverless`

#### RATE_LIMIT_MAX_REQUESTS

**Required**: No
**Default**: `100`
**Format**: Number

Maximum requests per window.

```bash
RATE_LIMIT_MAX_REQUESTS=100
```

**Usage**: API rate limiting
**Apps**: `api`, `api-serverless`

---

## 📱 Per-App Configuration

### apps/web (Next.js Frontend)

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://api.magnusflipper.com

# Optional
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_SITE_URL=https://magnusflipper.com
```

### apps/api-serverless (Serverless API)

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key
DATABASE_URL=postgresql://...?pgbouncer=true
CRON_SECRET=your-cron-secret

# Optional
EBAY_APP_ID=your-ebay-app-id
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
STRIPE_SECRET_KEY=sk_live_...
LOG_LEVEL=info
```

### apps/mobile (React Native/Expo)

```bash
# Required
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=https://api.magnusflipper.com

# Optional
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### apps/worker-* (Background Workers)

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key
DATABASE_URL=postgresql://...

# Optional
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
TELEGRAM_BOT_TOKEN=...
LOG_LEVEL=info
```

---

## 📝 Environment File Templates

### .env.development

```bash
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-dev-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-key
SUPABASE_ANON_KEY=your-dev-anon-key

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/magnus_dev

# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Security (dev)
CRON_SECRET=dev-secret-not-for-production

# Logging
LOG_LEVEL=debug
```

### .env.production

```bash
NODE_ENV=production

# Supabase
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-key
SUPABASE_ANON_KEY=your-prod-anon-key

# Database (with pgBouncer)
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:6543/postgres?pgbouncer=true

# API
NEXT_PUBLIC_API_URL=https://api.magnusflipper.com

# Security
CRON_SECRET=your-production-cron-secret

# External Services
EBAY_APP_ID=your-ebay-app-id
STRIPE_SECRET_KEY=sk_live_...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Logging
LOG_LEVEL=warn
SENTRY_DSN=https://...
```

---

## 🔒 Security Best Practices

1. **Never commit .env files to git**
   - Add `.env*` to `.gitignore`
   - Use `.env.example` as template

2. **Use environment-specific values**
   - Development: `.env.development`
   - Production: Vercel environment variables

3. **Rotate secrets regularly**
   - `CRON_SECRET`: Every 90 days
   - Database credentials: Annually
   - API keys: When compromised

4. **Never expose service keys client-side**
   - Only use `SUPABASE_SERVICE_ROLE_KEY` in backend
   - Use `SUPABASE_ANON_KEY` for frontend
   - Prefix public variables with `NEXT_PUBLIC_` or `EXPO_PUBLIC_`

5. **Use strong random secrets**
   ```bash
   openssl rand -base64 32
   ```

---

## ✅ Validation Checklist

Before deploying, verify:

- [ ] All required variables are set
- [ ] No placeholder values (e.g., "your-key-here")
- [ ] Production uses pgBouncer URL (port 6543)
- [ ] Service keys are NOT in frontend config
- [ ] CRON_SECRET is strong and random
- [ ] API URLs use HTTPS (not HTTP)
- [ ] Test mode keys for development
- [ ] Live mode keys for production

---

## 📚 Resources

- [Supabase Environment Variables](https://supabase.com/docs/guides/cli/managing-environments)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
