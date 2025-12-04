# Production Deployment Guide

## Overview

This document outlines the production deployment setup for Magnus Flipper AI across all platforms:
- **Vercel** - Web application
- **Supabase** - Backend & database
- **Stripe** - Billing & subscriptions
- **EAS** - Mobile app builds

## Environment Variables

### Supabase Configuration

All Supabase environment variables follow the official format:

```bash
# Public (client-side)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-side only
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

**Usage:**
- `NEXT_PUBLIC_SUPABASE_URL` - Used in client and server components
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Used in client and server components
- `SUPABASE_SERVICE_ROLE_KEY` - Used only in server-side code (webhooks, admin operations)
- `SUPABASE_JWT_SECRET` - Used for JWT verification (if needed)

### Stripe Configuration

```bash
# Server-side
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_PRICE=price_xxx
STRIPE_AGENCY_PRICE=price_xxx

# Client-side (optional, for price display)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxx
NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID=price_xxx
```

**Usage:**
- `STRIPE_SECRET_KEY` - Server-side Stripe API calls
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification
- `STRIPE_PRO_PRICE` - Pro tier price ID (server-side)
- `STRIPE_AGENCY_PRICE` - Agency tier price ID (server-side)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Client-side Stripe.js initialization
- `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` - Client-side price display (optional)
- `NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID` - Client-side price display (optional)

### Application Configuration

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

## Vercel Deployment

### Build Configuration

The `vercel.json` is configured with:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "apps/web/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "apps/web/$1"
    }
  ]
}
```

### Build Command

Vercel uses: `cd apps/web && pnpm build`

This automatically:
1. Installs dependencies via `pnpm install`
2. Builds packages (if needed)
3. Builds the Next.js application

### Environment Variables Setup

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add all variables from the "Environment Variables" section above
3. Use Vercel's `@` syntax for secrets (e.g., `@supabase-url`)

### Webhook Configuration

The Stripe webhook route is configured with:
- `maxDuration: 60` - Extended timeout for webhook processing
- `runtime: 'nodejs'` - Node.js runtime (not edge)

**Vercel Webhook Setup:**
1. In Stripe Dashboard → Webhooks → Add endpoint
2. URL: `https://your-domain.com/api/stripe/webhook`
3. Select events: `customer.subscription.*`, `invoice.*`, `checkout.session.completed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Supabase Integration

### Client Usage

All server components use `createServerClient()` from `@/lib/supabase`:

```typescript
import { createServerClient } from "@/lib/supabase";

const supabase = await createServerClient();
const { data: { user } } = await supabase.auth.getUser();
```

### Service Role Usage

Service role key is only used in:
- Webhook handlers (Stripe webhook route)
- Admin operations requiring elevated permissions

**Pattern:**
```typescript
// Only in webhook routes or admin operations
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

## Stripe Integration

### API Routes

All Stripe API routes use wrapper functions from `@/lib/stripe`:

- `createCheckoutSession()` - Create checkout sessions
- `createPortalSession()` - Create billing portal sessions
- `getPriceIdForTier()` - Get price ID for subscription tier
- `createOrRetrieveCustomer()` - Customer management

### Webhook Handler

The webhook route (`/api/stripe/webhook`) handles:
- `checkout.session.completed` - New subscriptions
- `customer.subscription.updated` - Subscription changes
- `customer.subscription.deleted` - Cancellations
- `invoice.payment_succeeded` - Successful payments
- `invoice.payment_failed` - Failed payments

## Mobile / EAS Configuration

### app.config.js

The mobile app configuration includes:

```javascript
extra: {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.magnusflipper.com',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
}
```

### eas.json

Production build profile:

```json
{
  "production": {
    "android": { "buildType": "app-bundle" },
    "ios": { "buildType": "release" }
  }
}
```

### EAS Secrets

Set the following secrets in EAS:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://api.magnusflipper.com
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://your-project.supabase.co
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your-anon-key
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value pk_live_xxx
```

## Production Safety Checks

### ✅ Completed

- [x] Admin pages protected by middleware
- [x] Subscription gating logic implemented
- [x] All Stripe keys from environment variables
- [x] All Supabase clients use correct patterns
- [x] Console.log disabled in production (via logger utility)
- [x] No hardcoded API keys
- [x] Webhook route configured for production

### Console Logging

Production-safe logging is available via `@/lib/utils/logger`:

```typescript
import { logger } from "@/lib/utils/logger";

logger.log("This won't appear in production");
logger.error("This will always appear");
```

### Middleware Protection

All protected routes are behind middleware:
- `/dashboard/*` - Requires PRO tier or admin
- `/admin/*` - Requires ADMIN tier or admin role

### Subscription Gating

Subscription checks use:
- `getTierFromPriceId()` - Get tier from Stripe price ID
- `isActiveSubscription()` - Check if subscription is active
- `TIER_HIERARCHY` - Enforce tier hierarchy

## Build Process

### Local Build

```bash
# Build packages first
pnpm build:packages

# Build web app
pnpm --filter web build
```

### Vercel Build

Vercel automatically:
1. Runs `pnpm install`
2. Runs build command: `cd apps/web && pnpm build`
3. Deploys `.next` output

### EAS Build

```bash
# Production build
eas build --profile production --platform android
eas build --profile production --platform ios
```

## Verification Checklist

Before deploying to production:

- [ ] All environment variables set in Vercel
- [ ] Stripe webhook endpoint configured
- [ ] Supabase RLS policies configured
- [ ] Admin pages accessible only to admins
- [ ] Subscription tiers working correctly
- [ ] Build passes: `pnpm build:web`
- [ ] Type check passes: `pnpm --filter web typecheck`
- [ ] No console.log in production code
- [ ] All API routes use wrapper functions
- [ ] Mobile app config has correct API URLs

## Troubleshooting

### Build Fails

If build fails with module resolution errors:
1. Ensure packages are built: `pnpm build:packages`
2. Check `transpilePackages` in `next.config.mjs`
3. Verify all dependencies are in `package.json`

### Webhook Not Working

1. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
2. Check webhook URL in Stripe dashboard matches deployment
3. Verify webhook events are selected in Stripe
4. Check Vercel function logs for errors

### Supabase Connection Issues

1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
3. Ensure RLS policies allow access
4. Check Supabase project is active

## Support

For deployment issues, check:
- Vercel deployment logs
- Stripe webhook logs
- Supabase logs
- Application error logs
