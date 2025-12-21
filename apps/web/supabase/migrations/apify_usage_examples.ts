/**
 * Apify Usage Tracking - Integration Examples
 *
 * This file contains example code for:
 * 1. Worker writes (logging Apify runs)
 * 2. Admin dashboard reads (aggregation queries)
 */

import { createClient } from "@supabase/supabase-js";

// ============================================================================
// WORKER INTEGRATION EXAMPLES
// ============================================================================
// Workers use SERVICE ROLE KEY to bypass RLS and write usage events

/**
 * Example 1: Log Apify Run Completion (Most Common)
 *
 * Call this after an Apify run completes successfully or fails.
 * This is typically called from worker-scheduler after each pool scrape.
 */
async function logApifyRun(params: {
  runId: string;
  actorId: string;
  marketplace: string;
  region?: string;
  poolTier?: string;
  startedAt: Date;
  finishedAt?: Date;
  status: "SUCCEEDED" | "FAILED" | "ABORTED" | "TIMEOUT";
  computeUnits?: number;
  itemsScraped?: number;
  itemsNew?: number;
  errorMessage?: string;
}) {
  // Use SERVICE ROLE key (has RLS bypass)
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role bypasses RLS
  );

  // Calculate cost from compute units
  const costUsd = params.computeUnits ? params.computeUnits * 0.25 : null;

  // Calculate duration
  const durationSeconds =
    params.finishedAt && params.startedAt
      ? Math.floor((params.finishedAt.getTime() - params.startedAt.getTime()) / 1000)
      : null;

  // Insert usage event (append-only)
  const { data, error } = await supabase.from("apify_usage_events").insert({
    run_id: params.runId,
    actor_id: params.actorId,
    pool_type: "pooled", // ALWAYS "pooled" (no per-user scraping)
    marketplace: params.marketplace,
    region: params.region || null,
    pool_tier: params.poolTier || null,
    started_at: params.startedAt.toISOString(),
    finished_at: params.finishedAt?.toISOString() || null,
    duration_seconds: durationSeconds,
    status: params.status,
    compute_units: params.computeUnits || null,
    cost_usd: costUsd,
    items_scraped: params.itemsScraped || 0,
    items_new: params.itemsNew || 0,
    error_message: params.errorMessage || null,
  });

  if (error) {
    console.error("[Apify Usage] Failed to log usage event:", error);
    // Don't throw - logging failure shouldn't break scraping
  } else {
    console.log(`[Apify Usage] ✓ Logged run ${params.runId}: ${params.status}, ${params.itemsScraped} items, $${costUsd?.toFixed(4)}`);
  }

  return { data, error };
}

/**
 * Example 2: Worker-Scheduler Integration
 *
 * This shows how to integrate usage logging into your existing worker-scheduler.
 * Add this code AFTER your Apify run completes.
 */
async function workerSchedulerExample() {
  // ... existing worker code ...

  // After Apify run completes:
  const apifyRun = await apifyClient.run(runId).waitForFinish();

  // Log usage event to Supabase
  await logApifyRun({
    runId: apifyRun.id,
    actorId: apifyRun.actId,
    marketplace: "facebook", // from your config
    region: "us_east", // from your config
    poolTier: "high_value", // optional tier classification
    startedAt: new Date(apifyRun.startedAt),
    finishedAt: new Date(apifyRun.finishedAt),
    status: apifyRun.status === "SUCCEEDED" ? "SUCCEEDED" : "FAILED",
    computeUnits: apifyRun.stats?.computeUnitsUsed,
    itemsScraped: apifyRun.stats?.outputItemCount,
    itemsNew: calculateNewItems(apifyRun), // your logic
    errorMessage: apifyRun.status === "FAILED" ? apifyRun.error : undefined,
  });

  // ... rest of worker code ...
}

/**
 * Example 3: Bulk Logging (Backfill Historical Data)
 *
 * If you need to backfill historical Apify usage from their API.
 */
async function backfillApifyUsage(startDate: Date, endDate: Date) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch runs from Apify API
  const runs = await apifyClient.runs().list({
    status: ["SUCCEEDED", "FAILED"],
    startedAtFrom: startDate,
    startedAtTo: endDate,
  });

  console.log(`[Backfill] Found ${runs.items.length} runs to backfill`);

  for (const run of runs.items) {
    // Check if already logged
    const { data: existing } = await supabase
      .from("apify_usage_events")
      .select("id")
      .eq("run_id", run.id)
      .single();

    if (existing) {
      console.log(`[Backfill] ⏭️  Skipping ${run.id} (already logged)`);
      continue;
    }

    // Log event
    await logApifyRun({
      runId: run.id,
      actorId: run.actId,
      marketplace: extractMarketplaceFromActorId(run.actId), // your logic
      region: extractRegionFromBuildTag(run.buildTag), // your logic
      startedAt: new Date(run.startedAt),
      finishedAt: new Date(run.finishedAt),
      status: run.status as any,
      computeUnits: run.stats.computeUnitsUsed,
      itemsScraped: run.stats.outputItemCount,
    });

    // Rate limit to avoid overwhelming Supabase
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`[Backfill] ✓ Backfilled ${runs.items.length} runs`);
}

// ============================================================================
// ADMIN DASHBOARD QUERY EXAMPLES
// ============================================================================
// Admins use their session token (RLS enforced, admin role required)

/**
 * Query 1: Current Month Total Spend
 */
async function getCurrentMonthSpend(supabase: any) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data, error } = await supabase
    .from("apify_usage_events")
    .select("cost_usd")
    .gte("started_at", startOfMonth.toISOString())
    .eq("status", "SUCCEEDED");

  if (error) throw error;

  const totalSpend = data?.reduce((sum, event) => sum + (event.cost_usd || 0), 0) || 0;
  return totalSpend;
}

/**
 * Query 2: Daily Burn Rate (Last 30 Days)
 */
async function getDailyBurnRate(supabase: any) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("apify_usage_events")
    .select("started_at, cost_usd")
    .gte("started_at", thirtyDaysAgo.toISOString())
    .eq("status", "SUCCEEDED")
    .order("started_at", { ascending: true });

  if (error) throw error;

  // Group by day
  const dailySpend: Record<string, number> = {};
  data?.forEach((event) => {
    const day = event.started_at.split("T")[0];
    dailySpend[day] = (dailySpend[day] || 0) + (event.cost_usd || 0);
  });

  // Convert to array format for charts
  return Object.entries(dailySpend).map(([date, cost]) => ({
    date,
    cost,
  }));
}

/**
 * Query 3: Cost Breakdown by Pool (Current Month)
 */
async function getPoolCostBreakdown(supabase: any) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data, error } = await supabase
    .from("apify_usage_events")
    .select("marketplace, region, cost_usd, items_scraped, compute_units")
    .gte("started_at", startOfMonth.toISOString())
    .eq("status", "SUCCEEDED");

  if (error) throw error;

  // Group by pool (marketplace + region)
  const poolStats: Record<
    string,
    {
      marketplace: string;
      region: string | null;
      totalCost: number;
      totalItems: number;
      totalComputeUnits: number;
      runsCount: number;
    }
  > = {};

  data?.forEach((event) => {
    const poolKey = `${event.marketplace}_${event.region || "global"}`;

    if (!poolStats[poolKey]) {
      poolStats[poolKey] = {
        marketplace: event.marketplace,
        region: event.region,
        totalCost: 0,
        totalItems: 0,
        totalComputeUnits: 0,
        runsCount: 0,
      };
    }

    poolStats[poolKey].totalCost += event.cost_usd || 0;
    poolStats[poolKey].totalItems += event.items_scraped || 0;
    poolStats[poolKey].totalComputeUnits += event.compute_units || 0;
    poolStats[poolKey].runsCount += 1;
  });

  // Convert to array and calculate cost per item
  return Object.entries(poolStats).map(([poolId, stats]) => ({
    poolId,
    ...stats,
    costPerItem: stats.totalItems > 0 ? stats.totalCost / stats.totalItems : 0,
    avgComputeUnitsPerRun: stats.totalComputeUnits / stats.runsCount,
  }));
}

/**
 * Query 4: Cost Per Deal (Overall)
 */
async function getCostPerDeal(supabase: any) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data, error } = await supabase
    .from("apify_usage_events")
    .select("cost_usd, items_scraped")
    .gte("started_at", startOfMonth.toISOString())
    .eq("status", "SUCCEEDED");

  if (error) throw error;

  const totalCost = data?.reduce((sum, event) => sum + (event.cost_usd || 0), 0) || 0;
  const totalItems = data?.reduce((sum, event) => sum + (event.items_scraped || 0), 0) || 0;

  return totalItems > 0 ? totalCost / totalItems : 0;
}

/**
 * Query 5: Recent Runs (Last 20)
 */
async function getRecentRuns(supabase: any) {
  const { data, error } = await supabase
    .from("apify_usage_events")
    .select(
      "run_id, marketplace, region, started_at, finished_at, status, cost_usd, items_scraped, duration_seconds"
    )
    .order("started_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
}

/**
 * Query 6: Tier-Level Analysis (Cost by Pool Tier)
 */
async function getTierCostAnalysis(supabase: any) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data, error } = await supabase
    .from("apify_usage_events")
    .select("pool_tier, cost_usd, items_scraped")
    .gte("started_at", startOfMonth.toISOString())
    .eq("status", "SUCCEEDED")
    .not("pool_tier", "is", null);

  if (error) throw error;

  // Group by tier
  const tierStats: Record<string, { totalCost: number; totalItems: number; runsCount: number }> =
    {};

  data?.forEach((event) => {
    const tier = event.pool_tier;
    if (!tier) return;

    if (!tierStats[tier]) {
      tierStats[tier] = { totalCost: 0, totalItems: 0, runsCount: 0 };
    }

    tierStats[tier].totalCost += event.cost_usd || 0;
    tierStats[tier].totalItems += event.items_scraped || 0;
    tierStats[tier].runsCount += 1;
  });

  return Object.entries(tierStats).map(([tier, stats]) => ({
    tier,
    ...stats,
    costPerItem: stats.totalItems > 0 ? stats.totalCost / stats.totalItems : 0,
  }));
}

/**
 * Query 7: Failed Runs Analysis
 */
async function getFailedRunsAnalysis(supabase: any) {
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("apify_usage_events")
    .select("marketplace, status, error_message")
    .gte("started_at", last7Days.toISOString())
    .in("status", ["FAILED", "ABORTED", "TIMEOUT"]);

  if (error) throw error;

  // Group by marketplace and error type
  const failureStats: Record<string, { count: number; errors: string[] }> = {};

  data?.forEach((event) => {
    const key = `${event.marketplace}_${event.status}`;

    if (!failureStats[key]) {
      failureStats[key] = { count: 0, errors: [] };
    }

    failureStats[key].count += 1;
    if (event.error_message) {
      failureStats[key].errors.push(event.error_message);
    }
  });

  return failureStats;
}

/**
 * Query 8: Projected Monthly Spend
 */
async function getProjectedMonthlySpend(supabase: any) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysSoFar = now.getDate();

  // Get current month spend
  const currentSpend = await getCurrentMonthSpend(supabase);

  // Calculate daily average and project
  const dailyAverage = currentSpend / daysSoFar;
  const projectedTotal = dailyAverage * daysInMonth;

  return {
    currentSpend,
    dailyAverage,
    projectedTotal,
    daysRemaining: daysInMonth - daysSoFar,
  };
}

/**
 * Query 9: Using Materialized View (Fast Aggregates)
 *
 * If you've set up the materialized view, use it for faster queries:
 */
async function getDailyStatsFromMaterializedView(supabase: any) {
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("apify_usage_daily")
    .select("*")
    .gte("date", last30Days.toISOString().split("T")[0])
    .order("date", { ascending: false });

  if (error) throw error;
  return data;
}

// ============================================================================
// Helper Functions
// ============================================================================

function extractMarketplaceFromActorId(actorId: string): string {
  // Example: "facebook-marketplace-scraper" → "facebook"
  if (actorId.includes("facebook")) return "facebook";
  if (actorId.includes("cars")) return "cars";
  if (actorId.includes("vinted")) return "vinted";
  return "unknown";
}

function extractRegionFromBuildTag(buildTag?: string): string | null {
  // Example: "us-east-1" → "us_east"
  if (!buildTag) return null;
  return buildTag.replace("-", "_");
}

function calculateNewItems(apifyRun: any): number {
  // Your logic to determine new vs updated items
  // This might involve comparing against existing data
  return apifyRun.stats?.outputItemCount || 0;
}

// ============================================================================
// Export Examples
// ============================================================================

export {
  // Worker functions
  logApifyRun,
  workerSchedulerExample,
  backfillApifyUsage,
  // Admin query functions
  getCurrentMonthSpend,
  getDailyBurnRate,
  getPoolCostBreakdown,
  getCostPerDeal,
  getRecentRuns,
  getTierCostAnalysis,
  getFailedRunsAnalysis,
  getProjectedMonthlySpend,
  getDailyStatsFromMaterializedView,
};
