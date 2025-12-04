# GitHub Secrets Checklist

This document lists all secrets that must be manually added to GitHub Repository Settings → Secrets and variables → Actions.

## Required Secrets

### Supabase (Required)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - **Description**: Supabase project URL
  - **Where to get**: Supabase Dashboard → Project Settings → API → Project URL
  - **Format**: `https://your-project-id.supabase.co`
  - **Used in**: CI build job, web app

- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **Description**: Supabase anonymous/public key
  - **Where to get**: Supabase Dashboard → Project Settings → API → anon/public key
  - **Format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - **Used in**: CI build job, web app

- [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - **Description**: Supabase service role key (admin access)
  - **Where to get**: Supabase Dashboard → Project Settings → API → service_role key
  - **Format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - **Used in**: CI build job, webhook handlers
  - **Security**: ⚠️ Keep secret - has admin access

- [ ] `SUPABASE_JWT_SECRET`
  - **Description**: Supabase JWT secret for token verification
  - **Where to get**: Supabase Dashboard → Project Settings → API → JWT Secret
  - **Format**: Random string
  - **Used in**: Token verification (if needed)

### Stripe (Required)
- [ ] `STRIPE_SECRET_KEY`
  - **Description**: Stripe secret API key
  - **Where to get**: Stripe Dashboard → Developers → API keys → Secret key
  - **Format**: `sk_test_...` (test) or `sk_live_...` (production)
  - **Used in**: CI build job, server-side Stripe operations
  - **Security**: ⚠️ Keep secret - can charge customers

- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - **Description**: Stripe publishable key (safe for client-side)
  - **Where to get**: Stripe Dashboard → Developers → API keys → Publishable key
  - **Format**: `pk_test_...` (test) or `pk_live_...` (production)
  - **Used in**: CI build job, client-side Stripe.js

- [ ] `STRIPE_WEBHOOK_SECRET`
  - **Description**: Stripe webhook signing secret
  - **Where to get**: Stripe Dashboard → Developers → Webhooks → Add endpoint → Copy signing secret
  - **Format**: `whsec_...`
  - **Used in**: CI build job, webhook signature verification
  - **Note**: Create webhook endpoint first, then copy secret

- [ ] `STRIPE_PRO_PRICE`
  - **Description**: Stripe Price ID for Pro tier subscription
  - **Where to get**: Stripe Dashboard → Products → Create/Edit product → Copy Price ID
  - **Format**: `price_...`
  - **Used in**: CI build job, subscription creation

- [ ] `STRIPE_AGENCY_PRICE`
  - **Description**: Stripe Price ID for Agency tier subscription
  - **Where to get**: Stripe Dashboard → Products → Create/Edit product → Copy Price ID
  - **Format**: `price_...`
  - **Used in**: CI build job, subscription creation

## Optional Secrets (Recommended)

### Application URLs
- [ ] `NEXT_PUBLIC_APP_URL`
  - **Description**: Production app URL
  - **Format**: `https://your-domain.com`
  - **Used in**: Redirects, email links

- [ ] `NEXT_PUBLIC_API_URL`
  - **Description**: Production API URL
  - **Format**: `https://api.your-domain.com`
  - **Used in**: API client configuration

### Monitoring & Analytics
- [ ] `SENTRY_DSN`
  - **Description**: Sentry DSN for error tracking
  - **Where to get**: Sentry Dashboard → Project Settings → Client Keys (DSN)
  - **Format**: `https://xxx@xxx.ingest.sentry.io/xxx`
  - **Used in**: Error tracking (if Sentry is configured)

- [ ] `POSTHOG_KEY`
  - **Description**: PostHog API key for analytics
  - **Where to get**: PostHog Dashboard → Project Settings → API Key
  - **Format**: `phc_...`
  - **Used in**: Analytics (if PostHog is configured)

### Worker / API
- [ ] `REDIS_URL`
  - **Description**: Redis connection URL
  - **Format**: `redis://host:port` or `rediss://host:port` (SSL)
  - **Used in**: Worker jobs, queue management

- [ ] `WORKER_SECRET`
  - **Description**: Secret for worker authentication
  - **Format**: Random secure string
  - **Used in**: Worker API authentication

- [ ] `LOG_LEVEL`
  - **Description**: Logging level
  - **Format**: `info`, `debug`, `warn`, `error`
  - **Default**: `info`
  - **Used in**: Application logging

## Setup Instructions

1. Go to GitHub Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret from the list above
4. Use the same name as listed (case-sensitive)
5. Paste the actual value (not the placeholder)
6. Click "Add secret"

## Verification

After adding secrets, verify they work:
1. Push a commit to trigger CI
2. Check GitHub Actions → CI workflow
3. Build job should pass environment variable check
4. If any required secret is missing, CI will fail with clear error

## Security Notes

- ⚠️ Never commit secrets to git
- ⚠️ Never share secrets in chat/email
- ⚠️ Rotate secrets if exposed
- ⚠️ Use different secrets for test/production
- ⚠️ Service role keys have admin access - keep secure

## Grouped by Provider

### Supabase Secrets
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`

### Stripe Secrets
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE`
- `STRIPE_AGENCY_PRICE`

### Application Secrets
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`

### Monitoring Secrets
- `SENTRY_DSN`
- `POSTHOG_KEY`

### Infrastructure Secrets
- `REDIS_URL`
- `WORKER_SECRET`
- `LOG_LEVEL`

