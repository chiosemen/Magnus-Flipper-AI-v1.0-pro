# Magnus Flipper AI - Complete File Placement Map

**Exact folder structure and file locations for all components**

---

## 📂 Complete Directory Tree

```
Magnus-Flipper-AI-v1.0-pro-reset/
│
├── apps/                                    # Application deployments
│   ├── web/                                 # Next.js 16 Frontend (Vercel)
│   │   ├── app/                             # App Router (Next.js 16)
│   │   │   ├── (auth)/                      # Auth routes group
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx             # Login page
│   │   │   │   ├── register/
│   │   │   │   │   └── page.tsx             # Registration page
│   │   │   │   └── layout.tsx               # Auth layout
│   │   │   │
│   │   │   ├── (protected)/                 # Protected routes (require auth)
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx             # Main dashboard
│   │   │   │   │
│   │   │   │   ├── inventory/               # Inventory management
│   │   │   │   │   ├── page.tsx             # Inventory list
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx         # Item details
│   │   │   │   │   └── add/
│   │   │   │   │       └── page.tsx         # Add new item
│   │   │   │   │
│   │   │   │   ├── deals/                   # Deal evaluation
│   │   │   │   │   ├── page.tsx             # Deal queue
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx         # Deal details
│   │   │   │   │   └── evaluate/
│   │   │   │   │       └── page.tsx         # Manual evaluation
│   │   │   │   │
│   │   │   │   ├── profit/                  # Profit tracking (Phase 12)
│   │   │   │   │   ├── page.tsx             # P&L dashboard
│   │   │   │   │   ├── ledger/
│   │   │   │   │   │   └── page.tsx         # Ledger entries
│   │   │   │   │   ├── portfolio/
│   │   │   │   │   │   └── page.tsx         # Portfolio analytics
│   │   │   │   │   └── accuracy/
│   │   │   │   │       └── page.tsx         # EV accuracy metrics
│   │   │   │   │
│   │   │   │   ├── shipping/                # Shipping management (Phase 13)
│   │   │   │   │   ├── page.tsx             # Shipping dashboard
│   │   │   │   │   ├── labels/
│   │   │   │   │   │   ├── page.tsx         # Label history
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx     # Label details
│   │   │   │   │   ├── tracking/
│   │   │   │   │   │   └── [trackingNumber]/
│   │   │   │   │   │       └── page.tsx     # Tracking page
│   │   │   │   │   └── fulfillment/
│   │   │   │   │       └── page.tsx         # Fulfillment workflows
│   │   │   │   │
│   │   │   │   ├── marketplace/             # Marketplace sync
│   │   │   │   │   ├── page.tsx             # Marketplace overview
│   │   │   │   │   ├── sync/
│   │   │   │   │   │   └── page.tsx         # Sync status
│   │   │   │   │   └── credentials/
│   │   │   │   │       └── page.tsx         # API credentials
│   │   │   │   │
│   │   │   │   ├── settings/                # User settings
│   │   │   │   │   ├── page.tsx             # General settings
│   │   │   │   │   ├── subscription/
│   │   │   │   │   │   └── page.tsx         # Subscription management
│   │   │   │   │   ├── billing/
│   │   │   │   │   │   └── page.tsx         # Billing history
│   │   │   │   │   └── api-keys/
│   │   │   │   │       └── page.tsx         # Carrier/marketplace keys
│   │   │   │   │
│   │   │   │   └── layout.tsx               # Protected layout (sidebar, nav)
│   │   │   │
│   │   │   ├── api/                         # API routes (server-side)
│   │   │   │   ├── auth/
│   │   │   │   │   └── [...nextauth]/
│   │   │   │   │       └── route.ts         # NextAuth handler
│   │   │   │   │
│   │   │   │   ├── deals/
│   │   │   │   │   ├── evaluate/
│   │   │   │   │   │   └── route.ts         # POST /api/deals/evaluate
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── route.ts         # GET /api/deals/[id]
│   │   │   │   │   └── route.ts             # GET /api/deals
│   │   │   │   │
│   │   │   │   ├── profit/
│   │   │   │   │   ├── summary/
│   │   │   │   │   │   └── route.ts         # GET /api/profit/summary
│   │   │   │   │   ├── trend/
│   │   │   │   │   │   └── route.ts         # GET /api/profit/trend
│   │   │   │   │   └── portfolio/
│   │   │   │   │       └── route.ts         # GET /api/profit/portfolio
│   │   │   │   │
│   │   │   │   ├── shipping/
│   │   │   │   │   ├── label/
│   │   │   │   │   │   └── route.ts         # POST /api/shipping/label
│   │   │   │   │   ├── track/
│   │   │   │   │   │   └── [trackingNumber]/
│   │   │   │   │   │       └── route.ts     # GET /api/shipping/track/[number]
│   │   │   │   │   └── carriers/
│   │   │   │   │       └── route.ts         # GET /api/shipping/carriers
│   │   │   │   │
│   │   │   │   ├── webhooks/
│   │   │   │   │   ├── stripe/
│   │   │   │   │   │   └── route.ts         # POST /api/webhooks/stripe
│   │   │   │   │   ├── shipment/
│   │   │   │   │   │   └── route.ts         # POST /api/webhooks/shipment
│   │   │   │   │   └── marketplace/
│   │   │   │   │       └── route.ts         # POST /api/webhooks/marketplace
│   │   │   │   │
│   │   │   │   └── trpc/
│   │   │   │       └── [trpc]/
│   │   │   │           └── route.ts         # tRPC handler
│   │   │   │
│   │   │   ├── layout.tsx                   # Root layout
│   │   │   ├── page.tsx                     # Homepage
│   │   │   └── globals.css                  # Tailwind CSS v4
│   │   │
│   │   ├── components/                      # React components
│   │   │   ├── ui/                          # shadcn/ui components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── deals/                       # Deal components
│   │   │   │   ├── DealScoreCard.tsx
│   │   │   │   ├── DealBreakdown.tsx
│   │   │   │   ├── DealQueue.tsx
│   │   │   │   └── EvaluationForm.tsx
│   │   │   │
│   │   │   ├── profit/                      # Profit components (Phase 12)
│   │   │   │   ├── PnLSummaryCard.tsx
│   │   │   │   ├── ProfitChart.tsx
│   │   │   │   ├── PortfolioOverview.tsx
│   │   │   │   └── EVAccuracyMetrics.tsx
│   │   │   │
│   │   │   ├── shipping/                    # Shipping components (Phase 13)
│   │   │   │   ├── ShippingLabelCard.tsx
│   │   │   │   ├── TrackingTimeline.tsx
│   │   │   │   ├── CarrierSelector.tsx
│   │   │   │   ├── PackagingInstructions.tsx
│   │   │   │   └── FulfillmentStatus.tsx
│   │   │   │
│   │   │   ├── inventory/
│   │   │   │   ├── InventoryTable.tsx
│   │   │   │   ├── ItemCard.tsx
│   │   │   │   └── AddItemForm.tsx
│   │   │   │
│   │   │   └── layout/
│   │   │       ├── Sidebar.tsx
│   │   │       ├── Header.tsx
│   │   │       └── Footer.tsx
│   │   │
│   │   ├── lib/                             # Utility libraries
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts                # Supabase client (browser)
│   │   │   │   └── server.ts                # Supabase client (server)
│   │   │   │
│   │   │   ├── trpc/
│   │   │   │   ├── client.ts
│   │   │   │   └── server.ts
│   │   │   │
│   │   │   ├── utils.ts                     # cn() and utilities
│   │   │   └── constants.ts
│   │   │
│   │   ├── public/                          # Static assets
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── favicon.ico
│   │   │
│   │   ├── package.json
│   │   ├── next.config.mjs
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── .env.local
│   │
│   ├── worker-evaluator/                    # Azure Function: Deal Evaluator
│   │   ├── evaluator/
│   │   │   ├── function.json                # Timer trigger config
│   │   │   └── index.ts                     # Main handler
│   │   │
│   │   ├── package.json
│   │   ├── host.json                        # Azure Functions host config
│   │   ├── local.settings.json              # Local environment
│   │   └── tsconfig.json
│   │
│   ├── worker-sync/                         # Azure Function: Scraper Sync
│   │   ├── sync/
│   │   │   ├── function.json
│   │   │   └── index.ts                     # Sync orchestrator
│   │   │
│   │   ├── package.json
│   │   ├── host.json
│   │   ├── local.settings.json
│   │   └── tsconfig.json
│   │
│   ├── worker-autosell/                     # Azure Function: Auto-Sell
│   │   ├── autosell/
│   │   │   ├── function.json
│   │   │   └── index.ts                     # Sale detection handler
│   │   │
│   │   ├── package.json
│   │   ├── host.json
│   │   ├── local.settings.json
│   │   └── tsconfig.json
│   │
│   └── worker-tracker/                      # Azure Function: Shipment Tracker
│       ├── tracker/
│       │   ├── function.json
│       │   └── index.ts                     # Tracking poller
│       │
│       ├── package.json
│       ├── host.json
│       ├── local.settings.json
│       └── tsconfig.json
│
├── packages/                                # Shared packages (monorepo)
│   ├── deal-engine/                         # Phase 9: AI Deal Classifier
│   │   ├── types/
│   │   │   ├── Listing.ts                   # Listing types
│   │   │   └── DealScore.ts                 # Score types
│   │   │
│   │   ├── scoring/
│   │   │   ├── baseScore.ts                 # Baseline calculator
│   │   │   ├── deepseekClassifier.ts        # DeepSeek R1 integration
│   │   │   ├── openaiClassifier.ts          # OpenAI fallback
│   │   │   └── compositeScore.ts            # Weighted combiner
│   │   │
│   │   ├── calibrator/                      # Phase 9.5: Calibration
│   │   │   ├── bayesian.ts                  # Bayesian posterior
│   │   │   ├── llmConsensus.ts              # Multi-model consensus
│   │   │   └── calibrate.ts                 # Calibration orchestrator
│   │   │
│   │   ├── config.ts                        # Configuration
│   │   ├── index.ts                         # Public API
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── arb-engine/                          # Phase 10: Arbitrage Engine
│   │   ├── oddsModel.ts                     # Betfair-style odds
│   │   ├── evCalculator.ts                  # Expected value
│   │   ├── arbitrageDetector.ts             # Opportunity flagging
│   │   ├── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── scraper-sync/                        # Phase 11: Marketplace Sync
│   │   ├── fingerprint/
│   │   │   ├── deterministic.ts             # SHA-256 fingerprinting
│   │   │   └── fuzzy.ts                     # Fuzzy matching
│   │   │
│   │   ├── clients/                         # Marketplace clients
│   │   │   ├── offerupClient.ts
│   │   │   ├── craigslistClient.ts
│   │   │   ├── ebayClient.ts
│   │   │   ├── vintedClient.ts
│   │   │   ├── facebookClient.ts
│   │   │   └── gumtreeClient.ts
│   │   │
│   │   ├── normalizers/                     # Data normalizers
│   │   │   ├── offerupNormalizer.ts
│   │   │   ├── craigslistNormalizer.ts
│   │   │   ├── ebayNormalizer.ts
│   │   │   ├── vintedNormalizer.ts
│   │   │   ├── facebookNormalizer.ts
│   │   │   └── gumtreeNormalizer.ts
│   │   │
│   │   ├── dedupe/
│   │   │   └── dedupeEngine.ts              # Deduplication logic
│   │   │
│   │   ├── syncOrchestrator.ts              # Main sync coordinator
│   │   ├── types.ts                         # Sync types
│   │   ├── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── agentic-engine/                      # Phase Omega: Agentic Agents
│   │   ├── agents/
│   │   │   ├── dealEvaluator.ts             # Agent A
│   │   │   ├── autoBuyer.ts                 # Agent B
│   │   │   ├── autoLister.ts                # Agent C
│   │   │   └── inventoryController.ts       # Agent D
│   │   │
│   │   ├── logic/
│   │   │   ├── decisionGraph.ts
│   │   │   ├── negotiationPlaybook.ts
│   │   │   ├── listingGenerator.ts
│   │   │   └── pricingEngine.ts
│   │   │
│   │   ├── actions/
│   │   │   ├── marketplaceActions.ts
│   │   │   └── communicationActions.ts
│   │   │
│   │   ├── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── profit-engine/                       # Phase 12: Profit Ledger
│   │   ├── autosell/
│   │   │   ├── saleDetector.ts              # Sale detection
│   │   │   ├── crossPlatformLock.ts         # Platform locking
│   │   │   └── finalizeSale.ts              # P&L finalization
│   │   │
│   │   ├── ledger/
│   │   │   ├── feeModel.ts                  # Fee calculations
│   │   │   ├── profitLedger.ts              # P&L tracking
│   │   │   ├── evCorrector.ts               # EV learning loop
│   │   │   └── portfolioEngine.ts           # Portfolio analytics
│   │   │
│   │   ├── schemas/
│   │   │   └── SaleEvent.ts                 # Types
│   │   │
│   │   ├── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shipping-engine/                     # Phase 13: Shipping & Fulfillment
│       ├── carrier/
│       │   ├── selectCarrier.ts             # Carrier selection
│       │   ├── rateCalculator.ts            # Rate estimation
│       │   ├── carrierClient_USPS.ts        # USPS integration
│       │   ├── carrierClient_UPS.ts         # UPS integration
│       │   ├── carrierClient_FedEx.ts       # FedEx integration
│       │   └── carrierClient_Generic.ts     # Fallback
│       │
│       ├── label/
│       │   ├── labelGenerator.ts            # Label generation
│       │   └── labelStorage.ts              # Supabase Storage
│       │
│       ├── tracking/
│       │   ├── trackingManager.ts           # Tracking updates
│       │   ├── webhookHandler.ts            # Carrier webhooks
│       │   └── trackingPoller.ts            # Polling logic
│       │
│       ├── workflow/
│       │   ├── packagingAdvisor.ts          # Packaging recommendations
│       │   ├── fulfillmentOrchestrator.ts   # Workflow management
│       │   ├── pickupScheduler.ts           # Pickup scheduling
│       │   └── exceptionRouter.ts           # Exception handling
│       │
│       ├── schemas/
│       │   └── ShippingRequest.ts           # Types
│       │
│       ├── utils/
│       │   ├── addressValidator.ts
│       │   ├── packagingRules.ts
│       │   ├── pricingUtils.ts
│       │   └── timeUtils.ts
│       │
│       ├── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── supabase/                                # Supabase configuration
│   ├── functions/                           # Edge Functions (Deno)
│   │   ├── scraper-offerup/
│   │   │   └── index.ts                     # OfferUp scraper
│   │   │
│   │   ├── scraper-craigslist/
│   │   │   └── index.ts                     # Craigslist scraper
│   │   │
│   │   ├── scraper-ebay/
│   │   │   └── index.ts                     # eBay scraper
│   │   │
│   │   ├── webhook-stripe/
│   │   │   └── index.ts                     # Stripe webhooks
│   │   │
│   │   ├── webhook-shipment/
│   │   │   └── index.ts                     # Carrier webhooks
│   │   │
│   │   └── .env                             # Edge function secrets
│   │
│   ├── migrations/                          # Database migrations
│   │   ├── 0001_initial_schema.sql
│   │   ├── 0002_auth_setup.sql
│   │   ├── 0003_inventory_tables.sql
│   │   ├── 0004_deal_scores.sql
│   │   ├── 0005_marketplace_sync.sql
│   │   ├── 0006_arbitrage_tables.sql
│   │   ├── 0007_sync_tables.sql
│   │   ├── 0008_agentic_tables.sql
│   │   ├── 0009_saved_searches.sql
│   │   ├── 0010_alerts_system.sql
│   │   ├── 0011_analytics_tables.sql
│   │   ├── 0012_profit_engine_tables.sql    # Phase 12
│   │   └── 0013_shipping_engine_tables.sql  # Phase 13
│   │
│   ├── seed.sql                             # Seed data
│   ├── config.toml                          # Supabase config
│   └── .env                                 # Local Supabase env
│
├── infrastructure/                          # Infrastructure as Code
│   ├── azure/
│   │   ├── bicep/
│   │   │   ├── main.bicep                   # Main deployment
│   │   │   ├── function-apps.bicep          # Function Apps
│   │   │   ├── storage.bicep                # Storage accounts
│   │   │   ├── app-insights.bicep           # Application Insights
│   │   │   └── networking.bicep             # VNETs, subnets
│   │   │
│   │   ├── terraform/                       # Alternative: Terraform
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   │
│   │   └── pipelines/
│   │       ├── ci-build.yml                 # CI pipeline
│   │       └── cd-deploy.yml                # CD pipeline
│   │
│   └── vercel/
│       └── vercel.json                      # Vercel config
│
├── docs/                                    # Documentation
│   ├── DEPLOYMENT.md                        # Deployment guide
│   ├── DNS_SETUP.md                         # DNS configuration
│   ├── ENVIRONMENT_VARIABLES.md             # Env var matrix
│   ├── FILE_PLACEMENT_MAP.md                # This file
│   ├── PHASE_9_STATUS.md                    # Phase 9 docs
│   ├── PHASE_9_5_COMPLETE.md                # Phase 9.5 docs
│   ├── PHASE_10_ARCHITECTURE.md             # Phase 10 docs
│   ├── PHASE_11_IMPLEMENTATION.md           # Phase 11 docs
│   ├── PHASE_OMEGA_ARCHITECTURE.md          # Phase Omega docs
│   ├── PHASE_12_COMPLETE_ARCHITECTURE.md    # Phase 12 docs
│   ├── PHASE_12_STATUS.md                   # Phase 12 status
│   ├── COMPLETE_IMPLEMENTATION_STATUS.md    # Overall status
│   └── API_REFERENCE.md                     # API documentation
│
├── .github/
│   └── workflows/
│       ├── ci.yml                           # GitHub Actions CI
│       ├── deploy-vercel.yml                # Vercel deployment
│       └── deploy-azure.yml                 # Azure deployment
│
├── package.json                             # Root package.json
├── pnpm-workspace.yaml                      # PNPM workspace config
├── turbo.json                               # Turborepo config
├── .gitignore
├── .env.example
└── README.md
```

---

## 🎯 Exact File Placement Instructions

### Phase 9: AI Deal Classifier

**Package Location:** `packages/deal-engine/`

| File | Exact Path |
|------|------------|
| Type definitions | `packages/deal-engine/types/Listing.ts` |
| Type definitions | `packages/deal-engine/types/DealScore.ts` |
| Baseline scorer | `packages/deal-engine/scoring/baseScore.ts` |
| DeepSeek classifier | `packages/deal-engine/scoring/deepseekClassifier.ts` |
| OpenAI classifier | `packages/deal-engine/scoring/openaiClassifier.ts` |
| Composite scorer | `packages/deal-engine/scoring/compositeScore.ts` |
| Bayesian calibration | `packages/deal-engine/calibrator/bayesian.ts` |
| LLM consensus | `packages/deal-engine/calibrator/llmConsensus.ts` |
| Calibrator | `packages/deal-engine/calibrator/calibrate.ts` |
| Configuration | `packages/deal-engine/config.ts` |
| Public API | `packages/deal-engine/index.ts` |

**Worker Location:** `apps/worker-evaluator/`

| File | Exact Path |
|------|------------|
| Timer trigger config | `apps/worker-evaluator/evaluator/function.json` |
| Main handler | `apps/worker-evaluator/evaluator/index.ts` |
| Package config | `apps/worker-evaluator/package.json` |
| Azure Functions host | `apps/worker-evaluator/host.json` |

**Frontend Location:** `apps/web/`

| File | Exact Path |
|------|------------|
| Deal queue page | `apps/web/app/(protected)/deals/page.tsx` |
| Deal details page | `apps/web/app/(protected)/deals/[id]/page.tsx` |
| Evaluation API | `apps/web/app/api/deals/evaluate/route.ts` |
| Deal score card | `apps/web/components/deals/DealScoreCard.tsx` |
| Deal breakdown | `apps/web/components/deals/DealBreakdown.tsx` |

---

### Phase 10: Arbitrage Engine

**Package Location:** `packages/arb-engine/`

| File | Exact Path |
|------|------------|
| Odds model | `packages/arb-engine/oddsModel.ts` |
| EV calculator | `packages/arb-engine/evCalculator.ts` |
| Arbitrage detector | `packages/arb-engine/arbitrageDetector.ts` |
| Public API | `packages/arb-engine/index.ts` |

---

### Phase 11: Scraper Sync

**Package Location:** `packages/scraper-sync/`

| File | Exact Path |
|------|------------|
| Deterministic fingerprint | `packages/scraper-sync/fingerprint/deterministic.ts` |
| Fuzzy fingerprint | `packages/scraper-sync/fingerprint/fuzzy.ts` |
| OfferUp client | `packages/scraper-sync/clients/offerupClient.ts` |
| Craigslist client | `packages/scraper-sync/clients/craigslistClient.ts` |
| eBay client | `packages/scraper-sync/clients/ebayClient.ts` |
| Vinted client | `packages/scraper-sync/clients/vintedClient.ts` |
| Facebook client | `packages/scraper-sync/clients/facebookClient.ts` |
| Gumtree client | `packages/scraper-sync/clients/gumtreeClient.ts` |
| OfferUp normalizer | `packages/scraper-sync/normalizers/offerupNormalizer.ts` |
| Craigslist normalizer | `packages/scraper-sync/normalizers/craigslistNormalizer.ts` |
| eBay normalizer | `packages/scraper-sync/normalizers/ebayNormalizer.ts` |
| Vinted normalizer | `packages/scraper-sync/normalizers/vintedNormalizer.ts` |
| Facebook normalizer | `packages/scraper-sync/normalizers/facebookNormalizer.ts` |
| Gumtree normalizer | `packages/scraper-sync/normalizers/gumtreeNormalizer.ts` |
| Dedupe engine | `packages/scraper-sync/dedupe/dedupeEngine.ts` |
| Sync orchestrator | `packages/scraper-sync/syncOrchestrator.ts` |

**Worker Location:** `apps/worker-sync/`

| File | Exact Path |
|------|------------|
| Sync trigger | `apps/worker-sync/sync/function.json` |
| Sync handler | `apps/worker-sync/sync/index.ts` |

**Supabase Edge Functions:** `supabase/functions/`

| File | Exact Path |
|------|------------|
| OfferUp scraper | `supabase/functions/scraper-offerup/index.ts` |
| Craigslist scraper | `supabase/functions/scraper-craigslist/index.ts` |
| eBay scraper | `supabase/functions/scraper-ebay/index.ts` |

---

### Phase 12: Profit Ledger

**Package Location:** `packages/profit-engine/`

| File | Exact Path |
|------|------------|
| Sale detector | `packages/profit-engine/autosell/saleDetector.ts` |
| Platform lock | `packages/profit-engine/autosell/crossPlatformLock.ts` |
| Sale finalization | `packages/profit-engine/autosell/finalizeSale.ts` |
| Fee model | `packages/profit-engine/ledger/feeModel.ts` |
| Profit ledger | `packages/profit-engine/ledger/profitLedger.ts` |
| EV corrector | `packages/profit-engine/ledger/evCorrector.ts` |
| Portfolio engine | `packages/profit-engine/ledger/portfolioEngine.ts` |
| Sale event types | `packages/profit-engine/schemas/SaleEvent.ts` |
| Public API | `packages/profit-engine/index.ts` |

**Worker Location:** `apps/worker-autosell/`

| File | Exact Path |
|------|------------|
| Auto-sell trigger | `apps/worker-autosell/autosell/function.json` |
| Auto-sell handler | `apps/worker-autosell/autosell/index.ts` |

**Frontend Location:** `apps/web/`

| File | Exact Path |
|------|------------|
| P&L dashboard | `apps/web/app/(protected)/profit/page.tsx` |
| Ledger page | `apps/web/app/(protected)/profit/ledger/page.tsx` |
| Portfolio page | `apps/web/app/(protected)/profit/portfolio/page.tsx` |
| Accuracy page | `apps/web/app/(protected)/profit/accuracy/page.tsx` |
| P&L API | `apps/web/app/api/profit/summary/route.ts` |
| Trend API | `apps/web/app/api/profit/trend/route.ts` |
| Portfolio API | `apps/web/app/api/profit/portfolio/route.ts` |
| P&L summary card | `apps/web/components/profit/PnLSummaryCard.tsx` |
| Profit chart | `apps/web/components/profit/ProfitChart.tsx` |

**Database Migration:**

| File | Exact Path |
|------|------------|
| Profit tables | `supabase/migrations/0012_profit_engine_tables.sql` |

---

### Phase 13: Shipping Engine

**Package Location:** `packages/shipping-engine/`

| File | Exact Path |
|------|------------|
| Carrier selector | `packages/shipping-engine/carrier/selectCarrier.ts` |
| Rate calculator | `packages/shipping-engine/carrier/rateCalculator.ts` |
| USPS client | `packages/shipping-engine/carrier/carrierClient_USPS.ts` |
| UPS client | `packages/shipping-engine/carrier/carrierClient_UPS.ts` |
| FedEx client | `packages/shipping-engine/carrier/carrierClient_FedEx.ts` |
| Generic client | `packages/shipping-engine/carrier/carrierClient_Generic.ts` |
| Label generator | `packages/shipping-engine/label/labelGenerator.ts` |
| Label storage | `packages/shipping-engine/label/labelStorage.ts` |
| Tracking manager | `packages/shipping-engine/tracking/trackingManager.ts` |
| Webhook handler | `packages/shipping-engine/tracking/webhookHandler.ts` |
| Tracking poller | `packages/shipping-engine/tracking/trackingPoller.ts` |
| Packaging advisor | `packages/shipping-engine/workflow/packagingAdvisor.ts` |
| Fulfillment orchestrator | `packages/shipping-engine/workflow/fulfillmentOrchestrator.ts` |
| Pickup scheduler | `packages/shipping-engine/workflow/pickupScheduler.ts` |
| Exception router | `packages/shipping-engine/workflow/exceptionRouter.ts` |
| Shipping types | `packages/shipping-engine/schemas/ShippingRequest.ts` |
| Public API | `packages/shipping-engine/index.ts` |

**Worker Location:** `apps/worker-tracker/`

| File | Exact Path |
|------|------------|
| Tracker trigger | `apps/worker-tracker/tracker/function.json` |
| Tracker handler | `apps/worker-tracker/tracker/index.ts` |

**Frontend Location:** `apps/web/`

| File | Exact Path |
|------|------------|
| Shipping dashboard | `apps/web/app/(protected)/shipping/page.tsx` |
| Label history | `apps/web/app/(protected)/shipping/labels/page.tsx` |
| Label details | `apps/web/app/(protected)/shipping/labels/[id]/page.tsx` |
| Tracking page | `apps/web/app/(protected)/shipping/tracking/[trackingNumber]/page.tsx` |
| Fulfillment page | `apps/web/app/(protected)/shipping/fulfillment/page.tsx` |
| Label API | `apps/web/app/api/shipping/label/route.ts` |
| Tracking API | `apps/web/app/api/shipping/track/[trackingNumber]/route.ts` |
| Carriers API | `apps/web/app/api/shipping/carriers/route.ts` |
| Label card | `apps/web/components/shipping/ShippingLabelCard.tsx` |
| Tracking timeline | `apps/web/components/shipping/TrackingTimeline.tsx` |
| Carrier selector | `apps/web/components/shipping/CarrierSelector.tsx` |
| Packaging instructions | `apps/web/components/shipping/PackagingInstructions.tsx` |
| Fulfillment status | `apps/web/components/shipping/FulfillmentStatus.tsx` |

**Database Migration:**

| File | Exact Path |
|------|------------|
| Shipping tables | `supabase/migrations/0013_shipping_engine_tables.sql` |

**Supabase Edge Function:**

| File | Exact Path |
|------|------------|
| Shipment webhook | `supabase/functions/webhook-shipment/index.ts` |

---

## 📦 Package Dependencies

### Import Patterns

**Within Next.js app:**
```typescript
import { generateShippingLabel } from '@magnus-flipper-ai/shipping-engine';
import { calculatePnL } from '@magnus-flipper-ai/profit-engine';
import { classifyDeal } from '@magnus-flipper-ai/deal-engine';
```

**Within Azure Functions:**
```typescript
import { detectSales } from '@magnus-flipper-ai/profit-engine';
import { syncMarketplaces } from '@magnus-flipper-ai/scraper-sync';
import { evaluateDeal } from '@magnus-flipper-ai/deal-engine';
```

**Within Edge Functions (Deno):**
```typescript
// Use npm: specifier for Supabase Edge Functions
import { scrapeOfferUp } from "npm:@magnus-flipper-ai/scraper-sync";
```

---

## 🚀 Deployment Targets

| Component | Deploy To | Command |
|-----------|-----------|---------|
| Next.js Frontend | Vercel | `vercel --prod` |
| Worker Evaluator | Azure Functions | `func azure functionapp publish magnus-flipper-evaluator` |
| Worker Sync | Azure Functions | `func azure functionapp publish magnus-flipper-sync` |
| Worker Auto-Sell | Azure Functions | `func azure functionapp publish magnus-flipper-autosell` |
| Worker Tracker | Azure Functions | `func azure functionapp publish magnus-flipper-tracker` |
| Edge Functions | Supabase | `supabase functions deploy scraper-offerup` |
| Database Migrations | Supabase | `supabase db push` |

---

## ✅ File Placement Checklist

### Phase 12 - Profit Engine

- [x] `packages/profit-engine/` package created
- [x] `packages/profit-engine/autosell/saleDetector.ts` implemented
- [x] `packages/profit-engine/autosell/crossPlatformLock.ts` implemented
- [x] `packages/profit-engine/autosell/finalizeSale.ts` implemented
- [x] `packages/profit-engine/ledger/feeModel.ts` implemented
- [x] `packages/profit-engine/ledger/profitLedger.ts` implemented
- [x] `packages/profit-engine/ledger/evCorrector.ts` implemented
- [x] `packages/profit-engine/ledger/portfolioEngine.ts` implemented
- [x] `packages/profit-engine/schemas/SaleEvent.ts` implemented
- [x] `packages/profit-engine/index.ts` exports configured
- [x] `supabase/migrations/0012_profit_engine_tables.sql` created
- [ ] `apps/worker-autosell/` worker app created
- [ ] `apps/web/app/(protected)/profit/` dashboard pages created
- [ ] `apps/web/app/api/profit/` API routes created
- [ ] `apps/web/components/profit/` UI components created

### Phase 13 - Shipping Engine

- [x] `packages/shipping-engine/` package created
- [x] `packages/shipping-engine/carrier/selectCarrier.ts` implemented
- [x] `packages/shipping-engine/carrier/rateCalculator.ts` implemented
- [x] `packages/shipping-engine/carrier/carrierClient_USPS.ts` implemented
- [x] `packages/shipping-engine/carrier/carrierClient_UPS.ts` implemented
- [x] `packages/shipping-engine/carrier/carrierClient_FedEx.ts` implemented
- [x] `packages/shipping-engine/carrier/carrierClient_Generic.ts` implemented
- [x] `packages/shipping-engine/label/labelGenerator.ts` implemented
- [x] `packages/shipping-engine/label/labelStorage.ts` implemented
- [x] `packages/shipping-engine/tracking/trackingManager.ts` implemented
- [x] `packages/shipping-engine/workflow/packagingAdvisor.ts` implemented
- [x] `packages/shipping-engine/workflow/fulfillmentOrchestrator.ts` implemented
- [x] `packages/shipping-engine/schemas/ShippingRequest.ts` implemented
- [x] `packages/shipping-engine/index.ts` exports configured
- [x] `supabase/migrations/0013_shipping_engine_tables.sql` created
- [ ] `apps/worker-tracker/` worker app created
- [ ] `apps/web/app/(protected)/shipping/` dashboard pages created
- [ ] `apps/web/app/api/shipping/` API routes created
- [ ] `apps/web/components/shipping/` UI components created
- [ ] `supabase/functions/webhook-shipment/` edge function created

---

## 🎯 Next Steps

1. **Create Worker Apps**
   ```bash
   cd apps/
   mkdir worker-autosell worker-tracker
   func init worker-autosell --typescript
   func init worker-tracker --typescript
   ```

2. **Create Frontend Pages**
   ```bash
   cd apps/web/app/(protected)/
   mkdir profit shipping
   # Create page.tsx files for each route
   ```

3. **Create API Routes**
   ```bash
   cd apps/web/app/api/
   mkdir profit shipping
   # Create route.ts files for each endpoint
   ```

4. **Create UI Components**
   ```bash
   cd apps/web/components/
   mkdir profit shipping
   # Create React components
   ```

5. **Deploy Edge Functions**
   ```bash
   cd supabase/functions/
   mkdir webhook-shipment
   # Create index.ts handler
   supabase functions deploy webhook-shipment
   ```

This file placement map provides exact locations for **every component** in the Magnus Flipper AI system! 🎯