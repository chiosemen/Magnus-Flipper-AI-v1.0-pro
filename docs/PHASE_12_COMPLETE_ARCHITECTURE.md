# Phase 12 - Auto-Sell & Profit Ledger Engine

**The Financial Nervous System**

---

## Executive Summary

Phase 12 completes the autonomous trading loop by:
1. **Auto-detecting sales** across all marketplaces
2. **Finalizing transactions** and preventing double-sells
3. **Tracking comprehensive P&L** with tax-grade accuracy
4. **Learning from outcomes** to improve future predictions
5. **Providing Bloomberg-style analytics** to users

This transforms Magnus Flipper AI into a **complete autonomous arbitrage machine** with full financial intelligence.

---

## System Architecture

```
┌────────────────────────────────────────────────────────┐
│         Marketplace Sales (eBay, Vinted, etc.)         │
└──────────────────┬─────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│         AGENT E: Auto-Sell Engine                      │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Sale Detector                                   │ │
│  │  - Webhook listeners                             │ │
│  │  - API polling                                   │ │
│  │  - Event normalization                           │ │
│  └───────────────┬──────────────────────────────────┘ │
│                  │                                     │
│                  ▼                                     │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Cross-Platform Lock                             │ │
│  │  - Remove from other marketplaces                │ │
│  │  - Prevent double-sell                           │ │
│  │  - Update inventory status                       │ │
│  └───────────────┬──────────────────────────────────┘ │
│                  │                                     │
│                  ▼                                     │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Finalize Sale                                   │ │
│  │  - Store in sold_items table                     │ │
│  │  - Send buyer confirmation                       │ │
│  │  - Generate shipping label                       │ │
│  │  - Update ledger                                 │ │
│  └───────────────┬──────────────────────────────────┘ │
└──────────────────┼────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│         AGENT F: Profit Ledger Engine                  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Profit Calculation                              │ │
│  │  profit = salePrice - buyCost - fees - shipping │ │
│  └───────────────┬──────────────────────────────────┘ │
│                  │                                     │
│  ┌──────────────▼──────────────────────────────────┐ │
│  │  Fee Modeling                                    │ │
│  │  - eBay: 12.9% + $0.30                          │ │
│  │  - Vinted: 5% buyer protection                  │ │
│  │  - Depop: 10% + payment processing              │ │
│  └───────────────┬──────────────────────────────────┘ │
│                  │                                     │
│  ┌──────────────▼──────────────────────────────────┐ │
│  │  EV Correction                                   │ │
│  │  - Update Bayesian priors                        │ │
│  │  - Adjust future predictions                     │ │
│  │  - Learn from outcomes                           │ │
│  └───────────────┬──────────────────────────────────┘ │
│                  │                                     │
│  ┌──────────────▼──────────────────────────────────┐ │
│  │  Portfolio Analytics                             │ │
│  │  - Total inventory value                         │ │
│  │  - Realized/unrealized gains                     │ │
│  │  - ROI metrics                                   │ │
│  │  - Risk exposure                                 │ │
│  └──────────────────────────────────────────────────┘ │
└──────────────────┬────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│              User Dashboards                           │
│  - Real-time P&L                                       │
│  - Performance charts                                  │
│  - Tax reports                                         │
│  - Portfolio analytics                                 │
└────────────────────────────────────────────────────────┘
```

---

## Agent E: Auto-Sell Engine

### Purpose
Detect sales, finalize transactions, and prevent double-sells across marketplaces.

### Components

#### 1. Sale Detector (`autosell/saleDetector.ts`)

```typescript
export interface SaleEvent {
  id: string;
  listingId: string;
  marketplace: string;
  salePrice: number;
  buyerInfo: {
    id: string;
    name?: string;
    location?: string;
  };
  soldAt: string;
  rawEvent: any;
}

export async function detectSales(): Promise<SaleEvent[]> {
  const sales: SaleEvent[] = [];
  
  // Poll each marketplace
  const marketplaces = ['ebay', 'vinted', 'depop', 'facebook', 'offerup'];
  
  for (const marketplace of marketplaces) {
    try {
      const marketplaceSales = await pollMarketplace(marketplace);
      sales.push(...marketplaceSales);
    } catch (error) {
      console.error(`Error polling ${marketplace}:`, error);
    }
  }
  
  return sales;
}

async function pollMarketplace(marketplace: string): Promise<SaleEvent[]> {
  switch (marketplace) {
    case 'ebay':
      return pollEbay();
    case 'vinted':
      return pollVinted();
    case 'depop':
      return pollDepop();
    case 'facebook':
      return pollFacebook();
    case 'offerup':
      return pollOfferUp();
    default:
      return [];
  }
}

async function pollEbay(): Promise<SaleEvent[]> {
  // eBay API call placeholder
  // GET /sell/fulfillment/v1/order?filter=orderfulfillmentstatus:{FULFILLED}
  
  const response = await fetch('https://api.ebay.com/sell/fulfillment/v1/order', {
    headers: {
      'Authorization': `Bearer ${process.env.EBAY_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  return data.orders?.map(order => ({
    id: order.orderId,
    listingId: order.lineItems[0].legacyItemId,
    marketplace: 'ebay',
    salePrice: parseFloat(order.pricingSummary.total.value),
    buyerInfo: {
      id: order.buyer.username,
      name: order.buyer.buyerRegistrationAddress?.fullName,
      location: order.buyer.buyerRegistrationAddress?.city
    },
    soldAt: order.creationDate,
    rawEvent: order
  })) || [];
}

// Similar implementations for other marketplaces...
```

#### 2. Cross-Platform Lock (`autosell/crossPlatformLock.ts`)

```typescript
export async function lockListingAcrossPlatforms(
  listingId: string,
  soldMarketplace: string
): Promise<void> {
  
  // Get all active listings for this item
  const activeListings = await getActiveListings(listingId);
  
  const lockedCount = 0;
  
  for (const listing of activeListings) {
    // Skip the marketplace where it sold
    if (listing.marketplace === soldMarketplace) {
      continue;
    }
    
    try {
      // Remove or mark as sold on other platforms
      await removeListingFromMarketplace(listing.marketplace, listing.externalId);
      
      // Update in database
      await updateListingStatus(listing.id, 'removed_cross_platform');
      
      lockedCount++;
      
    } catch (error) {
      console.error(`Failed to remove listing from ${listing.marketplace}:`, error);
    }
  }
  
  console.log(`Locked ${lockedCount} cross-platform listings for item ${listingId}`);
}

async function removeListingFromMarketplace(
  marketplace: string,
  externalId: string
): Promise<void> {
  
  switch (marketplace) {
    case 'ebay':
      // DELETE /sell/inventory/v1/offer/{offerId}
      await fetch(`https://api.ebay.com/sell/inventory/v1/offer/${externalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.EBAY_ACCESS_TOKEN}`
        }
      });
      break;
      
    case 'vinted':
      // Vinted API call to end listing
      // API endpoint varies by country
      break;
      
    case 'depop':
      // Depop API call to mark as sold
      break;
      
    // Add other marketplaces...
  }
}
```

#### 3. Finalize Sale (`autosell/finalizeSale.ts`)

```typescript
export interface FinalizedSale {
  id: string;
  itemId: string;
  acquiredPrice: number;
  salePrice: number;
  marketplace: string;
  fees: number;
  shippingCost: number;
  profit: number;
  roi: number;
  holdingTime: number; // days
  soldAt: string;
}

export async function finalizeSale(
  saleEvent: SaleEvent
): Promise<FinalizedSale> {
  
  // Get item acquisition details
  const item = await getInventoryItem(saleEvent.listingId);
  
  if (!item) {
    throw new Error(`Inventory item not found: ${saleEvent.listingId}`);
  }
  
  // Calculate fees
  const fees = calculateMarketplaceFees(saleEvent.marketplace, saleEvent.salePrice);
  
  // Estimate shipping cost (or get actual if available)
  const shippingCost = estimateShippingCost(item, saleEvent.buyerInfo.location);
  
  // Calculate profit
  const profit = saleEvent.salePrice - item.acquiredPrice - fees - shippingCost;
  const roi = (profit / item.acquiredPrice) * 100;
  
  // Calculate holding time
  const acquiredDate = new Date(item.acquiredAt);
  const soldDate = new Date(saleEvent.soldAt);
  const holdingTime = Math.floor((soldDate.getTime() - acquiredDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const finalizedSale: FinalizedSale = {
    id: saleEvent.id,
    itemId: item.id,
    acquiredPrice: item.acquiredPrice,
    salePrice: saleEvent.salePrice,
    marketplace: saleEvent.marketplace,
    fees,
    shippingCost,
    profit,
    roi,
    holdingTime,
    soldAt: saleEvent.soldAt
  };
  
  // Store in database
  await storeSoldItem(finalizedSale);
  
  // Update inventory status
  await updateInventoryStatus(item.id, 'sold');
  
  // Send buyer confirmation
  await sendBuyerConfirmation(saleEvent);
  
  // Generate shipping label (if supported)
  await generateShippingLabel(saleEvent);
  
  return finalizedSale;
}

function calculateMarketplaceFees(
  marketplace: string,
  salePrice: number
): number {
  
  const feeStructures = {
    ebay: { percentage: 12.9, fixed: 0.30 },
    vinted: { percentage: 5, fixed: 0 },
    depop: { percentage: 10, fixed: 0 },
    facebook: { percentage: 5, fixed: 0.40 },
    offerup: { percentage: 12.9, fixed: 0 }
  };
  
  const fees = feeStructures[marketplace] || { percentage: 10, fixed: 0 };
  
  return (salePrice * fees.percentage / 100) + fees.fixed;
}

function estimateShippingCost(
  item: any,
  buyerLocation?: string
): number {
  
  // Basic shipping cost estimation
  const weight = item.metadata?.weight || 1; // lbs
  const baseRate = 5.50; // USPS First Class
  
  if (weight > 1) {
    return baseRate + (weight - 1) * 2; // $2 per additional lb
  }
  
  return baseRate;
}
```

---

## Agent F: Profit Ledger Engine

### Purpose
Track comprehensive P&L, learn from outcomes, provide Bloomberg-style analytics.

### Components

#### 1. Profit Ledger (`ledger/profitLedger.ts`)

```typescript
export interface LedgerEntry {
  id: string;
  userId: string;
  itemId: string;
  type: 'acquisition' | 'sale' | 'fee' | 'shipping' | 'refund';
  amount: number;
  marketplace?: string;
  description: string;
  metadata: any;
  timestamp: string;
}

export interface PnLSummary {
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  totalFees: number;
  totalShipping: number;
  netProfit: number;
  roi: number;
  itemsSold: number;
  averageProfit: number;
  averageROI: number;
  periodStart: string;
  periodEnd: string;
}

export async function calculatePnL(
  userId: string,
  startDate: string,
  endDate: string
): Promise<PnLSummary> {
  
  // Get all ledger entries for period
  const entries = await getLedgerEntries(userId, startDate, endDate);
  
  let totalRevenue = 0;
  let totalCosts = 0;
  let totalFees = 0;
  let totalShipping = 0;
  
  for (const entry of entries) {
    switch (entry.type) {
      case 'sale':
        totalRevenue += entry.amount;
        break;
      case 'acquisition':
        totalCosts += entry.amount;
        break;
      case 'fee':
        totalFees += entry.amount;
        break;
      case 'shipping':
        totalShipping += entry.amount;
        break;
    }
  }
  
  const grossProfit = totalRevenue - totalCosts;
  const netProfit = grossProfit - totalFees - totalShipping;
  const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;
  
  // Get sold items count
  const soldItems = await getSoldItemsCount(userId, startDate, endDate);
  
  return {
    totalRevenue,
    totalCosts,
    grossProfit,
    totalFees,
    totalShipping,
    netProfit,
    roi,
    itemsSold: soldItems,
    averageProfit: soldItems > 0 ? netProfit / soldItems : 0,
    averageROI: roi,
    periodStart: startDate,
    periodEnd: endDate
  };
}

export async function createLedgerEntry(
  entry: Omit<LedgerEntry, 'id' | 'timestamp'>
): Promise<LedgerEntry> {
  
  const fullEntry: LedgerEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString()
  };
  
  await storeLedgerEntry(fullEntry);
  
  return fullEntry;
}
```

#### 2. EV Corrector (`ledger/evCorrector.ts`)

```typescript
export interface EVCorrection {
  itemCategory: string;
  marketplace: string;
  expectedValue: number;
  actualValue: number;
  variance: number;
  correction: number;
}

export async function correctEV(
  sale: FinalizedSale,
  originalEvaluation: any
): Promise<EVCorrection> {
  
  const expectedValue = originalEvaluation.resaleEstimation;
  const actualValue = sale.salePrice;
  const variance = actualValue - expectedValue;
  const percentageVariance = (variance / expectedValue) * 100;
  
  // Calculate Bayesian correction
  const correction = calculateBayesianCorrection(
    expectedValue,
    actualValue,
    originalEvaluation.confidence
  );
  
  // Update historical stats
  await updateHistoricalStats({
    category: originalEvaluation.category,
    marketplace: sale.marketplace,
    expectedValue,
    actualValue,
    variance
  });
  
  return {
    itemCategory: originalEvaluation.category,
    marketplace: sale.marketplace,
    expectedValue,
    actualValue,
    variance,
    correction
  };
}

function calculateBayesianCorrection(
  expected: number,
  actual: number,
  confidence: number
): number {
  
  // Weighted average between expected and actual
  // Higher confidence = less correction
  const weight = 1 - confidence;
  const correction = (actual - expected) * weight;
  
  return correction;
}

export async function getImprovedPrediction(
  itemCategory: string,
  marketplace: string,
  initialEstimate: number
): Promise<number> {
  
  // Get historical corrections
  const corrections = await getHistoricalCorrections(itemCategory, marketplace);
  
  if (corrections.length === 0) {
    return initialEstimate;
  }
  
  // Calculate average correction factor
  const avgCorrection = corrections.reduce((sum, c) => sum + c.correction, 0) / corrections.length;
  
  // Apply correction
  const improvedEstimate = initialEstimate + avgCorrection;
  
  return Math.max(0, improvedEstimate);
}
```

#### 3. Portfolio Engine (`ledger/portfolioEngine.ts`)

```typescript
export interface PortfolioSnapshot {
  timestamp: string;
  totalInventoryValue: number;
  activeListings: number;
  realizedGains: number;
  unrealizedGains: number;
  totalGains: number;
  capitalLocked: number;
  capitalFree: number;
  riskExposure: {
    [category: string]: number;
  };
  marketplaceExposure: {
    [marketplace: string]: number;
  };
  performanceMetrics: {
    roi: number;
    sellThroughRate: number;
    averageHoldingTime: number;
    profitPerDay: number;
  };
}

export async function generatePortfolioSnapshot(
  userId: string
): Promise<PortfolioSnapshot> {
  
  // Get active inventory
  const inventory = await getActiveInventory(userId);
  
  // Calculate total inventory value
  const totalInventoryValue = inventory.reduce((sum, item) => sum + item.currentPrice, 0);
  
  // Get realized gains (sold items)
  const soldItems = await getSoldItems(userId);
  const realizedGains = soldItems.reduce((sum, item) => sum + item.profit, 0);
  
  // Calculate unrealized gains (active listings above acquisition cost)
  const unrealizedGains = inventory.reduce((sum, item) => {
    const potentialProfit = item.currentPrice - item.acquiredPrice;
    return sum + (potentialProfit > 0 ? potentialProfit : 0);
  }, 0);
  
  // Calculate capital
  const capitalLocked = inventory.reduce((sum, item) => sum + item.acquiredPrice, 0);
  const capitalFree = realizedGains; // Simplified
  
  // Calculate risk exposure by category
  const riskExposure: { [key: string]: number } = {};
  for (const item of inventory) {
    const category = item.category || 'other';
    riskExposure[category] = (riskExposure[category] || 0) + item.acquiredPrice;
  }
  
  // Calculate marketplace exposure
  const marketplaceExposure: { [key: string]: number } = {};
  for (const item of inventory) {
    for (const listing of item.listings) {
      const marketplace = listing.marketplace;
      marketplaceExposure[marketplace] = (marketplaceExposure[marketplace] || 0) + item.currentPrice;
    }
  }
  
  // Calculate performance metrics
  const totalAcquisitionCost = soldItems.reduce((sum, item) => sum + item.acquiredPrice, 0);
  const roi = totalAcquisitionCost > 0 ? (realizedGains / totalAcquisitionCost) * 100 : 0;
  
  const sellThroughRate = (soldItems.length / (soldItems.length + inventory.length)) * 100;
  
  const averageHoldingTime = soldItems.length > 0
    ? soldItems.reduce((sum, item) => sum + item.holdingTime, 0) / soldItems.length
    : 0;
  
  const profitPerDay = averageHoldingTime > 0 ? realizedGains / averageHoldingTime : 0;
  
  return {
    timestamp: new Date().toISOString(),
    totalInventoryValue,
    activeListings: inventory.length,
    realizedGains,
    unrealizedGains,
    totalGains: realizedGains + unrealizedGains,
    capitalLocked,
    capitalFree,
    riskExposure,
    marketplaceExposure,
    performanceMetrics: {
      roi,
      sellThroughRate,
      averageHoldingTime,
      profitPerDay
    }
  };
}
```

---

## Database Schema

### sold_items
```sql
CREATE TABLE sold_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  item_id UUID REFERENCES agent_inventory(id),
  acquired_price NUMERIC NOT NULL,
  sale_price NUMERIC NOT NULL,
  marketplace TEXT NOT NULL,
  fees NUMERIC NOT NULL,
  shipping_cost NUMERIC NOT NULL,
  profit NUMERIC NOT NULL,
  roi NUMERIC NOT NULL,
  holding_time INTEGER NOT NULL, -- days
  sold_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sold_items_user ON sold_items(user_id);
CREATE INDEX idx_sold_items_sold_at ON sold_items(sold_at DESC);
CREATE INDEX idx_sold_items_marketplace ON sold_items(marketplace);
```

### ledger_entries
```sql
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  item_id UUID,
  type TEXT NOT NULL, -- acquisition, sale, fee, shipping, refund
  amount NUMERIC NOT NULL,
  marketplace TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ledger_user ON ledger_entries(user_id);
CREATE INDEX idx_ledger_timestamp ON ledger_entries(timestamp DESC);
CREATE INDEX idx_ledger_type ON ledger_entries(type);
```

### ev_corrections
```sql
CREATE TABLE ev_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_category TEXT NOT NULL,
  marketplace TEXT NOT NULL,
  expected_value NUMERIC NOT NULL,
  actual_value NUMERIC NOT NULL,
  variance NUMERIC NOT NULL,
  correction NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ev_corrections_category ON ev_corrections(item_category);
CREATE INDEX idx_ev_corrections_marketplace ON ev_corrections(marketplace);
```

### portfolio_snapshots
```sql
CREATE TABLE portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  snapshot_data JSONB NOT NULL,
  total_inventory_value NUMERIC,
  realized_gains NUMERIC,
  unrealized_gains NUMERIC,
  roi NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_portfolio_user ON portfolio_snapshots(user_id);
CREATE INDEX idx_portfolio_created ON portfolio_snapshots(created_at DESC);
```

---

## Admin Dashboard Routes

### Profit Analytics
- `/admin/profit/overview` - Real-time P&L summary
- `/admin/profit/ledger` - Full ledger view
- `/admin/profit/portfolio` - Portfolio analytics
- `/admin/profit/ev-accuracy` - EV correction tracking

### User Dashboards
- `/dashboard/profit` - Personal P&L
- `/dashboard/portfolio` - Portfolio snapshot
- `/dashboard/performance` - Performance metrics
- `/dashboard/tax-report` - Tax-ready reports

### Charts & Visualizations
- Daily profit timeline
- ROI by category
- Marketplace performance comparison
- Inventory turnover rate
- EV accuracy over time

---

## Key Features

### 1. Tax-Grade Tracking
- Every transaction logged with timestamps
- Category-based expense tracking
- FIFO/LIFO inventory methods
- Export to CSV for accountants

### 2. Learning Loop
- Bayesian updates from actual outcomes
- Category-specific price adjustments
- Marketplace-specific fee learning
- Holding time optimization

### 3. Portfolio Management
- Real-time inventory valuation
- Risk exposure by category
- Capital allocation tracking
- Performance benchmarking

### 4. Bloomberg-Style Analytics
- Real-time P&L
- Rolling EV curves
- Sharpe ratio for flipping
- Drawdown analysis
- Velocity metrics

---

## Performance Targets

- Sale detection: <30s from marketplace event
- Cross-platform lock: <5s to remove all listings
- P&L calculation: <100ms for 1000 transactions
- Portfolio snapshot: <500ms
- EV correction: <10ms per update

---

## Success Metrics

- Sale detection accuracy: 99.9%
- Double-sell prevention: 100%
- Profit tracking accuracy: ±$0.01
- EV prediction improvement: 20-40% over time
- User dashboard load time: <1s

---

**Phase 12 Status:** Architecture Complete, Ready for Implementation 📊

This completes the autonomous trading system with full financial intelligence!
