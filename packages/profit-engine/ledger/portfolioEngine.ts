/**
 * Portfolio Analytics Engine
 * Bloomberg Terminal-style portfolio tracking and analytics
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { PortfolioSnapshot } from "../schemas/SaleEvent.js";
import { calculatePnL, getAllTimePnL } from "./profitLedger.js";

interface InventoryRow {
  readonly id?: string;
  readonly status?: string | null;
  readonly acquired_price?: number | null;
  readonly estimated_resale_value?: number | null;
  readonly category?: string | null;
  readonly acquired_at?: string | null;
}

interface SoldItemRow {
  readonly inventory_item_id: string;
  readonly net_profit?: number | null;
  readonly holding_time?: number | null;
  readonly sale_price?: number | null;
  readonly marketplace?: string | null;
}

interface ListingRow {
  readonly marketplace?: string | null;
  readonly status?: string | null;
}

interface PortfolioSnapshotRow {
  readonly id: string;
  readonly user_id: string;
  readonly snapshot_date: string;
  readonly total_inventory_value: number;
  readonly total_invested_capital: number;
  readonly total_realized_profit: number;
  readonly total_unrealized_profit: number;
  readonly active_listings: number;
  readonly sold_items: number;
  readonly avg_holding_time: number;
  readonly portfolio_roi: number;
  readonly win_rate: number;
  readonly best_performing_category?: string | null;
  readonly worst_performing_category?: string | null;
  readonly metadata: unknown;
  readonly created_at: string;
}

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)"
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

/**
 * Create portfolio snapshot
 * Captures current portfolio state for historical tracking
 */
export async function createPortfolioSnapshot(
  userId: string
): Promise<PortfolioSnapshot> {
  // Get current inventory stats
  const { data: inventory } = await getSupabaseClient()
    .from("inventory")
    .select("*")
    .eq("user_id", userId);

  const inventoryRows = inventory as InventoryRow[] | null;

  if (!inventoryRows) {
    throw new Error("Failed to fetch inventory");
  }

  // Calculate inventory metrics
  const activeItems = inventoryRows.filter(
    (item) => item.status === "available"
  );
  const soldItems = inventoryRows.filter((item) => item.status === "sold");

  let totalInventoryValue: number = 0;
  let totalInvestedCapital: number = 0;
  let totalUnrealizedProfit: number = 0;

  for (const item of activeItems) {
    const acquiredPrice = item.acquired_price || 0;
    const estimatedResale = item.estimated_resale_value || 0;
    totalInvestedCapital += acquiredPrice;
    totalInventoryValue += estimatedResale;
    totalUnrealizedProfit += estimatedResale - acquiredPrice;
  }

  // Get P&L for realized profit
  const pnl = await getAllTimePnL(userId);
  const totalRealizedProfit = pnl.netProfit;

  // Get active listings count
  const { count: activeListings } = await getSupabaseClient()
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");

  // Calculate average holding time from sold items
  const { data: soldData } = await getSupabaseClient()
    .from("sold_items")
    .select("holding_time, net_profit")
    .eq("user_id", userId);

  const soldRows = soldData as SoldItemRow[] | null;
  let avgHoldingTime: number = 0;
  let profitableItems: number = 0;

  if (soldRows && soldRows.length > 0) {
    avgHoldingTime =
      soldRows.reduce(
        (sum: number, item) => sum + (item.holding_time || 0),
        0
      ) / soldRows.length;
    profitableItems = soldRows.filter((item) => (item.net_profit || 0) > 0).length;
  }

  const winRate =
    soldRows && soldRows.length > 0
      ? (profitableItems / soldRows.length) * 100
      : 0;

  // Calculate portfolio ROI
  const totalCapital = totalInvestedCapital + pnl.totalCosts;
  const totalProfit = totalRealizedProfit + totalUnrealizedProfit;
  const portfolioROI = totalCapital > 0 ? (totalProfit / totalCapital) * 100 : 0;

  // Get best/worst performing categories
  const categoryPerformance = await getCategoryPerformance(userId);
  const bestCategory = categoryPerformance[0]?.category || undefined;
  const worstCategory =
    categoryPerformance[categoryPerformance.length - 1]?.category || undefined;

  // Create snapshot
  const snapshot: PortfolioSnapshot = {
    id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    snapshotDate: new Date().toISOString(),
    totalInventoryValue,
    totalInvestedCapital,
    totalRealizedProfit,
    totalUnrealizedProfit,
    activeListings: activeListings || 0,
    soldItems: soldItems.length,
    avgHoldingTime,
    portfolioROI,
    winRate,
    bestPerformingCategory: bestCategory,
    worstPerformingCategory: worstCategory,
    metadata: {
      activeItemsCount: activeItems.length,
      categoryPerformance,
      pnlSummary: pnl,
    },
    createdAt: new Date().toISOString(),
  };

  // Store snapshot
  await getSupabaseClient().from("portfolio_snapshots").insert({
    id: snapshot.id,
    user_id: snapshot.userId,
    snapshot_date: snapshot.snapshotDate,
    total_inventory_value: snapshot.totalInventoryValue,
    total_invested_capital: snapshot.totalInvestedCapital,
    total_realized_profit: snapshot.totalRealizedProfit,
    total_unrealized_profit: snapshot.totalUnrealizedProfit,
    active_listings: snapshot.activeListings,
    sold_items: snapshot.soldItems,
    avg_holding_time: snapshot.avgHoldingTime,
    portfolio_roi: snapshot.portfolioROI,
    win_rate: snapshot.winRate,
    best_performing_category: snapshot.bestPerformingCategory,
    worst_performing_category: snapshot.worstPerformingCategory,
    metadata: snapshot.metadata,
    created_at: snapshot.createdAt,
  });

  return snapshot;
}

/**
 * Get category performance breakdown
 */
async function getCategoryPerformance(
  userId: string
): Promise<
  Array<{
    category: string;
    totalProfit: number;
    roi: number;
    itemsSold: number;
  }>
> {
  const { data: soldItems } = await getSupabaseClient()
    .from("sold_items")
    .select("inventory_item_id, net_profit")
    .eq("user_id", userId);

  const soldRows = soldItems as SoldItemRow[] | null;
  if (!soldRows) return [];

  // Get inventory items to get categories
  const itemIds = soldRows.map((item) => item.inventory_item_id);
  const { data: inventory } = await getSupabaseClient()
    .from("inventory")
    .select("id, category, acquired_price")
    .in("id", itemIds);

  const inventoryRows = inventory as InventoryRow[] | null;
  if (!inventoryRows) return [];

  // Group by category
  const categoryMap = new Map<
    string,
    { profit: number; costs: number; count: number }
  >();

  for (const sold of soldRows) {
    const item = inventoryRows.find((inv) => inv.id === sold.inventory_item_id);
    if (!item) continue;

    const category = item.category || "unknown";
    const existing = categoryMap.get(category) || {
      profit: 0,
      costs: 0,
      count: 0,
    };

    categoryMap.set(category, {
      profit: existing.profit + (sold.net_profit as number),
      costs: existing.costs + (item.acquired_price || 0),
      count: existing.count + 1,
    });
  }

  // Convert to array and calculate ROI
  const performance = Array.from(categoryMap.entries())
    .map(([category, stats]) => ({
      category,
      totalProfit: stats.profit,
      roi: stats.costs > 0 ? (stats.profit / stats.costs) * 100 : 0,
      itemsSold: stats.count,
    }))
    .sort((a, b) => b.roi - a.roi);

  return performance;
}

/**
 * Get portfolio snapshots over time
 */
export async function getPortfolioHistory(
  userId: string,
  days: number = 30
): Promise<PortfolioSnapshot[]> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data, error } = await getSupabaseClient()
    .from("portfolio_snapshots")
    .select("*")
    .eq("user_id", userId)
    .gte("snapshot_date", startDate)
    .order("snapshot_date", { ascending: true });

  if (error || !data) {
    return [];
  }

  const snapshotRows = data as PortfolioSnapshotRow[];

  return snapshotRows.map((snap) => ({
    id: snap.id,
    userId: snap.user_id,
    snapshotDate: snap.snapshot_date,
    totalInventoryValue: snap.total_inventory_value,
    totalInvestedCapital: snap.total_invested_capital,
    totalRealizedProfit: snap.total_realized_profit,
    totalUnrealizedProfit: snap.total_unrealized_profit,
    activeListings: snap.active_listings,
    soldItems: snap.sold_items,
    avgHoldingTime: snap.avg_holding_time,
    portfolioROI: snap.portfolio_roi,
    winRate: snap.win_rate,
    bestPerformingCategory: snap.best_performing_category as string | undefined,
    worstPerformingCategory: snap.worst_performing_category as string | undefined,
    metadata: snap.metadata as Record<string, unknown> | undefined,
    createdAt: snap.created_at,
  }));
}

/**
 * Get current portfolio metrics
 */
export async function getCurrentPortfolio(userId: string): Promise<{
  inventory: {
    total: number;
    available: number;
    sold: number;
    reserved: number;
  };
  value: {
    invested: number;
    current: number;
    realized: number;
    unrealized: number;
  };
  performance: {
    roi: number;
    winRate: number;
    avgHoldingTime: number;
  };
  listings: {
    active: number;
    sold: number;
    avgSalePrice: number;
  };
}> {
  // Get inventory breakdown
  const { data: inventory } = await getSupabaseClient()
    .from("inventory")
    .select("status, acquired_price, estimated_resale_value")
    .eq("user_id", userId);

  const inventoryRows = inventory as InventoryRow[] | null;

  const inventoryBreakdown = {
    total: inventoryRows?.length || 0,
    available:
      inventoryRows?.filter((i) => i.status === "available").length || 0,
    sold: inventoryRows?.filter((i) => i.status === "sold").length || 0,
    reserved: inventoryRows?.filter((i) => i.status === "reserved").length || 0,
  };

  // Calculate values
  let invested: number = 0;
  let current: number = 0;

  for (const item of inventoryRows || []) {
    invested += item.acquired_price || 0;
    if (item.status === "available") {
      current += item.estimated_resale_value || 0;
    }
  }

  const pnl = await getAllTimePnL(userId);
  const realized = pnl.netProfit;
  const unrealized = current - invested;

  // Get performance metrics
  const { data: soldItems } = await getSupabaseClient()
    .from("sold_items")
    .select("holding_time, net_profit, sale_price")
    .eq("user_id", userId);

  const soldRows = soldItems as SoldItemRow[] | null;
  let avgHoldingTime: number = 0;
  let profitableItems: number = 0;
  let avgSalePrice: number = 0;

  if (soldRows && soldRows.length > 0) {
    avgHoldingTime =
      soldRows.reduce(
        (sum: number, item) => sum + (item.holding_time || 0),
        0
      ) / soldRows.length;
    profitableItems = soldRows.filter((item) => (item.net_profit || 0) > 0).length;
    avgSalePrice =
      soldRows.reduce(
        (sum: number, item) => sum + (item.sale_price || 0),
        0
      ) / soldRows.length;
  }

  const winRate =
    soldRows && soldRows.length > 0
      ? (profitableItems / soldRows.length) * 100
      : 0;

  const totalCapital = invested + pnl.totalCosts;
  const totalProfit = realized + unrealized;
  const roi = totalCapital > 0 ? (totalProfit / totalCapital) * 100 : 0;

  // Get listings stats
  const { count: activeListings } = await getSupabaseClient()
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");

  return {
    inventory: inventoryBreakdown,
    value: {
      invested,
      current,
      realized,
      unrealized,
    },
    performance: {
      roi,
      winRate,
      avgHoldingTime,
    },
    listings: {
      active: activeListings || 0,
      sold: soldRows?.length || 0,
      avgSalePrice,
    },
  };
}

/**
 * Get inventory aging analysis
 * Shows how long items have been in inventory
 */
export async function getInventoryAging(userId: string): Promise<
  Array<{
    ageRange: string;
    count: number;
    totalValue: number;
    avgValue: number;
  }>
> {
  const { data: inventory } = await getSupabaseClient()
    .from("inventory")
    .select("acquired_at, acquired_price, estimated_resale_value")
    .eq("user_id", userId)
    .eq("status", "available");

  const inventoryRows = inventory as InventoryRow[] | null;

  if (!inventoryRows) return [];

  const now = Date.now();
  const ageRanges = [
    { label: "0-7 days", min: 0, max: 7 },
    { label: "8-30 days", min: 8, max: 30 },
    { label: "31-60 days", min: 31, max: 60 },
    { label: "61-90 days", min: 61, max: 90 },
    { label: "91+ days", min: 91, max: Infinity },
  ];

  const aging = ageRanges.map((range) => {
    const items = inventoryRows.filter((item) => {
      const acquiredAt = new Date(item.acquired_at as string).getTime();
      const ageDays = (now - acquiredAt) / (1000 * 60 * 60 * 24);
      return ageDays >= range.min && ageDays <= range.max;
    });

    const totalValue = items.reduce(
      (sum: number, item) => sum + (item.estimated_resale_value || 0),
      0
    );
    const avgValue = items.length > 0 ? totalValue / items.length : 0;

    return {
      ageRange: range.label,
      count: items.length,
      totalValue,
      avgValue,
    };
  });

  return aging;
}

/**
 * Get marketplace distribution
 */
export async function getMarketplaceDistribution(userId: string): Promise<
  Array<{
    marketplace: string;
    activeListings: number;
    soldItems: number;
    totalRevenue: number;
    avgSalePrice: number;
  }>
> {
  // Get active listings by marketplace
  const { data: listings } = await getSupabaseClient()
    .from("listings")
    .select("marketplace")
    .eq("user_id", userId)
    .eq("status", "active");

  // Get sold items by marketplace
  const { data: sold } = await getSupabaseClient()
    .from("sold_items")
    .select("marketplace, sale_price")
    .eq("user_id", userId);

  const listingRows = listings as ListingRow[] | null;
  const soldRows = sold as SoldItemRow[] | null;

  const marketplaceMap = new Map<
    string | null | undefined,
    {
      activeListings: number;
      soldItems: number;
      totalRevenue: number;
    }
  >();

  // Count active listings
  for (const listing of listingRows || []) {
    const marketplace = listing.marketplace;
    const existing = marketplaceMap.get(marketplace) || {
      activeListings: 0,
      soldItems: 0,
      totalRevenue: 0,
    };
    marketplaceMap.set(marketplace, {
      ...existing,
      activeListings: existing.activeListings + 1,
    });
  }

  // Count sold items and revenue
  for (const item of soldRows || []) {
    const marketplace = item.marketplace;
    const existing = marketplaceMap.get(marketplace) || {
      activeListings: 0,
      soldItems: 0,
      totalRevenue: 0,
    };
    marketplaceMap.set(marketplace, {
      ...existing,
      soldItems: existing.soldItems + 1,
      totalRevenue: existing.totalRevenue + (item.sale_price || 0),
    });
  }

  // Convert to array
  return Array.from(marketplaceMap.entries())
    .map(([marketplace, stats]) => ({
      marketplace: marketplace as string,
      activeListings: stats.activeListings,
      soldItems: stats.soldItems,
      totalRevenue: stats.totalRevenue,
      avgSalePrice: stats.soldItems > 0 ? stats.totalRevenue / stats.soldItems : 0,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

/**
 * Calculate cash flow projection
 * Estimates future cash flow based on current inventory
 */
export async function calculateCashFlowProjection(
  userId: string,
  days: number = 30
): Promise<{
  projectedRevenue: number;
  projectedProfit: number;
  projectedROI: number;
  basedOnItems: number;
}> {
  // Get average sale velocity
  const { data: recentSales } = await getSupabaseClient()
    .from("sold_items")
    .select("sold_at, net_profit, sale_price")
    .eq("user_id", userId)
    .gte(
      "sold_at",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    );

  const salesPerDay =
    recentSales && recentSales.length > 0 ? recentSales.length / 30 : 0;

  // Get current inventory value
  const { data: inventory } = await getSupabaseClient()
    .from("inventory")
    .select("acquired_price, estimated_resale_value")
    .eq("user_id", userId)
    .eq("status", "available");

  const inventoryRows = inventory as InventoryRow[] | null;

  if (!inventoryRows || inventoryRows.length === 0) {
    return {
      projectedRevenue: 0,
      projectedProfit: 0,
      projectedROI: 0,
      basedOnItems: 0,
    };
  }

  // Calculate average profit per item
  const avgProfit =
    inventoryRows.reduce(
      (sum: number, item) =>
        sum +
        ((item.estimated_resale_value || 0) - (item.acquired_price || 0)),
      0
    ) / inventoryRows.length;

  const avgRevenue =
    inventoryRows.reduce(
      (sum: number, item) => sum + (item.estimated_resale_value || 0),
      0
    ) / inventoryRows.length;

  // Project forward
  const projectedSales = Math.min(
    salesPerDay * days,
    inventoryRows.length
  );
  const projectedRevenue = avgRevenue * projectedSales;
  const projectedProfit = avgProfit * projectedSales;

  const totalInvested = inventoryRows.reduce(
    (sum: number, item) => sum + (item.acquired_price || 0),
    0
  );
  const projectedROI =
    totalInvested > 0 ? (projectedProfit / totalInvested) * 100 : 0;

  return {
    projectedRevenue,
    projectedProfit,
    projectedROI,
    basedOnItems: Math.round(projectedSales),
  };
}
