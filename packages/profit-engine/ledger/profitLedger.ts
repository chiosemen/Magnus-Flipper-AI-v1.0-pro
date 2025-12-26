/**
 * Profit Ledger System
 * Comprehensive P&L tracking and analytics
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { LedgerEntry, PnLSummary } from "../schemas/SaleEvent.js";

interface LedgerEntryRow {
  readonly amount?: number | null;
  readonly type?: string | null;
  readonly sale_id?: string | null;
  readonly marketplace?: string | null;
  readonly category?: string | null;
  readonly acquired_price?: number | null;
  readonly net_profit?: number | null;
  readonly holding_time?: number | null;
  readonly sale_price?: number | null;
  readonly inventory_item_id?: string | null;
  readonly roi?: number | null;
}

interface InventoryTitleRow {
  readonly id: string;
  readonly title?: string | null;
}

interface InventoryValueRow {
  readonly estimated_resale_value?: number | null;
  readonly acquired_price?: number | null;
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
 * Calculate P&L for a given time period
 */
export async function calculatePnL(
  userId: string,
  startDate: string,
  endDate: string
): Promise<PnLSummary> {
  // Fetch all ledger entries for the period
  const { data: entries, error } = await getSupabaseClient()
    .from("ledger_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate);

  if (error || !entries) {
    throw new Error(`Failed to fetch ledger entries: ${error?.message}`);
  }

  let totalRevenue: number = 0;
  let totalCosts: number = 0;
  let totalFees: number = 0;
  let totalShipping: number = 0;

  const byMarketplace: Record<
    string,
    {
      revenue: number;
      costs: number;
      fees: number;
      profit: number;
      roi: number;
      itemsSold: number;
    }
  > = {};

  const byCategory: Record<
    string,
    {
      revenue: number;
      costs: number;
      profit: number;
      roi: number;
      itemsSold: number;
    }
  > = {};

  const saleIds: Set<string | null | undefined> = new Set();

  // Process ledger entries
  const entryRows = entries as LedgerEntryRow[];

  for (const entry of entryRows) {
    const amount = entry.amount || 0;

    switch (entry.type) {
      case "sale":
        totalRevenue += amount;
        saleIds.add(entry.sale_id);

        // By marketplace
        if (entry.marketplace) {
          if (!byMarketplace[entry.marketplace]) {
            byMarketplace[entry.marketplace] = {
              revenue: 0,
              costs: 0,
              fees: 0,
              profit: 0,
              roi: 0,
              itemsSold: 0,
            };
          }
          byMarketplace[entry.marketplace].revenue += amount;
          byMarketplace[entry.marketplace].itemsSold++;
        }

        // By category
        if (entry.category) {
          if (!byCategory[entry.category]) {
            byCategory[entry.category] = {
              revenue: 0,
              costs: 0,
              profit: 0,
              roi: 0,
              itemsSold: 0,
            };
          }
          byCategory[entry.category].revenue += amount;
          byCategory[entry.category].itemsSold++;
        }
        break;

      case "acquisition":
        totalCosts += Math.abs(amount);

        if (entry.marketplace && byMarketplace[entry.marketplace]) {
          byMarketplace[entry.marketplace].costs += Math.abs(amount);
        }

        if (entry.category && byCategory[entry.category]) {
          byCategory[entry.category].costs += Math.abs(amount);
        }
        break;

      case "fee":
        totalFees += Math.abs(amount);

        if (entry.marketplace && byMarketplace[entry.marketplace]) {
          byMarketplace[entry.marketplace].fees += Math.abs(amount);
        }
        break;

      case "shipping":
        totalShipping += Math.abs(amount);
        break;

      case "refund":
        totalRevenue += amount; // Negative amount
        break;
    }
  }

  // Calculate aggregate metrics
  const netProfit = totalRevenue - totalCosts - totalFees - totalShipping;
  const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;
  const itemsSold = saleIds.size;
  const avgProfitPerItem = itemsSold > 0 ? netProfit / itemsSold : 0;

  // Calculate by-marketplace profit and ROI
  for (const marketplace in byMarketplace) {
    const stats = byMarketplace[marketplace];
    stats.profit = stats.revenue - stats.costs - stats.fees;
    stats.roi = stats.costs > 0 ? (stats.profit / stats.costs) * 100 : 0;
  }

  // Calculate by-category profit and ROI
  for (const category in byCategory) {
    const stats = byCategory[category];
    stats.profit = stats.revenue - stats.costs;
    stats.roi = stats.costs > 0 ? (stats.profit / stats.costs) * 100 : 0;
  }

  // Fetch sold items to calculate holding time and win rate
  const { data: soldItems } = await getSupabaseClient()
    .from("sold_items")
    .select("holding_time, net_profit, acquired_price")
    .eq("user_id", userId)
    .gte("sold_at", startDate)
    .lte("sold_at", endDate);

  const soldRows = soldItems as LedgerEntryRow[] | null;
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
  const avgROIPerItem =
    soldRows && soldRows.length > 0
      ? soldRows.reduce((sum: number, item) => {
          const itemRoi =
            item.net_profit && item.acquired_price
              ? (item.net_profit / item.acquired_price) * 100
              : 0;
          return sum + itemRoi;
        }, 0) / soldRows.length
      : 0;

  return {
    period: { start: startDate, end: endDate },
    totalRevenue,
    totalCosts,
    totalFees,
    totalShipping,
    netProfit,
    roi,
    itemsSold,
    avgProfitPerItem,
    avgROIPerItem,
    avgHoldingTime,
    winRate,
    byMarketplace,
    byCategory,
  };
}

/**
 * Get ledger entries for a user
 */
export async function getLedgerEntries(
  userId: string,
  startDate?: string,
  endDate?: string,
  limit: number = 100
): Promise<LedgerEntry[]> {
  let query = getSupabaseClient()
    .from("ledger_entries")
    .select("*")
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
    .limit(limit);

  if (startDate) {
    query = query.gte("transaction_date", startDate);
  }

  if (endDate) {
    query = query.lte("transaction_date", endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch ledger entries: ${error.message}`);
  }

  return (data as LedgerEntry[]) || [];
}

/**
 * Create a manual ledger entry (for adjustments)
 */
export async function createLedgerEntry(
  entry: Omit<LedgerEntry, "id" | "createdAt">
): Promise<LedgerEntry> {
  const newEntry = {
    ...entry,
    id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await getSupabaseClient()
    .from("ledger_entries")
    .insert(newEntry)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create ledger entry: ${error.message}`);
  }

  return data as LedgerEntry;
}

/**
 * Get P&L summary for current month
 */
export async function getCurrentMonthPnL(userId: string): Promise<PnLSummary> {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  return calculatePnL(userId, startDate, endDate);
}

/**
 * Get P&L summary for current year
 */
export async function getCurrentYearPnL(userId: string): Promise<PnLSummary> {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), 0, 1)
    .toISOString()
    .split("T")[0];
  const endDate = new Date(now.getFullYear(), 11, 31)
    .toISOString()
    .split("T")[0];

  return calculatePnL(userId, startDate, endDate);
}

/**
 * Get all-time P&L summary
 */
export async function getAllTimePnL(userId: string): Promise<PnLSummary> {
  const startDate = "2020-01-01"; // Or fetch user's earliest transaction
  const endDate = new Date().toISOString().split("T")[0];

  return calculatePnL(userId, startDate, endDate);
}

/**
 * Get monthly P&L trend (last 12 months)
 */
export async function getMonthlyPnLTrend(
  userId: string
): Promise<
  Array<{ month: string; revenue: number; profit: number; roi: number }>
> {
  const trend: Array<{ month: string; revenue: number; profit: number; roi: number }> = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const pnl = await calculatePnL(userId, startDate, endDate);

    trend.push({
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      revenue: pnl.totalRevenue,
      profit: pnl.netProfit,
      roi: pnl.roi,
    });
  }

  return trend;
}

/**
 * Get top performing items
 */
export async function getTopPerformingItems(
  userId: string,
  limit: number = 10
): Promise<
  Array<{
    inventoryItemId: string;
    title: string;
    marketplace: string;
    netProfit: number;
    roi: number;
    salePrice: number;
  }>
> {
  const { data, error } = await getSupabaseClient()
    .from("sold_items")
    .select("inventory_item_id, marketplace, net_profit, roi, sale_price")
    .eq("user_id", userId)
    .order("net_profit", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch top performing items: ${error.message}`);
  }

  // Fetch inventory item details
  const soldRows = data as LedgerEntryRow[];
  const itemIds = soldRows.map((item) => item.inventory_item_id);
  const { data: inventoryItems } = await getSupabaseClient()
    .from("inventory")
    .select("id, title")
    .in("id", itemIds);

  const inventoryRows = inventoryItems as InventoryTitleRow[] | null;
  const titleMap = new Map(
    inventoryRows?.map((item) => [item.id, item.title]) || []
  );

  return soldRows.map((item) => ({
    inventoryItemId: item.inventory_item_id as string,
    title: titleMap.get(item.inventory_item_id as string) || "Unknown",
    marketplace: item.marketplace as string,
    netProfit: item.net_profit as number,
    roi: item.roi as number,
    salePrice: item.sale_price as number,
  }));
}

/**
 * Get worst performing items
 */
export async function getWorstPerformingItems(
  userId: string,
  limit: number = 10
): Promise<
  Array<{
    inventoryItemId: string;
    title: string;
    marketplace: string;
    netProfit: number;
    roi: number;
    salePrice: number;
  }>
> {
  const { data, error } = await getSupabaseClient()
    .from("sold_items")
    .select("inventory_item_id, marketplace, net_profit, roi, sale_price")
    .eq("user_id", userId)
    .order("net_profit", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(
      `Failed to fetch worst performing items: ${error.message}`
    );
  }

  // Fetch inventory item details
  const soldRows = data as LedgerEntryRow[];
  const itemIds = soldRows.map((item) => item.inventory_item_id);
  const { data: inventoryItems } = await getSupabaseClient()
    .from("inventory")
    .select("id, title")
    .in("id", itemIds);

  const inventoryRows = inventoryItems as InventoryTitleRow[] | null;
  const titleMap = new Map(
    inventoryRows?.map((item) => [item.id, item.title]) || []
  );

  return soldRows.map((item) => ({
    inventoryItemId: item.inventory_item_id as string,
    title: titleMap.get(item.inventory_item_id as string) || "Unknown",
    marketplace: item.marketplace as string,
    netProfit: item.net_profit as number,
    roi: item.roi as number,
    salePrice: item.sale_price as number,
  }));
}

/**
 * Calculate lifetime value (LTV) metrics
 */
export async function calculateLTV(userId: string): Promise<{
  totalInvested: number;
  totalRealized: number;
  totalUnrealized: number;
  netWorth: number;
  overallROI: number;
}> {
  // Get all-time P&L
  const pnl = await getAllTimePnL(userId);

  // Get current inventory value
  const { data: inventory } = await getSupabaseClient()
    .from("inventory")
    .select("acquired_price, estimated_resale_value, status")
    .eq("user_id", userId)
    .eq("status", "available");

  let totalUnrealized: number = 0;
  const inventoryRows = inventory as InventoryValueRow[] | null;
  if (inventoryRows) {
    for (const item of inventoryRows) {
      const estimatedProfit =
        (item.estimated_resale_value || 0) - (item.acquired_price || 0);
      totalUnrealized += estimatedProfit;
    }
  }

  const totalInvested = pnl.totalCosts;
  const totalRealized = pnl.netProfit;
  const netWorth = totalRealized + totalUnrealized;
  const overallROI = totalInvested > 0 ? (netWorth / totalInvested) * 100 : 0;

  return {
    totalInvested,
    totalRealized,
    totalUnrealized,
    netWorth,
    overallROI,
  };
}
