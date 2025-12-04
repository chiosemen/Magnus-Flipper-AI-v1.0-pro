# Phase Omega - Agentic Auto-Buyer & Auto-Lister System

**The Autonomous Trading Layer**

---

## Executive Summary

Phase Omega transforms Magnus Flipper AI from a deal intelligence platform into a **fully autonomous trading system**. This is the "money printer" layer that combines:

- Phase 11 real-time marketplace sync
- Phase 9 AI deal classification  
- Phase 9.5 Bayesian confidence calibration
- Phase 10 arbitrage detection

Into a **4-agent autonomous system** that buys, negotiates, lists, and reprices inventory automatically.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Phase 11: Scraper Sync Engine                    │
│         (Real-time marketplace data stream)              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│      Phase Omega: Agentic Trading System                │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │          AGENT A: Deal Evaluator                   │ │
│  │  (DeepSeek R1 + Bayesian Calibration)             │ │
│  │                                                    │ │
│  │  Input: MarketListing + Historical Data           │ │
│  │  Output: BUY | WATCH | IGNORE                     │ │
│  └─────────────────┬──────────────────────────────────┘ │
│                    │                                     │
│         ┌──────────┼──────────┐                         │
│         │          │          │                          │
│         ▼          ▼          ▼                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                   │
│  │  BUY    │ │ WATCH   │ │ IGNORE  │                   │
│  └────┬────┘ └─────────┘ └─────────┘                   │
│       │                                                  │
│       ▼                                                  │
│  ┌────────────────────────────────────────────────────┐ │
│  │          AGENT B: Auto-Buyer                       │ │
│  │  (Negotiation + Seller Interaction)                │ │
│  │                                                    │ │
│  │  - Contact seller                                  │ │
│  │  - Submit offer                                    │ │
│  │  - Negotiate using playbook                       │ │
│  │  - Close deal                                     │ │
│  └─────────────────┬──────────────────────────────────┘ │
│                    │                                     │
│                    ▼                                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │          AGENT C: Auto-Lister                      │ │
│  │  (Cross-platform listing generator)                │ │
│  │                                                    │ │
│  │  - Generate title (7 variants)                    │ │
│  │  - Generate SEO description                       │ │
│  │  - Optimize images                                │ │
│  │  - Calculate optimal price                        │ │
│  │  - Publish to: eBay, Vinted, Depop, etc.        │ │
│  └─────────────────┬──────────────────────────────────┘ │
│                    │                                     │
│                    ▼                                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │       AGENT D: Inventory Controller                │ │
│  │  (Dynamic repricing + inventory management)        │ │
│  │                                                    │ │
│  │  - Detect stale listings                          │ │
│  │  - Adjust prices ±2-20%                          │ │
│  │  - Monitor sell-through rate                      │ │
│  │  - Detect arbitrage loops                         │ │
│  │  - Cross-platform inventory sync                  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase Database                           │
│                                                          │
│  - agent_decisions                                       │
│  - agent_negotiations                                    │
│  - agent_listings                                        │
│  - agent_inventory                                       │
│  - agent_performance                                     │
└─────────────────────────────────────────────────────────┘
```

---

## Package Structure

### Created:
```
packages/agentic-engine/
├── package.json
├── tsconfig.json
├── agents/
├── core/
├── actions/
└── schemas/
```

### To Implement:

#### Agents (4 autonomous agents)
```typescript
agents/
├── dealEvaluator.ts      - Agent A: Evaluate + Decide
├── autoBuyer.ts          - Agent B: Buy + Negotiate
├── autoLister.ts         - Agent C: List + Publish
└── inventoryController.ts - Agent D: Reprice + Manage
```

#### Core Logic
```typescript
core/
├── decisionGraph.ts       - Decision flow orchestrator
├── negotiationPlaybook.ts - Negotiation strategies
├── listingGenerator.ts    - AI listing generation
└── pricingEngine.ts       - Dynamic pricing logic
```

#### Actions (Marketplace interactions)
```typescript
actions/
├── contactSeller.ts      - Send initial message
├── submitOffer.ts        - Make offer
├── negotiate.ts          - Handle counteroffers
├── buyItem.ts            - Complete purchase
├── publishListing.ts     - Create listing
├── updateListing.ts      - Edit listing
└── repriceListing.ts     - Update price
```

#### Schemas (Type definitions)
```typescript
schemas/
├── DecisionOutput.ts     - Agent A output
├── OfferAction.ts        - Agent B actions
├── ListingSpec.ts        - Agent C specifications
└── PricingState.ts       - Agent D state
```

---

## Agent A: Deal Evaluator

### Purpose
Analyze every incoming listing and make BUY/WATCH/IGNORE decision.

### Implementation: `agents/dealEvaluator.ts`

```typescript
import { MarketListing } from "@magnus-flipper-ai/scraper-sync";
import { evaluateListing } from "@magnus-flipper-ai/deal-engine";
import { calibrate } from "@magnus-flipper-ai/deal-engine/calibrator/calibrate";

export interface DealEvaluation {
  decision: "BUY" | "WATCH" | "IGNORE";
  buyPrice: number;
  confidence: number;
  resaleEstimation: number;
  expectedProfit: number;
  arbitrageRoute: string[];
  holdingTime: number; // days
  reasoning: string;
}

export async function evaluateDeal(
  listing: MarketListing,
  historicalData?: any
): Promise<DealEvaluation> {
  
  // Step 1: Get raw AI score
  const rawScore = await evaluateListing(listing);
  
  // Step 2: Calibrate with Bayesian confidence
  const calibrated = calibrate({
    rawScore,
    historicalStats: historicalData?.stats,
    marketVolatilityIndex: historicalData?.volatility || 0.3
  });
  
  // Step 3: Calculate expected value
  const fairValue = rawScore.fairValue;
  const askingPrice = listing.price;
  const expectedProfit = fairValue - askingPrice;
  const profitMargin = expectedProfit / askingPrice;
  
  // Step 4: Make decision
  let decision: "BUY" | "WATCH" | "IGNORE";
  
  if (profitMargin > 0.30 && calibrated.confidence > 0.7) {
    decision = "BUY";
  } else if (profitMargin > 0.15 && calibrated.confidence > 0.5) {
    decision = "WATCH";
  } else {
    decision = "IGNORE";
  }
  
  // Step 5: Determine arbitrage route
  const arbitrageRoute = determineOptimalRoute(listing, fairValue);
  
  // Step 6: Estimate holding time
  const holdingTime = estimateHoldingTime(listing.category, profitMargin);
  
  return {
    decision,
    buyPrice: calculateOptimalBuyPrice(askingPrice, profitMargin),
    confidence: calibrated.confidence,
    resaleEstimation: fairValue,
    expectedProfit,
    arbitrageRoute,
    holdingTime,
    reasoning: calibrated.reasoning
  };
}

function determineOptimalRoute(
  listing: MarketListing,
  fairValue: number
): string[] {
  const routes: string[] = [];
  
  // Electronics: Buy OfferUp/Craigslist → Sell eBay
  if (listing.category?.includes("electronics")) {
    routes.push("ebay", "facebook");
  }
  
  // Fashion: Buy Facebook → Sell Vinted/Depop
  if (listing.category?.includes("fashion")) {
    routes.push("vinted", "depop", "poshmark");
  }
  
  // Default: Multi-market
  if (routes.length === 0) {
    routes.push("ebay", "facebook", "offerup");
  }
  
  return routes;
}

function calculateOptimalBuyPrice(
  askingPrice: number,
  profitMargin: number
): number {
  // Start at 70% of asking price for high-margin deals
  if (profitMargin > 0.5) {
    return Math.round(askingPrice * 0.7);
  }
  
  // 85% for medium-margin deals
  if (profitMargin > 0.3) {
    return Math.round(askingPrice * 0.85);
  }
  
  // 95% for low-margin deals
  return Math.round(askingPrice * 0.95);
}

function estimateHoldingTime(
  category?: string,
  profitMargin?: number
): number {
  // High-demand categories turn faster
  const fastCategories = ["electronics", "gaming", "phones"];
  
  if (category && fastCategories.some(c => category.includes(c))) {
    return 7; // 1 week
  }
  
  // High margin items can wait longer
  if (profitMargin && profitMargin > 0.5) {
    return 30; // 1 month
  }
  
  return 14; // 2 weeks default
}
```

---

## Agent B: Auto-Buyer

### Purpose
Automatically contact sellers, make offers, negotiate, and close deals.

### Implementation: `agents/autoBuyer.ts`

```typescript
export interface NegotiationState {
  listingId: string;
  sellerId: string;
  initialOffer: number;
  currentOffer: number;
  sellerCounteroffer?: number;
  status: "SENT" | "NEGOTIATING" | "ACCEPTED" | "REJECTED" | "FAILED";
  transcript: Message[];
  strategy: "polite-open" | "aggressive-offer" | "conditional-offer" | "bundle-offer";
  maxBudget: number;
}

export interface Message {
  from: "buyer" | "seller";
  text: string;
  timestamp: string;
  offerAmount?: number;
}

export async function initiatePurchase(
  listing: MarketListing,
  evaluation: DealEvaluation
): Promise<NegotiationState> {
  
  // Step 1: Select negotiation strategy
  const strategy = selectStrategy(evaluation);
  
  // Step 2: Craft initial message
  const initialMessage = generateInitialMessage(listing, evaluation, strategy);
  
  // Step 3: Send message via marketplace API
  const sent = await contactSeller({
    listingId: listing.id,
    sellerId: listing.seller.id,
    message: initialMessage,
    offerAmount: evaluation.buyPrice
  });
  
  return {
    listingId: listing.id,
    sellerId: listing.seller.id,
    initialOffer: evaluation.buyPrice,
    currentOffer: evaluation.buyPrice,
    status: "SENT",
    transcript: [
      {
        from: "buyer",
        text: initialMessage,
        timestamp: new Date().toISOString(),
        offerAmount: evaluation.buyPrice
      }
    ],
    strategy,
    maxBudget: evaluation.resaleEstimation * 0.7 // Never pay more than 70% of resale value
  };
}

function selectStrategy(evaluation: DealEvaluation): string {
  const margin = (evaluation.resaleEstimation - evaluation.buyPrice) / evaluation.buyPrice;
  
  // High margin = aggressive offer
  if (margin > 0.5) {
    return "aggressive-offer";
  }
  
  // Medium margin = polite negotiation
  if (margin > 0.3) {
    return "polite-open";
  }
  
  // Low margin = conditional offer (bundle, quick pickup, etc.)
  return "conditional-offer";
}

function generateInitialMessage(
  listing: MarketListing,
  evaluation: DealEvaluation,
  strategy: string
): string {
  const templates = {
    "polite-open": `Hi! I'm interested in your ${listing.title}. Would you consider $${evaluation.buyPrice}? I can pick up today. Thanks!`,
    
    "aggressive-offer": `Hello, I'd like to buy your ${listing.title}. I can offer $${evaluation.buyPrice} cash, pickup within 2 hours. Let me know!`,
    
    "conditional-offer": `Hi! Interested in your ${listing.title}. I can do $${evaluation.buyPrice} if you can meet today. Does that work?`,
    
    "bundle-offer": `Hi! I see you have multiple items listed. Would you do $${evaluation.buyPrice} for ${listing.title}? Happy to buy more if you have similar items.`
  };
  
  return templates[strategy] || templates["polite-open"];
}

export async function handleCounteroffer(
  negotiation: NegotiationState,
  sellerCounteroffer: number
): Promise<NegotiationState> {
  
  // Check if counteroffer is within budget
  if (sellerCounteroffer <= negotiation.maxBudget) {
    // Accept immediately
    await acceptOffer(negotiation.listingId, sellerCounteroffer);
    
    return {
      ...negotiation,
      sellerCounteroffer,
      currentOffer: sellerCounteroffer,
      status: "ACCEPTED"
    };
  }
  
  // Check if we can negotiate
  const midpoint = (negotiation.currentOffer + sellerCounteroffer) / 2;
  
  if (midpoint <= negotiation.maxBudget) {
    // Counter with midpoint
    const response = `Thanks for getting back to me! Would you meet me at $${Math.round(midpoint)}?`;
    
    await submitOffer({
      listingId: negotiation.listingId,
      message: response,
      offerAmount: Math.round(midpoint)
    });
    
    return {
      ...negotiation,
      sellerCounteroffer,
      currentOffer: Math.round(midpoint),
      status: "NEGOTIATING",
      transcript: [
        ...negotiation.transcript,
        {
          from: "seller",
          text: `Counteroffer: $${sellerCounteroffer}`,
          timestamp: new Date().toISOString(),
          offerAmount: sellerCounteroffer
        },
        {
          from: "buyer",
          text: response,
          timestamp: new Date().toISOString(),
          offerAmount: Math.round(midpoint)
        }
      ]
    };
  }
  
  // Too expensive - reject politely
  const rejectMessage = "Thanks for the counteroffer, but that's a bit out of my budget. Good luck with your sale!";
  
  return {
    ...negotiation,
    sellerCounteroffer,
    status: "REJECTED",
    transcript: [
      ...negotiation.transcript,
      {
        from: "buyer",
        text: rejectMessage,
        timestamp: new Date().toISOString()
      }
    ]
  };
}
```

---

## Agent C: Auto-Lister

### Purpose
Automatically create optimized listings across multiple marketplaces.

### Implementation: `agents/autoLister.ts`

```typescript
export interface ListingSpec {
  title: string;
  titleVariants: string[]; // 7 variants for A/B testing
  description: string;
  price: number;
  images: string[];
  category: string;
  condition: string;
  keywords: string[];
  seoScore: number;
  targetMarketplaces: string[];
}

export async function generateListing(
  item: AcquiredItem,
  evaluation: DealEvaluation
): Promise<ListingSpec> {
  
  // Step 1: Generate optimized title variants
  const titleVariants = generateTitleVariants(item);
  
  // Step 2: Generate SEO-optimized description
  const description = generateDescription(item, evaluation);
  
  // Step 3: Calculate optimal price
  const price = calculateListingPrice(evaluation);
  
  // Step 4: Select target marketplaces
  const targetMarketplaces = evaluation.arbitrageRoute;
  
  // Step 5: Extract keywords
  const keywords = extractKeywords(item.title + " " + item.description);
  
  // Step 6: Calculate SEO score
  const seoScore = calculateSEOScore(titleVariants[0], description, keywords);
  
  return {
    title: titleVariants[0],
    titleVariants,
    description,
    price,
    images: item.images,
    category: item.category,
    condition: item.condition,
    keywords,
    seoScore,
    targetMarketplaces
  };
}

function generateTitleVariants(item: AcquiredItem): string[] {
  const base = item.title;
  const brand = extractBrand(base);
  const model = extractModel(base);
  const condition = item.condition;
  
  return [
    `${brand} ${model} - ${condition} Condition`,
    `${brand} ${model} | ${condition} | Fast Shipping`,
    `✨ ${brand} ${model} ${condition} - Great Deal!`,
    `${condition} ${brand} ${model} - Ready to Ship`,
    `${brand} ${model} (${condition}) - Excellent Price`,
    `Premium ${brand} ${model} - ${condition}`,
    `${brand} ${model} ${condition} | Free Shipping`
  ];
}

function generateDescription(
  item: AcquiredItem,
  evaluation: DealEvaluation
): string {
  return `
📦 ${item.title}

✅ Condition: ${item.condition}
✅ ${item.description || "Fully functional and ready to use"}
✅ Ships within 24 hours
✅ Returns accepted

💰 Great deal at $${evaluation.resaleEstimation}!

${item.category ? `Category: ${item.category}` : ""}

Questions? Feel free to message me!

#${item.title.split(" ").join(" #")}
  `.trim();
}

function calculateListingPrice(evaluation: DealEvaluation): number {
  // Start at estimated resale value
  let price = evaluation.resaleEstimation;
  
  // Add 10% buffer for negotiation
  price *= 1.10;
  
  // Round to nearest $5
  price = Math.ceil(price / 5) * 5;
  
  return price;
}

export async function publishToMarketplaces(
  spec: ListingSpec
): Promise<PublishResult[]> {
  const results: PublishResult[] = [];
  
  for (const marketplace of spec.targetMarketplaces) {
    try {
      const result = await publishListing({
        marketplace,
        title: spec.title,
        description: spec.description,
        price: spec.price,
        images: spec.images,
        category: spec.category,
        condition: spec.condition
      });
      
      results.push({
        marketplace,
        success: true,
        listingId: result.id,
        url: result.url
      });
      
    } catch (error) {
      results.push({
        marketplace,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}
```

---

## Agent D: Inventory Controller

### Purpose
Monitor inventory, detect stale listings, and dynamically reprice.

### Implementation: `agents/inventoryController.ts`

```typescript
export interface InventoryItem {
  id: string;
  listingIds: string[]; // Multiple marketplace listings
  acquiredAt: string;
  acquiredPrice: number;
  currentPrice: number;
  targetPrice: number;
  views: number;
  saves: number;
  offers: number;
  daysListed: number;
  repriceCount: number;
  status: "active" | "stale" | "hot" | "sold";
}

export async function monitorInventory(): Promise<void> {
  // Get all active inventory
  const inventory = await getActiveInventory();
  
  for (const item of inventory) {
    // Calculate health metrics
    const health = calculateItemHealth(item);
    
    // Decide action
    if (health.stale) {
      await repriceItem(item, -10); // Reduce price 10%
    }
    
    if (health.hot) {
      await repriceItem(item, +5); // Increase price 5%
    }
    
    if (health.noActivity && item.daysListed > 30) {
      await markForClearance(item);
    }
  }
}

function calculateItemHealth(item: InventoryItem) {
  const viewsPerDay = item.views / item.daysListed;
  const conversionRate = item.offers / item.views;
  
  return {
    stale: viewsPerDay < 1 && item.daysListed > 7,
    hot: viewsPerDay > 10 && conversionRate > 0.1,
    noActivity: item.views === 0 && item.daysListed > 7,
    healthy: viewsPerDay >= 3 && conversionRate > 0.05
  };
}

export async function repriceItem(
  item: InventoryItem,
  adjustment: number
): Promise<void> {
  // Calculate new price
  const newPrice = Math.round(item.currentPrice * (1 + adjustment / 100));
  
  // Don't go below acquisition cost + 20% minimum margin
  const minPrice = item.acquiredPrice * 1.20;
  const finalPrice = Math.max(newPrice, minPrice);
  
  // Update all marketplace listings
  for (const listingId of item.listingIds) {
    await repriceListing(listingId, finalPrice);
  }
  
  // Log repricing event
  await logRepricing({
    itemId: item.id,
    oldPrice: item.currentPrice,
    newPrice: finalPrice,
    adjustment,
    reason: adjustment < 0 ? "stale_listing" : "high_demand"
  });
}
```

---

## Database Schema

### agent_decisions
```sql
CREATE TABLE agent_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id TEXT NOT NULL,
  decision TEXT NOT NULL, -- BUY, WATCH, IGNORE
  buy_price NUMERIC,
  confidence NUMERIC,
  resale_estimation NUMERIC,
  expected_profit NUMERIC,
  arbitrage_route JSONB,
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### agent_negotiations
```sql
CREATE TABLE agent_negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  initial_offer NUMERIC NOT NULL,
  current_offer NUMERIC NOT NULL,
  seller_counteroffer NUMERIC,
  status TEXT NOT NULL,
  transcript JSONB DEFAULT '[]',
  strategy TEXT,
  max_budget NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### agent_listings
```sql
CREATE TABLE agent_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acquired_item_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  marketplace TEXT NOT NULL,
  external_listing_id TEXT,
  status TEXT DEFAULT 'active',
  views INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  offers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### agent_inventory
```sql
CREATE TABLE agent_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id TEXT NOT NULL,
  acquired_price NUMERIC NOT NULL,
  current_price NUMERIC NOT NULL,
  target_price NUMERIC NOT NULL,
  days_listed INTEGER DEFAULT 0,
  reprice_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  acquired_at TIMESTAMPTZ DEFAULT now(),
  sold_at TIMESTAMPTZ
);
```

---

## Safety Controls

### Financial Limits
```typescript
const SAFETY_LIMITS = {
  MAX_PURCHASE_AMOUNT: 500, // Never buy items over $500
  MAX_DAILY_SPEND: 2000,    // Daily spending cap
  MAX_INVENTORY_VALUE: 10000, // Total inventory cap
  MIN_PROFIT_MARGIN: 0.20,   // Minimum 20% profit
  MAX_HOLDING_DAYS: 60       // Auto-clearance after 60 days
};
```

### Risk Controls
```typescript
const RISK_CONTROLS = {
  REQUIRE_SELLER_RATING: 4.0,  // Minimum seller rating
  MAX_NEGOTIATIONS: 3,          // Max negotiation rounds
  FRAUD_SCORE_THRESHOLD: 0.7,  // AI fraud detection
  BLACKLIST_SELLERS: true,      // Track bad sellers
  REQUIRE_PHOTOS: true          // No-photo listings rejected
};
```

---

## Admin Dashboard

### Routes
- `/admin/agents/performance` - Agent success rates
- `/admin/agents/negotiations` - Active negotiations
- `/admin/agents/inventory` - Inventory health
- `/admin/agents/repricing` - Repricing events
- `/admin/agents/profitability` - P&L tracking

### Metrics
- Success rate: Accepted offers / Total offers
- Average negotiation rounds
- Average time to sale
- ROI per category
- Inventory turnover rate

---

## Next Steps

1. Complete all 4 agent implementations
2. Build decision graph orchestrator
3. Create marketplace API integrations
4. Implement safety controls
5. Build admin monitoring dashboard
6. Create database migrations
7. Add comprehensive logging
8. Build kill switch for emergencies

---

**Status:** Architecture Complete, Implementation Ready 🚀
**Warning:** This is autonomous trading. Use with extreme caution and proper safeguards.
