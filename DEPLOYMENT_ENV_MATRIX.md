# DEPLOYMENT ENVIRONMENT VARIABLE MATRIX

**Last Updated**: 2024-01-15  
**Purpose**: Complete specification of all environment variables required for production deployment

---

## OVERVIEW

This document specifies all environment variables needed across:
- **Web App** (Vercel)
- **Workers** (Azure Container Apps)
- **Mobile App** (Expo EAS)
- **Engine Packages** (Runtime)

---

## ENVIRONMENT VARIABLES

### SUPABASE CONFIGURATION

| Variable Name | Description | Required | Location | Example Value | Risk Level |
|---------------|-------------|----------|----------|---------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes | web, mobile | `https://xxxxx.supabase.co` | Medium |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes | web, mobile | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Medium |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | Yes | web, workers | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | **HIGH** |
| `SUPABASE_URL` | Supabase project URL (server-side) | Yes | workers | `https://xxxxx.supabase.co` | Medium |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for workers | Yes | workers | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | **HIGH** |

**Notes**:
- Service role key has full database access - **NEVER expose to client**
- Anon key is safe for client-side use (RLS policies protect data)

---

### STRIPE CONFIGURATION

| Variable Name | Description | Required | Location | Example Value | Risk Level |
|---------------|-------------|----------|----------|---------------|------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (LIVE) | Yes | web | `sk_live_xxxxx` | **HIGH** |
| `STRIPE_SECRET_KEY_TEST` | Stripe secret key (TEST) | No | web | `sk_test_xxxxx` | Medium |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (LIVE) | Yes | web, mobile | `pk_live_xxxxx` | Low |
| `STRIPE_PUBLISHABLE_KEY_TEST` | Stripe publishable key (TEST) | No | web, mobile | `pk_test_xxxxx` | Low |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Yes | web | `whsec_xxxxx` | **HIGH** |
| `STRIPE_WEBHOOK_SECRET_TEST` | Stripe webhook signing secret (TEST) | No | web | `whsec_xxxxx` | Medium |
| `STRIPE_PRICE_ID_BASIC` | Stripe Price ID for Basic tier | Yes | web | `price_xxxxx` | Low |
| `STRIPE_PRICE_ID_PRO` | Stripe Price ID for Pro tier | Yes | web | `price_xxxxx` | Low |
| `STRIPE_PRICE_ID_PREMIUM` | Stripe Price ID for Premium tier | Yes | web | `price_xxxxx` | Low |
| `STRIPE_PRICE_ID_ADMIN` | Stripe Price ID for Admin tier | Yes | web | `price_xxxxx` | Low |

**Notes**:
- Use TEST keys for development/staging
- Switch to LIVE keys for production
- Webhook secret must match the endpoint URL in Stripe dashboard

---

### AZURE WORKER CONFIGURATION

| Variable Name | Description | Required | Location | Example Value | Risk Level |
|---------------|-------------|----------|----------|---------------|------------|
| `WORKER_ID` | Unique identifier for worker instance | No | workers | `worker-001` | Low |
| `WORKER_HEARTBEAT_INTERVAL` | Heartbeat interval in milliseconds | No | workers | `60000` | Low |
| `AZURE_CONTAINER_REGISTRY` | Azure Container Registry URL | Yes | infra | `xxxxx.azurecr.io` | Medium |
| `AZURE_RESOURCE_GROUP` | Azure resource group name | Yes | infra | `magnus-flipper-rg` | Low |
| `AZURE_CONTAINER_APP_ENV` | Azure Container App environment name | Yes | infra | `magnus-flipper-env` | Low |

---

### MOBILE APP CONFIGURATION (EXPO EAS)

| Variable Name | Description | Required | Location | Example Value | Risk Level |
|---------------|-------------|----------|----------|---------------|------------|
| `EXPO_PUBLIC_API_URL` | API base URL for mobile app | Yes | mobile | `https://api.magnusflipper.ai` | Low |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase URL (same as web) | Yes | mobile | `https://xxxxx.supabase.co` | Medium |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (same as web) | Yes | mobile | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Medium |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes | mobile | `pk_live_xxxxx` | Low |
| `EAS_PROJECT_ID` | Expo EAS project ID | Yes | mobile | `xxxxx-xxxxx-xxxxx` | Low |

---

### APPLICATION CONFIGURATION

| Variable Name | Description | Required | Location | Example Value | Risk Level |
|---------------|-------------|----------|----------|---------------|------------|
| `NODE_ENV` | Environment mode | Yes | all | `production`, `development`, `staging` | Low |
| `NEXT_PUBLIC_APP_URL` | Public application URL | Yes | web | `https://magnusflipper.ai` | Low |
| `NEXT_PUBLIC_API_URL` | API base URL | Yes | web | `https://api.magnusflipper.ai` | Low |
| `LOG_LEVEL` | Logging level | No | all | `info`, `warn`, `error`, `debug` | Low |
| `ENABLE_ANALYTICS` | Enable analytics tracking | No | web | `true`, `false` | Low |

---

### MARKETPLACE API KEYS (Workers)

| Variable Name | Description | Required | Location | Example Value | Risk Level |
|---------------|-------------|----------|----------|---------------|------------|
| `EBAY_API_KEY` | eBay API key | No | worker-scraper | `xxxxx` | **HIGH** |
| `EBAY_ACCESS_TOKEN` | eBay OAuth access token | No | worker-scraper | `xxxxx` | **HIGH** |
| `VINTED_SESSION_COOKIE` | Vinted session cookie | No | worker-scraper | `_vinted_fr_session=xxxxx` | **HIGH** |
| `DEPOP_ACCESS_TOKEN` | Depop API access token | No | worker-scraper | `xxxxx` | **HIGH** |
| `FACEBOOK_SESSION_COOKIES` | Facebook session cookies | No | worker-scraper | `xxxxx` | **HIGH** |
| `OFFERUP_AUTH_TOKEN` | OfferUp authentication token | No | worker-scraper | `xxxxx` | **HIGH** |

**Notes**:
- These are optional - workers can function with mock data if not provided
- Store securely in Azure Key Vault or Container App secrets

---

### SHIPPING CARRIER API KEYS (Workers)

| Variable Name | Description | Required | Location | Example Value | Risk Level |
|---------------|-------------|----------|----------|---------------|------------|
| `USPS_API_KEY` | USPS API key | No | worker-tracker | `xxxxx` | **HIGH** |
| `USPS_USER_ID` | USPS user ID | No | worker-tracker | `xxxxx` | **HIGH** |
| `UPS_ACCESS_KEY` | UPS API access key | No | worker-tracker | `xxxxx` | **HIGH** |
| `UPS_USERNAME` | UPS API username | No | worker-tracker | `xxxxx` | **HIGH** |
| `UPS_PASSWORD` | UPS API password | No | worker-tracker | `xxxxx` | **HIGH** |
| `FEDEX_API_KEY` | FedEx API key | No | worker-tracker | `xxxxx` | **HIGH** |
| `FEDEX_ACCOUNT_NUMBER` | FedEx account number | No | worker-tracker | `xxxxx` | **HIGH** |

**Notes**:
- Required only if using real carrier APIs
- Can use test mode initially

---

### DATABASE CONFIGURATION

| Variable Name | Description | Required | Location | Example Value | Risk Level |
|---------------|-------------|----------|----------|---------------|------------|
| `DATABASE_URL` | Direct database connection string | No | workers | `postgresql://user:pass@host:5432/db` | **HIGH** |
| `POSTGRES_HOST` | PostgreSQL host | No | workers | `db.xxxxx.supabase.co` | Medium |
| `POSTGRES_PORT` | PostgreSQL port | No | workers | `5432` | Low |
| `POSTGRES_DB` | Database name | No | workers | `postgres` | Low |
| `POSTGRES_USER` | Database user | No | workers | `postgres` | **HIGH** |
| `POSTGRES_PASSWORD` | Database password | No | workers | `xxxxx` | **HIGH** |

**Notes**:
- Prefer Supabase client over direct DB connection
- Direct connection only needed for migrations/admin tasks

---

## ENVIRONMENT-SPECIFIC CONFIGURATIONS

### Development (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (TEST)
STRIPE_SECRET_KEY_TEST=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY_TEST=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET_TEST=whsec_xxxxx

# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Production (Vercel)

All variables from the matrix above, using **LIVE** Stripe keys.

### Staging (Vercel Preview)

Same as production but with **TEST** Stripe keys.

---

## SECURITY NOTES

### High-Risk Variables
- **NEVER** commit to version control
- **NEVER** expose to client-side code
- Store in secure secret management:
  - Vercel: Environment Variables (encrypted)
  - Azure: Key Vault or Container App secrets
  - Expo: EAS secrets

### Medium-Risk Variables
- Can be public but should be rotated regularly
- Monitor for unauthorized usage

### Low-Risk Variables
- Safe to include in public config
- No security impact if exposed

---

## VERIFICATION CHECKLIST

Before deployment, verify:

- [ ] All required variables are set in target environment
- [ ] High-risk variables are stored securely
- [ ] Stripe keys match environment (TEST vs LIVE)
- [ ] Supabase keys are correct for target project
- [ ] Webhook secrets match Stripe dashboard configuration
- [ ] Mobile app has correct API URLs
- [ ] Workers have access to required secrets

---

## PLACEHOLDER VALUES

When setting up new environments, use these placeholders:

- Supabase URL: `https://[PROJECT_ID].supabase.co`
- Stripe keys: `sk_live_[PLACEHOLDER]` or `pk_live_[PLACEHOLDER]`
- Webhook secrets: `whsec_[PLACEHOLDER]`
- API URLs: `https://[ENVIRONMENT].magnusflipper.ai`

**DO NOT use these placeholders in production!**

---

**END OF ENVIRONMENT VARIABLE MATRIX**

