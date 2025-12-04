# Complete Environment Variables Matrix

## Platform Deployment Map

| Variable | Vercel | Azure Functions | Supabase | Security | Required |
|----------|--------|----------------|----------|----------|----------|
| **Core Infrastructure** |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | - | Public | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | - | Public | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | ✅ | Secret | ✅ |
| `DATABASE_URL` | ✅ | ✅ | - | Secret | ✅ |
| **Authentication** |
| `NEXTAUTH_URL` | ✅ | - | - | Public | ✅ |
| `NEXTAUTH_SECRET` | ✅ | - | - | Secret | ✅ |
| **Stripe Payment** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | - | - | Public | ✅ |
| `STRIPE_SECRET_KEY` | ✅ | ✅ | ✅ | Secret | ✅ |
| `STRIPE_WEBHOOK_SECRET` | ✅ | - | ✅ | Secret | ✅ |
| **Scraper Infrastructure** |
| `PLAYWRIGHT_HEADLESS` | - | ✅ | - | Public | ❌ |
| `PROXY_LIST` | - | ✅ | - | Secret | ❌ |
| `USE_PROXIES` | - | ✅ | - | Public | ❌ |
| **Marketplace Scrapers** |
| `FACEBOOK_EMAIL` | - | ✅ | - | Secret | ❌ |
| `FACEBOOK_PASSWORD` | - | ✅ | - | Secret | ❌ |
| `EBAY_API_KEY` | - | ✅ | - | Secret | ❌ |
| `VINTED_SESSION_COOKIE` | - | ✅ | - | Secret | ❌ |
| **Shipping Carriers** |
| `USPS_API_KEY` | ✅ | ✅ | - | Secret | ✅ |
| `USPS_USER_ID` | ✅ | ✅ | - | Secret | ✅ |
| `UPS_API_KEY` | ✅ | ✅ | - | Secret | ❌ |
| `UPS_ACCOUNT_NUMBER` | ✅ | ✅ | - | Secret | ❌ |
| `FEDEX_API_KEY` | ✅ | ✅ | - | Secret | ❌ |
| `FEDEX_ACCOUNT_NUMBER` | ✅ | ✅ | - | Secret | ❌ |
| `DHL_API_KEY` | ✅ | ✅ | - | Secret | ❌ |
| `SHIPPO_API_KEY` | ✅ | ✅ | - | Secret | ❌ |
| `EASYPOST_API_KEY` | ✅ | ✅ | - | Secret | ❌ |
| **AI Providers** |
| `DEEPSEEK_API_KEY` | ✅ | ✅ | - | Secret | ✅ |
| `DEEPSEEK_API_URL` | ✅ | ✅ | - | Public | ❌ |
| `OPENAI_API_KEY` | ✅ | ✅ | - | Secret | ❌ |
| **Azure Functions** |
| `AZURE_STORAGE_CONNECTION_STRING` | - | ✅ | - | Secret | ✅ |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | - | ✅ | - | Secret | ❌ |
| `FUNCTIONS_WORKER_RUNTIME` | - | ✅ | - | Public | ✅ |
| **Monitoring & Logging** |
| `SENTRY_DSN` | ✅ | ✅ | - | Secret | ❌ |
| `VERCEL_ANALYTICS_ID` | ✅ | - | - | Public | ❌ |
| `LOG_LEVEL` | ✅ | ✅ | ✅ | Public | ❌ |

## Detailed Variable Specifications

### 1. Core Infrastructure (REQUIRED)

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://your-project.supabase.co`
- **Platform**: Vercel, Azure Functions
- **Security**: Public
- **Description**: Supabase project URL
- **Required**: YES
- **Default**: None
- **Example**: `https://xyzcompany.supabase.co`

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: Your Supabase anon/public key
- **Platform**: Vercel, Azure Functions
- **Security**: Public (safe to expose)
- **Description**: Anonymous access key for client-side auth
- **Required**: YES
- **Default**: None
- **Generate**: Supabase Dashboard → Settings → API

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: Your Supabase service role key
- **Platform**: Vercel, Azure Functions, Supabase Edge Functions
- **Security**: SECRET (never expose)
- **Description**: Admin access key for server-side operations
- **Required**: YES
- **Default**: None
- **Generate**: Supabase Dashboard → Settings → API

#### `DATABASE_URL`
- **Value**: PostgreSQL connection string
- **Platform**: Vercel, Azure Functions
- **Security**: SECRET
- **Description**: Direct database connection
- **Required**: YES
- **Format**: `postgresql://postgres:[password]@db.xyzcompany.supabase.co:5432/postgres`
- **Generate**: Supabase Dashboard → Settings → Database

### 2. Authentication (REQUIRED)

#### `NEXTAUTH_URL`
- **Value**: Your app's URL
- **Platform**: Vercel
- **Security**: Public
- **Description**: Base URL for NextAuth callbacks
- **Required**: YES
- **Production**: `https://flipperagents.com`
- **Development**: `http://localhost:3000`

#### `NEXTAUTH_SECRET`
- **Value**: Random secure string
- **Platform**: Vercel
- **Security**: SECRET
- **Description**: Encryption key for session tokens
- **Required**: YES
- **Generate**: `openssl rand -base64 32`
- **Example**: `your-super-secret-string-here`

### 3. Stripe Payment (REQUIRED)

#### `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Value**: Stripe publishable key
- **Platform**: Vercel
- **Security**: Public
- **Description**: Client-side Stripe integration
- **Required**: YES
- **Generate**: Stripe Dashboard → Developers → API keys
- **Test**: `pk_test_...`
- **Live**: `pk_live_...`

#### `STRIPE_SECRET_KEY`
- **Value**: Stripe secret key
- **Platform**: Vercel, Azure Functions, Supabase
- **Security**: SECRET
- **Description**: Server-side Stripe operations
- **Required**: YES
- **Test**: `sk_test_...`
- **Live**: `sk_live_...`

#### `STRIPE_WEBHOOK_SECRET`
- **Value**: Stripe webhook signing secret
- **Platform**: Vercel, Supabase
- **Security**: SECRET
- **Description**: Verify Stripe webhook signatures
- **Required**: YES
- **Generate**: Stripe Dashboard → Webhooks → Add endpoint
- **Format**: `whsec_...`

### 4. Scraper Configuration (OPTIONAL)

#### `PLAYWRIGHT_HEADLESS`
- **Value**: `true` or `false`
- **Platform**: Azure Functions (worker-scraper)
- **Security**: Public
- **Description**: Run browser in headless mode
- **Required**: NO
- **Default**: `true`
- **Development**: `false` (for debugging)

#### `PROXY_LIST`
- **Value**: Comma-separated proxy URLs
- **Platform**: Azure Functions (worker-scraper)
- **Security**: SECRET
- **Description**: Rotating proxy pool
- **Required**: NO
- **Format**: `http://proxy1:8080,http://proxy2:8080`
- **Example**: `http://user:pass@proxy.example.com:8080`

#### `USE_PROXIES`
- **Value**: `true` or `false`
- **Platform**: Azure Functions (worker-scraper)
- **Security**: Public
- **Description**: Enable proxy rotation
- **Required**: NO
- **Default**: `false`

### 5. Marketplace Authentication (OPTIONAL)

#### `FACEBOOK_EMAIL`
- **Value**: Facebook account email
- **Platform**: Azure Functions (worker-scraper)
- **Security**: SECRET
- **Description**: Facebook Marketplace scraper login
- **Required**: NO (but recommended for authenticated scraping)

#### `FACEBOOK_PASSWORD`
- **Value**: Facebook account password
- **Platform**: Azure Functions (worker-scraper)
- **Security**: SECRET
- **Description**: Facebook Marketplace scraper login
- **Required**: NO
- **Note**: Use dedicated account for scraping

#### `EBAY_API_KEY`
- **Value**: eBay Developer API key
- **Platform**: Azure Functions (worker-scraper)
- **Security**: SECRET
- **Description**: eBay API access (alternative to scraping)
- **Required**: NO
- **Generate**: eBay Developers Program

#### `VINTED_SESSION_COOKIE`
- **Value**: Vinted session cookie value
- **Platform**: Azure Functions (worker-scraper)
- **Security**: SECRET
- **Description**: Authenticated Vinted API access
- **Required**: NO

### 6. Shipping Carriers (REQUIRED for USPS, OPTIONAL for others)

#### `USPS_API_KEY`
- **Value**: USPS Web Tools API key
- **Platform**: Vercel, Azure Functions
- **Security**: SECRET
- **Description**: USPS label generation and tracking
- **Required**: YES (primary carrier)
- **Generate**: USPS.com/business/web-tools-apis

#### `USPS_USER_ID`
- **Value**: USPS Web Tools user ID
- **Platform**: Vercel, Azure Functions
- **Security**: SECRET
- **Description**: USPS account identifier
- **Required**: YES

#### `UPS_API_KEY`
- **Value**: UPS API access key
- **Platform**: Vercel, Azure Functions
- **Security**: SECRET
- **Description**: UPS label generation and tracking
- **Required**: NO
- **Generate**: UPS Developer Kit

#### `FEDEX_API_KEY`
- **Value**: FedEx API key
- **Platform**: Vercel, Azure Functions
- **Security**: SECRET
- **Description**: FedEx shipping services
- **Required**: NO
- **Generate**: FedEx Developer Resource Center

#### `DHL_API_KEY`
- **Value**: DHL API key
- **Platform**: Vercel, Azure Functions
- **Security**: SECRET
- **Description**: DHL international shipping
- **Required**: NO

#### `SHIPPO_API_KEY`
- **Value**: Shippo aggregator API key
- **Platform**: Vercel, Azure Functions
- **Security**: SECRET
- **Description**: Multi-carrier shipping aggregator
- **Required**: NO (alternative to individual carriers)
- **Generate**: Shippo.com

#### `EASYPOST_API_KEY`
- **Value**: EasyPost API key
- **Platform**: Vercel, Azure Functions
- **Security**: SECRET
- **Description**: Multi-carrier shipping aggregator
- **Required**: NO (alternative to individual carriers)
- **Generate**: EasyPost.com

### 7. AI Providers (REQUIRED for DeepSeek, OPTIONAL for OpenAI)

#### `DEEPSEEK_API_KEY`
- **Value**: DeepSeek API key
- **Platform**: Vercel, Azure Functions
- **Security**: SECRET
- **Description**: DeepSeek R1 model access for deal evaluation
- **Required**: YES
- **Generate**: DeepSeek Platform

#### `DEEPSEEK_API_URL`
- **Value**: DeepSeek API endpoint
- **Platform**: Vercel, Azure Functions
- **Security**: Public
- **Description**: Custom API endpoint
- **Required**: NO
- **Default**: `https://api.deepseek.com/v1`

#### `OPENAI_API_KEY`
- **Value**: OpenAI API key
- **Platform**: Vercel, Azure Functions
- **Security**: SECRET
- **Description**: GPT-4 fallback for title/description generation
- **Required**: NO
- **Generate**: platform.openai.com

### 8. Azure Functions (REQUIRED for Workers)

#### `AZURE_STORAGE_CONNECTION_STRING`
- **Value**: Azure Storage connection string
- **Platform**: Azure Functions
- **Security**: SECRET
- **Description**: Function app storage
- **Required**: YES (for Azure deployment)
- **Format**: `DefaultEndpointsProtocol=https;AccountName=...`

#### `APPLICATIONINSIGHTS_CONNECTION_STRING`
- **Value**: Application Insights connection string
- **Platform**: Azure Functions
- **Security**: SECRET
- **Description**: Telemetry and monitoring
- **Required**: NO (but recommended)

#### `FUNCTIONS_WORKER_RUNTIME`
- **Value**: `node`
- **Platform**: Azure Functions
- **Security**: Public
- **Description**: Runtime type
- **Required**: YES
- **Default**: `node`

### 9. Monitoring & Logging (OPTIONAL)

#### `SENTRY_DSN`
- **Value**: Sentry Data Source Name
- **Platform**: Vercel, Azure Functions
- **Security**: SECRET (but can be public)
- **Description**: Error tracking
- **Required**: NO
- **Generate**: Sentry.io

#### `VERCEL_ANALYTICS_ID`
- **Value**: Vercel Analytics ID
- **Platform**: Vercel
- **Security**: Public
- **Description**: Vercel native analytics
- **Required**: NO
- **Auto-generated**: Vercel Dashboard

#### `LOG_LEVEL`
- **Value**: `debug`, `info`, `warn`, `error`
- **Platform**: All
- **Security**: Public
- **Description**: Logging verbosity
- **Required**: NO
- **Default**: `info`
- **Production**: `warn`
- **Development**: `debug`

## Quick Setup Script

```bash
#!/bin/bash
# setup-env.sh - Generate .env files from template

# Copy templates
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local

# Generate secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" >> .env.local

echo "Environment files created. Fill in remaining values manually."
```

## Environment File Locations

```
/
├── .env.local                    # Root (shared)
├── apps/
│   ├── web/
│   │   ├── .env.local           # Next.js app (Vercel)
│   │   └── .env.production      # Production overrides
│   ├── worker-scraper/
│   │   └── local.settings.json  # Azure Functions local
│   ├── worker-autosell/
│   │   └── local.settings.json  # Azure Functions local
│   └── worker-tracker/
│       └── local.settings.json  # Azure Functions local
└── supabase/
    └── .env                     # Supabase CLI
```

## Vercel Deployment

```bash
# Add all variables via CLI
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add STRIPE_SECRET_KEY production
vercel env add USPS_API_KEY production
# ... repeat for all required variables

# Or import from file
vercel env pull .env.production
```

## Azure Functions Deployment

```bash
# Set app settings
az functionapp config appsettings set \
  --name worker-scraper \
  --resource-group magnus-flipper-rg \
  --settings \
    SUPABASE_URL="https://xyz.supabase.co" \
    SUPABASE_SERVICE_ROLE_KEY="your-key" \
    FACEBOOK_EMAIL="scraper@example.com" \
    FACEBOOK_PASSWORD="password"
```

## Supabase Edge Functions

```bash
# Set secrets
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

## Security Best Practices

1. **Never commit secrets to git**
   - Add `.env*` to `.gitignore`
   - Use `.env.example` as template

2. **Use different keys per environment**
   - Development: test/sandbox keys
   - Production: live keys

3. **Rotate secrets regularly**
   - API keys: every 90 days
   - Webhook secrets: on compromise
   - Database passwords: every 180 days

4. **Use secret managers in production**
   - Azure Key Vault
   - AWS Secrets Manager
   - Vercel Environment Variables

5. **Audit access logs**
   - Monitor who accesses secrets
   - Track secret usage
   - Alert on unauthorized access

## Variable Validation

```typescript
// lib/env.ts - Validate environment variables at startup
import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  USPS_API_KEY: z.string().min(1),
  DEEPSEEK_API_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);
```

## Troubleshooting

**Error: Missing SUPABASE_URL**
- Ensure variable is set in platform config
- Check spelling (exact case)
- Verify .env.local exists locally

**Error: Invalid Stripe key**
- Verify using correct key (test vs live)
- Check key starts with `sk_test_` or `sk_live_`
- Regenerate key if compromised

**Scraper failing with auth error**
- Check Facebook credentials are correct
- Verify cookies haven't expired
- Try using different proxy

**Shipping label generation failing**
- Verify USPS credentials are active
- Check API key has proper permissions
- Ensure address format is correct
