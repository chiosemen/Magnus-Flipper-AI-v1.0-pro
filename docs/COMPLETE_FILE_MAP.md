# Complete File Placement Map - Magnus Flipper AI

## Monorepo Structure Overview

```
Magnus-Flipper-AI-v1.0-pro-reset/
├── apps/                          # Application bundles
│   ├── web/                       # Next.js 16 frontend (Vercel)
│   ├── mobile/                    # React Native + Expo (iOS/Android)
│   ├── worker/                    # Legacy worker (deprecated)
│   ├── worker-autosell/          # Azure Function: Auto-sell detection
│   ├── worker-tracker/           # Azure Function: Shipment tracking
│   └── worker-scraper/           # Azure Function: Marketplace scraping
├── packages/                      # Shared libraries
│   ├── profit-engine/            # P&L tracking, ledger, analytics
│   ├── shipping-engine/          # Label generation, tracking, fulfillment
│   ├── scraper-sync/             # Live marketplace scrapers
│   ├── agentic-engine/           # Auto-buyer + Auto-lister (WIP)
│   ├── deal-engine/              # Deal evaluation algorithms
│   ├── arb-engine/               # Arbitrage calculations
│   ├── core/                     # Core utilities
│   ├── api/                      # Shared API clients
│   ├── types/                    # TypeScript types
│   └── ui/                       # Shared UI components
├── supabase/                      # Database and edge functions
│   ├── migrations/               # SQL migrations (14 files)
│   └── functions/                # Edge functions (Deno runtime)
├── docs/                          # Documentation
└── infra/                         # Infrastructure as Code
```

## Detailed File Map by Layer

### 📱 Frontend Layer (Vercel Deployment)

#### `/apps/web/` - Next.js 16 App
```
apps/web/
├── app/                           # App Router (Next.js 16)
│   ├── (auth)/                   # Auth routes group
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── verify/page.tsx
│   ├── (protected)/              # Protected routes (requires auth)
│   │   ├── dashboard/page.tsx
│   │   ├── inventory/page.tsx
│   │   ├── listings/page.tsx
│   │   ├── profit/               # Profit tracking pages
│   │   │   ├── page.tsx          # Main profit dashboard
│   │   │   ├── ledger/page.tsx   # Ledger entries
│   │   │   ├── portfolio/page.tsx # Portfolio analytics
│   │   │   └── accuracy/page.tsx # EV accuracy
│   │   ├── shipping/             # Shipping management pages
│   │   │   ├── page.tsx          # Shipping dashboard
│   │   │   ├── labels/page.tsx   # Label history
│   │   │   ├── labels/[id]/page.tsx # Label details
│   │   │   ├── tracking/[trackingNumber]/page.tsx # Tracking
│   │   │   └── fulfillment/page.tsx # Fulfillment workflows
│   │   ├── scraper/              # Scraper management
│   │   │   ├── page.tsx          # Scraper dashboard
│   │   │   ├── listings/page.tsx # Scraped listings
│   │   │   ├── health/page.tsx   # Health monitoring
│   │   │   └── config/page.tsx   # Scraper configs
│   │   ├── analytics/page.tsx    # Analytics dashboard
│   │   └── settings/page.tsx     # User settings
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication
│   │   │   └── [...nextauth]/route.ts
│   │   ├── profit/               # Profit API
│   │   │   ├── summary/route.ts
│   │   │   ├── trend/route.ts
│   │   │   └── portfolio/route.ts
│   │   ├── shipping/             # Shipping API
│   │   │   ├── label/route.ts
│   │   │   ├── track/[trackingNumber]/route.ts
│   │   │   └── carriers/route.ts
│   │   ├── scraper/              # Scraper API
│   │   │   ├── fresh/route.ts
│   │   │   ├── health/route.ts
│   │   │   └── trigger/route.ts
│   │   └── webhooks/             # Webhook handlers
│   │       ├── stripe/route.ts
│   │       └── shipment/route.ts
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   └── globals.css               # Global styles (Tailwind v4)
├── components/                    # React components
│   ├── profit/                   # Profit tracking components
│   │   ├── PnLSummaryCard.tsx
│   │   ├── ProfitChart.tsx
│   │   ├── PortfolioOverview.tsx
│   │   └── EVAccuracyMetrics.tsx
│   ├── shipping/                 # Shipping components
│   │   ├── ShippingLabelCard.tsx
│   │   ├── TrackingTimeline.tsx
│   │   └── FulfillmentStatus.tsx
│   └── ui/                       # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ... (shadcn/ui components)
├── lib/                           # Utility libraries
│   ├── supabase/
│   │   ├── client.ts             # Client-side Supabase
│   │   ├── server.ts             # Server-side Supabase
│   │   └── middleware.ts         # Auth middleware
│   ├── stripe/
│   │   └── client.ts             # Stripe integration
│   └── utils.ts                  # Utility functions
├── providers/                     # React Context providers
│   ├── SupabaseProvider.tsx
│   └── ThemeProvider.tsx
├── types/                         # TypeScript types
│   └── index.ts
├── middleware.ts                  # Next.js middleware (auth)
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS v4 config
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies

**Deploy Target**: Vercel
**Build Command**: `pnpm build`
**Output Directory**: `.next`
**Environment Variables**: See ENVIRONMENT_VARIABLES_COMPLETE.md
```

#### `/apps/mobile/` - React Native + Expo App
```
apps/mobile/
├── app/                           # Expo Router app directory
│   ├── (tabs)/                   # Bottom tabs navigation
│   │   ├── index.tsx             # Home tab
│   │   ├── inventory.tsx         # Inventory tab
│   │   ├── listings.tsx          # Listings tab
│   │   ├── analytics.tsx         # Analytics tab
│   │   └── profile.tsx           # Profile tab
│   ├── (auth)/                   # Auth screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── _layout.tsx               # Root layout
│   └── +not-found.tsx           # 404 screen
├── components/                    # React Native components
│   ├── ThemedText.tsx
│   ├── ThemedView.tsx
│   └── ... (UI components)
├── lib/                           # Mobile utilities
│   ├── supabase.ts               # Supabase client
│   └── storage.ts                # AsyncStorage utilities
├── android/                       # Android native code
├── ios/                           # iOS native code
├── app.json                       # Expo configuration
├── eas.json                       # EAS Build configuration
├── package.json
└── tsconfig.json

**Deploy Target**: App Stores (via EAS Build)
**Build Command**: `eas build --platform all`
```

### ⚙️ Worker Layer (Azure Functions Deployment)

#### `/apps/worker-autosell/` - Auto-Sell Worker
```
apps/worker-autosell/
├── autosell/
│   ├── function.json             # Timer trigger config (every 3 min)
│   └── index.ts                  # Worker handler
├── host.json                      # Azure Functions config
├── package.json                   # Dependencies
├── tsconfig.json                 # TypeScript config
└── .funcignore                   # Files to exclude from deployment

**Deploy Target**: Azure Functions
**Runtime**: Node 20
**Trigger**: Timer (0 */3 * * * *) - Every 3 minutes
**Purpose**: Detect sales, finalize P&L, lock listings
```

#### `/apps/worker-tracker/` - Shipment Tracker Worker
```
apps/worker-tracker/
├── tracker/
│   ├── function.json             # Timer trigger config (every 10 min)
│   └── index.ts                  # Worker handler
├── host.json
├── package.json
├── tsconfig.json
└── .funcignore

**Deploy Target**: Azure Functions
**Runtime**: Node 20
**Trigger**: Timer (0 */10 * * * *) - Every 10 minutes
**Purpose**: Update shipment tracking status
```

#### `/apps/worker-scraper/` - Marketplace Scraper Worker
```
apps/worker-scraper/
├── scraper/
│   ├── function.json             # Timer trigger config (every 6 hrs)
│   └── index.ts                  # Worker handler
├── host.json
├── package.json
├── tsconfig.json
└── .funcignore

**Deploy Target**: Azure Functions
**Runtime**: Node 20
**Trigger**: Timer (0 0 */6 * * *) - Every 6 hours
**Purpose**: Scrape all marketplaces, ingest listings
**Note**: Requires Playwright browsers installed
```

### 📦 Packages Layer (Shared Libraries)

#### `/packages/profit-engine/` - Profit Tracking
```
packages/profit-engine/
├── autosell/
│   ├── saleDetector.ts           # Detect sales across marketplaces
│   ├── crossPlatformLock.ts      # Prevent double-sells
│   └── finalizeSale.ts           # Calculate P&L
├── ledger/
│   ├── feeModel.ts               # Marketplace fee calculations
│   ├── profitLedger.ts           # Ledger management
│   ├── evCorrector.ts            # Bayesian EV correction
│   └── portfolioEngine.ts        # Portfolio analytics
├── schemas/
│   └── SaleEvent.ts              # Zod schemas
├── index.ts                       # Package exports
├── package.json
└── tsconfig.json

**Imported By**: apps/worker-autosell, apps/web
**Purpose**: Profit tracking, P&L, ledger, analytics
```

#### `/packages/shipping-engine/` - Shipping & Fulfillment
```
packages/shipping-engine/
├── carrier/
│   ├── selectCarrier.ts          # Intelligent carrier selection
│   ├── rateCalculator.ts         # Rate estimation
│   ├── carrierClient_USPS.ts    # USPS API integration
│   ├── carrierClient_UPS.ts     # UPS integration
│   ├── carrierClient_FedEx.ts   # FedEx integration
│   └── carrierClient_Generic.ts # Fallback
├── label/
│   ├── labelGenerator.ts         # Label generation
│   └── labelStorage.ts           # Supabase Storage
├── tracking/
│   └── trackingManager.ts        # Tracking updates
├── workflow/
│   ├── packagingAdvisor.ts       # Packaging recommendations
│   └── fulfillmentOrchestrator.ts # Fulfillment workflow
├── schemas/
│   └── ShippingRequest.ts        # Zod schemas
├── index.ts
├── package.json
└── tsconfig.json

**Imported By**: apps/worker-tracker, apps/web
**Purpose**: Label generation, tracking, fulfillment
```

#### `/packages/scraper-sync/` - Marketplace Scrapers
```
packages/scraper-sync/
├── scrapers/
│   ├── facebookMarketplace.ts    # FB scraper (Playwright)
│   ├── craigslist.ts             # CL scraper (Playwright)
│   ├── ebay.ts                   # eBay scraper (Playwright)
│   ├── vinted.ts                 # Vinted scraper (API)
│   ├── depop.ts                  # Depop scraper (Playwright)
│   └── gumtree.ts                # Gumtree scraper (Playwright)
├── normalization/
│   └── normalizer.ts             # Data normalization
├── ingestion/
│   └── pipeline.ts               # Supabase ingestion
├── telemetry/
│   └── monitor.ts                # Health monitoring
├── orchestrator/
│   └── scraperOrchestrator.ts    # Scraper management
├── utils/
│   └── browserManager.ts         # Browser automation + anti-bot
├── types/
│   └── ScrapedListing.ts         # Unified schema
├── index.ts
├── package.json
└── tsconfig.json

**Imported By**: apps/worker-scraper, apps/web
**Purpose**: Live marketplace scraping with anti-bot
**Dependencies**: playwright, playwright-extra, p-queue
```

#### `/packages/agentic-engine/` - Auto-Buyer + Auto-Lister (WIP)
```
packages/agentic-engine/
├── auto-buyer/                    # Auto-buyer logic (planned)
├── auto-lister/                   # Auto-lister logic (planned)
├── safety/                        # Risk scoring (planned)
├── queue/                         # Queue management (planned)
├── types/
│   └── AgenticTypes.ts           # Type definitions ✅
├── index.ts
├── package.json
└── tsconfig.json

**Status**: Types defined, implementation pending
**Purpose**: Automated buying and listing
```

### 🗄️ Database Layer (Supabase)

#### `/supabase/migrations/` - Database Schema
```
supabase/migrations/
├── 0012_profit_engine_tables.sql         # Phase 12: Profit & Ledger
├── 0013_shipping_engine_tables.sql       # Phase 13: Shipping & Fulfillment
├── 0014_scraper_sync_tables.sql          # Phase 14: Scraper Sync
├── 20251130_marketplace_listings.sql      # Marketplace listings
├── 20251130_expand_marketplace_support.sql
├── 20251130_marketplace_analytics.sql     # Analytics enhancements
├── 20251130_analytics_enhancements.sql
├── 20251130_alert_system.sql              # Alert system
├── 0001_subscriptions.sql                 # User subscriptions
├── 0002_admin_tables.sql                  # Admin functionality
└── 0003_worker_tables.sql                 # Worker logs

**Run Order**: Sequential (0001 → 0014 → 20251130_*)
**Deploy**: `supabase migration up`
```

#### `/supabase/functions/` - Edge Functions (Deno)
```
supabase/functions/
├── webhook-stripe/
│   └── index.ts                   # Stripe payment webhooks
└── webhook-shipment/
    └── index.ts                   # Carrier tracking webhooks

**Runtime**: Deno
**Deploy**: `supabase functions deploy webhook-stripe`
**Environment**: Supabase Secrets
```

### 📚 Documentation Layer

```
docs/
├── PRODUCTION_READINESS.md              # Current status (85% ready)
├── ENVIRONMENT_VARIABLES_COMPLETE.md    # All env vars ✅
├── COMPLETE_FILE_MAP.md                 # This file ✅
├── SCRAPER_DEPLOYMENT.md                # Scraper guide ✅
├── DEPLOYMENT_BUNDLES.md                # Deployment configs
├── FILE_PLACEMENT_MAP.md                # Previous map
└── ... (30+ docs)
```

## Package Dependencies Graph

```
apps/web
├── @magnus-flipper-ai/profit-engine
├── @magnus-flipper-ai/shipping-engine
├── @magnus-flipper-ai/scraper-sync
├── @magnus-flipper-ai/types
├── @magnus-flipper-ai/ui
└── @supabase/supabase-js

apps/worker-autosell
├── @magnus-flipper-ai/profit-engine
└── @supabase/supabase-js

apps/worker-tracker
├── @magnus-flipper-ai/shipping-engine
└── @supabase/supabase-js

apps/worker-scraper
├── @magnus-flipper-ai/scraper-sync
└── @supabase/supabase-js

packages/profit-engine
├── @supabase/supabase-js
├── axios
└── zod

packages/shipping-engine
├── @supabase/supabase-js
├── axios
└── zod

packages/scraper-sync
├── playwright
├── playwright-extra
├── puppeteer-extra-plugin-stealth
├── @supabase/supabase-js
├── p-queue
├── p-retry
├── cheerio
└── zod
```

## Build Order

1. **Shared Packages** (parallel)
   - `packages/types`
   - `packages/schemas`
   - `packages/utils`
   - `packages/core`

2. **Engine Packages** (parallel)
   - `packages/profit-engine`
   - `packages/shipping-engine`
   - `packages/scraper-sync`
   - `packages/deal-engine`
   - `packages/agentic-engine`

3. **Applications** (parallel)
   - `apps/web`
   - `apps/mobile`
   - `apps/worker-autosell`
   - `apps/worker-tracker`
   - `apps/worker-scraper`

**Build Command**: `pnpm build` (runs in topological order via workspace)

## Import Path Examples

```typescript
// From apps/web
import { calculatePnL } from '@magnus-flipper-ai/profit-engine/ledger/profitLedger';
import { generateShippingLabel } from '@magnus-flipper-ai/shipping-engine/label/labelGenerator';
import { ScraperOrchestrator } from '@magnus-flipper-ai/scraper-sync/orchestrator/scraperOrchestrator';

// From worker
import { detectSales } from '@magnus-flipper-ai/profit-engine/autosell/saleDetector';
import { trackShipment } from '@magnus-flipper-ai/shipping-engine/tracking/trackingManager';

// From packages (internal)
import type { ScrapedListing } from '../types/ScrapedListing';
import { BrowserManager } from '../utils/browserManager';
```

## Configuration Files

```
/
├── package.json                   # Root workspace config
├── pnpm-workspace.yaml            # Workspace definition
├── tsconfig.base.json             # Base TypeScript config
├── turbo.json                     # Turborepo config
├── .gitignore                     # Git ignore patterns
├── .env.example                   # Environment template
└── .prettierrc                    # Code formatting

apps/web/
├── next.config.ts                 # Next.js config
├── tailwind.config.ts             # Tailwind CSS v4
├── tsconfig.json                  # Web app TS config
├── .eslintrc.json                 # ESLint config
└── vercel.json                    # Vercel deployment config

apps/worker-*/
├── host.json                      # Azure Functions config
├── tsconfig.json                  # Worker TS config
└── local.settings.json            # Local development settings

supabase/
├── config.toml                    # Supabase config
└── .env                           # Supabase CLI env
```

## Deployment Targets

| Component | Platform | Trigger | URL |
|-----------|----------|---------|-----|
| Web App | Vercel | Git push | https://flipperagents.com |
| API Routes | Vercel | Git push | https://flipperagents.com/api/* |
| Mobile App | App Stores | EAS Build | App Store / Play Store |
| Worker: Auto-Sell | Azure Functions | Timer: 3min | Internal |
| Worker: Tracker | Azure Functions | Timer: 10min | Internal |
| Worker: Scraper | Azure Functions | Timer: 6hrs | Internal |
| Edge: Stripe Webhook | Supabase | HTTP POST | https://xyz.supabase.co/functions/v1/webhook-stripe |
| Edge: Shipment Webhook | Supabase | HTTP POST | https://xyz.supabase.co/functions/v1/webhook-shipment |
| Database | Supabase | N/A | Internal connection |

## File Count Summary

- **Total Packages**: 14
- **Total Apps**: 7 (3 active workers + web + mobile)
- **Database Migrations**: 14
- **Edge Functions**: 2
- **API Routes**: ~20
- **React Components**: ~50
- **Documentation Files**: ~35
- **Configuration Files**: ~25

## Critical Files for Production

**Must Have for Deploy**:
1. `.env.local` (all environments set)
2. `supabase/migrations/*.sql` (all run)
3. `apps/web/next.config.ts` (production optimized)
4. `apps/worker-*/host.json` (timeouts configured)
5. `vercel.json` (routes and env configured)

**Must Not Commit**:
1. `.env` / `.env.local`
2. `local.settings.json`
3. `node_modules/`
4. `.next/`
5. `dist/`

## Quick Reference Commands

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Run Next.js dev
cd apps/web && pnpm dev

# Run worker locally
cd apps/worker-scraper && func start

# Deploy Vercel
cd apps/web && vercel --prod

# Deploy Azure Functions
cd apps/worker-scraper && func azure functionapp publish worker-scraper

# Run migrations
cd supabase && supabase migration up

# Deploy edge functions
cd supabase/functions && supabase functions deploy webhook-stripe
```
