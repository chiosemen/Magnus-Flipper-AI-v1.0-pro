import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServer, getUser } from "@/lib/supabase/server";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { AdminMetricCard } from "./_components/AdminMetricCard";
import { PoolHealthTable, PoolHealthData } from "./_components/PoolHealthTable";
import { PoolHealthStatus } from "./_components/PoolStatusBadge";
import { AdminControlsPanel } from "./_components/AdminControlsPanel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Pooled-only dashboard queries
async function getDashboardData() {
  const supabase = await createSupabaseServer();

  // A) Market Overview - ALL queries filter for pooled deals (search_id IS NULL)
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Total pooled deals (search_id IS NULL, not stale)
  const { count: totalDeals } = await supabase
    .from("scraped_listings")
    .select("*", { count: "exact", head: true })
    .is("search_id", null)
    .eq("is_stale", false);

  // New in 24h
  const { count: new24h } = await supabase
    .from("scraped_listings")
    .select("*", { count: "exact", head: true })
    .is("search_id", null)
    .eq("is_stale", false)
    .gte("first_seen_at", yesterday.toISOString());

  // Hot deals (freshness_score >= 80)
  const { count: hotDeals } = await supabase
    .from("scraped_listings")
    .select("*", { count: "exact", head: true })
    .is("search_id", null)
    .eq("is_stale", false)
    .gte("freshness_score", 80);

  // Freshness percentage (>= 70 score)
  const { count: freshCount } = await supabase
    .from("scraped_listings")
    .select("*", { count: "exact", head: true })
    .is("search_id", null)
    .eq("is_stale", false)
    .gte("freshness_score", 70);

  const freshnessPercent = totalDeals ? Math.round((freshCount! / totalDeals) * 100) : 0;

  // B) Marketplace Breakdown
  const { data: marketplaceStats } = await supabase
    .from("scraped_listings")
    .select("marketplace, freshness_score")
    .is("search_id", null)
    .eq("is_stale", false);

  // Group by marketplace
  const marketplaceCounts: Record<string, { count: number; avgHeat: number }> = {};
  (marketplaceStats || []).forEach((item) => {
    const mp = item.marketplace || "unknown";
    if (!marketplaceCounts[mp]) {
      marketplaceCounts[mp] = { count: 0, avgHeat: 0 };
    }
    marketplaceCounts[mp].count++;
    marketplaceCounts[mp].avgHeat += item.freshness_score || 0;
  });

  // Calculate averages
  Object.keys(marketplaceCounts).forEach((mp) => {
    marketplaceCounts[mp].avgHeat = Math.round(
      marketplaceCounts[mp].avgHeat / marketplaceCounts[mp].count
    );
  });

  // C) Live Snapshots - top 8 newest/hottest deals with images
  const { data: liveDeals } = await supabase
    .from("scraped_listings")
    .select("id, title, marketplace, price, link, images, freshness_score")
    .is("search_id", null)
    .eq("is_stale", false)
    .not("images", "is", null)
    .order("freshness_score", { ascending: false })
    .order("first_seen_at", { ascending: false })
    .limit(8);

  // D) Saved Searches Snapshot
  const { data: savedSearches } = await supabase
    .from("saved_searches")
    .select("marketplaces")
    .eq("active", true);

  // Count by marketplace
  const searchesByMarketplace: Record<string, number> = {};
  (savedSearches || []).forEach((search) => {
    (search.marketplaces || []).forEach((mp: string) => {
      searchesByMarketplace[mp] = (searchesByMarketplace[mp] || 0) + 1;
    });
  });

  // E) System Health
  const { data: scraperHealth } = await supabase
    .from("scraper_health")
    .select("marketplace, status, last_run_at, last_success_at, error_rate")
    .order("marketplace");

  // ============================================================================
  // ADMIN OPERATIONS METRICS (Read-only, pooled data)
  // ============================================================================
  // These metrics are admin-only and track system operations without triggering
  // any scraping, scheduling, or queue operations.

  // F) Deals marked stale in last 24h (pooled-only)
  // SAFE: Read-only count query, no mutations
  const { count: staleDeals24h } = await supabase
    .from("scraped_listings")
    .select("*", { count: "exact", head: true })
    .is("search_id", null) // Pooled-only
    .eq("is_stale", true)
    .gte("updated_at", yesterday.toISOString());

  // G) Active pools count (distinct marketplaces with pooled deals)
  // SAFE: Aggregation query, no mutations or job triggers
  const { data: activePools } = await supabase
    .from("scraped_listings")
    .select("marketplace")
    .is("search_id", null) // Pooled-only
    .eq("is_stale", false);

  const activePoolsCount = new Set(
    (activePools || []).map((item) => item.marketplace)
  ).size;

  // H) Alerts sent in last 24h (all users, read-only)
  // SAFE: Read-only count from alert_notifications table
  // NOTE: This table exists if alert system is enabled, otherwise returns 0
  const { count: alertsSent24h } = await supabase
    .from("alert_notifications")
    .select("*", { count: "exact", head: true })
    .eq("status", "SENT")
    .gte("created_at", yesterday.toISOString());

  // ============================================================================
  // POOL HEALTH METRICS (Read-only, grouped pooled data)
  // ============================================================================
  // Group scraped_listings by marketplace + region to infer "pools"
  // Calculate health metrics without triggering any scraping or mutations
  // SAFE: Read-only aggregation query, no cron, no polling, no side effects

  const { data: poolData } = await supabase
    .from("scraped_listings")
    .select("marketplace, location, is_stale, last_seen_at")
    .is("search_id", null); // Pooled-only

  // Group by marketplace + region (location)
  const poolGroups = new Map<string, {
    marketplace: string;
    region: string;
    deals: Array<{ is_stale: boolean; last_seen_at: string }>;
  }>();

  (poolData || []).forEach((item) => {
    const region = item.location || "Unknown";
    const poolKey = `${item.marketplace}_${region}`;

    if (!poolGroups.has(poolKey)) {
      poolGroups.set(poolKey, {
        marketplace: item.marketplace,
        region,
        deals: [],
      });
    }

    poolGroups.get(poolKey)!.deals.push({
      is_stale: item.is_stale,
      last_seen_at: item.last_seen_at,
    });
  });

  // Calculate health metrics for each pool
  const calculatePoolHealth = (
    deals: Array<{ is_stale: boolean; last_seen_at: string }>
  ): {
    lastScrapeAt: Date | null;
    dealCount: number;
    staleCount: number;
    stalePercent: number;
    status: PoolHealthStatus;
  } => {
    const dealCount = deals.length;
    const staleCount = deals.filter((d) => d.is_stale).length;
    const stalePercent = dealCount > 0 ? (staleCount / dealCount) * 100 : 0;

    // Find most recent scrape timestamp
    const lastScrapeAt = deals.length > 0
      ? new Date(
          Math.max(
            ...deals.map((d) => new Date(d.last_seen_at).getTime())
          )
        )
      : null;

    // Calculate time since last scrape
    const minutesSinceLastScrape = lastScrapeAt
      ? (Date.now() - lastScrapeAt.getTime()) / 60000
      : Infinity;

    // Determine health status
    // Healthy: last_scrape < 15 min AND stale < 20%
    // Degraded: last_scrape < 1 hr OR stale 20–50%
    // Stale: last_scrape > 1 hr OR stale > 50%
    let status: PoolHealthStatus;
    if (minutesSinceLastScrape < 15 && stalePercent < 20) {
      status = "healthy";
    } else if (minutesSinceLastScrape > 60 || stalePercent > 50) {
      status = "stale";
    } else {
      status = "degraded";
    }

    return {
      lastScrapeAt,
      dealCount,
      staleCount,
      stalePercent,
      status,
    };
  };

  const poolHealthData: PoolHealthData[] = Array.from(poolGroups.entries()).map(
    ([poolKey, group]) => {
      const health = calculatePoolHealth(group.deals);
      return {
        poolId: poolKey,
        marketplace: group.marketplace,
        region: group.region,
        ...health,
      };
    }
  );

  return {
    overview: {
      totalDeals: totalDeals || 0,
      new24h: new24h || 0,
      hotDeals: hotDeals || 0,
      freshnessPercent,
    },
    marketplaceBreakdown: marketplaceCounts,
    liveDeals: liveDeals || [],
    savedSearchesCount: savedSearches?.length || 0,
    searchesByMarketplace,
    scraperHealth: scraperHealth || [],
    // Admin operations metrics
    adminMetrics: {
      staleDeals24h: staleDeals24h || 0,
      activePoolsCount,
      alertsSent24h: alertsSent24h || 0,
    },
    // Pool health data
    poolHealthData,
  };
}

function getHeatBadge(avgHeat: number) {
  if (avgHeat >= 80) return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">🔥 Hot</Badge>;
  if (avgHeat >= 60) return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">⚡ Warm</Badge>;
  return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">❄️ Cool</Badge>;
}

function getHealthBadge(status: string, lastRunAt: string | null) {
  if (status === "healthy") {
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">✓ Healthy</Badge>;
  }
  if (status === "degraded") {
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">⚠ Degraded</Badge>;
  }
  return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">✗ Down</Badge>;
}

async function DashboardContent() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* Admin Kill-Switches (SAFE MODE) */}
      <AdminControlsPanel />

      {/* A) Market Overview */}
      <section>
        <h2 className="text-xl font-bold text-[#ededed] mb-3">Market Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label="Pooled Deals (All)"
            value={data.overview.totalDeals.toLocaleString()}
            icon="💎"
          />
          <MetricCard
            label="New in 24h"
            value={data.overview.new24h.toLocaleString()}
            icon="🆕"
          />
          <MetricCard
            label="Hot Deals"
            value={data.overview.hotDeals.toLocaleString()}
            icon="🔥"
          />
          <MetricCard
            label="Freshness"
            value={`${data.overview.freshnessPercent}%`}
            icon="✨"
          />
        </div>
      </section>

      {/* A.2) Admin Operations (Read-Only Metrics) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-[#ededed]">Admin Operations</h2>
          <span className="text-xs text-[#6E7681]">
            As of {new Date().toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AdminMetricCard
            label="Stale (24h)"
            value={data.adminMetrics.staleDeals24h}
            icon="⏱️"
            subtitle="Deals marked stale in last 24h"
          />
          <AdminMetricCard
            label="Active Pools"
            value={data.adminMetrics.activePoolsCount}
            icon="🏊"
            subtitle="Marketplaces with fresh pooled deals"
          />
          <AdminMetricCard
            label="Alerts Sent (24h)"
            value={data.adminMetrics.alertsSent24h}
            icon="🔔"
            subtitle="Notifications delivered to users"
          />
        </div>
      </section>

      {/* A.3) Pool Health (Read-Only Visualization) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-[#ededed]">Pool Health</h2>
            <p className="text-xs text-[#6E7681] mt-1">
              Grouped by marketplace + region • Click columns to sort
            </p>
          </div>
          <div className="text-xs text-[#6E7681]">
            {data.poolHealthData.length} pool{data.poolHealthData.length !== 1 ? "s" : ""}
          </div>
        </div>
        <PoolHealthTable pools={data.poolHealthData} />
      </section>

      {/* B) Marketplace Breakdown */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-[#ededed]">Marketplace Breakdown</h2>
          {/* Heat Legend */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-[#6E7681]">Heat:</span>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">🔥 80+</Badge>
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">⚡ 60+</Badge>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">❄️ &lt;60</Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(data.marketplaceBreakdown).map(([marketplace, stats]) => (
            <div
              key={marketplace}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-[#ededed] capitalize">
                  {marketplace}
                </h3>
                {getHeatBadge(stats.avgHeat)}
              </div>
              <div className="text-2xl font-bold text-[#4FF0E6]">{stats.count.toLocaleString()}</div>
              <div className="text-xs text-[#6E7681] mt-1">
                Avg Heat: {stats.avgHeat}/100
              </div>
            </div>
          ))}
          {Object.keys(data.marketplaceBreakdown).length === 0 && (
            <div className="col-span-full bg-[#0a0a0a]/50 border border-dashed border-[#2a2a2a] rounded-lg py-12 px-4">
              <div className="text-center">
                <div className="text-5xl mb-3 opacity-30">📊</div>
                <div className="text-sm text-[#6E7681]">No marketplace data available yet</div>
                <div className="text-xs text-[#6E7681]/60 mt-1">Fresh deals will appear here</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* C) Live Snapshots */}
      <section>
        <h2 className="text-xl font-bold text-[#ededed] mb-3">Live Snapshots</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.liveDeals.map((deal) => (
            <Link
              key={deal.id}
              href={deal.link || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden hover:border-[#4FF0E6] transition-all duration-200 hover:shadow-lg hover:shadow-[#4FF0E6]/10"
            >
              <div className="aspect-square relative bg-[#0a0a0a] overflow-hidden">
                {deal.images?.[0] ? (
                  <SafeImage
                    src={deal.images[0]}
                    alt={deal.title || "Deal"}
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-200"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-3xl opacity-30">
                    📦
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-[#8A4FFF]/95 text-white border-none text-xs shadow-sm">
                    {deal.freshness_score}
                  </Badge>
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-sm text-[#ededed] truncate font-medium leading-tight">
                  {deal.title || "Untitled"}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[#4FF0E6] font-bold text-sm">
                    ${parseFloat(deal.price || "0").toLocaleString()}
                  </span>
                  <span className="text-xs text-[#6E7681] capitalize truncate ml-1">
                    {deal.marketplace}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {data.liveDeals.length === 0 && (
            <div className="col-span-full bg-[#0a0a0a]/50 border border-dashed border-[#2a2a2a] rounded-lg py-16 px-4">
              <div className="text-center">
                <div className="text-6xl mb-3 opacity-30">📸</div>
                <div className="text-sm text-[#6E7681]">No deals with images available</div>
                <div className="text-xs text-[#6E7681]/60 mt-1">Check back soon for fresh listings</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* D) Saved Searches Snapshot */}
      <section>
        <h2 className="text-xl font-bold text-[#ededed] mb-3">Saved Searches Snapshot</h2>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5">
          {data.savedSearchesCount > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              <div>
                <div className="text-xs text-[#6E7681] mb-1.5">Total Active</div>
                <div className="text-2xl font-bold text-[#4FF0E6]">
                  {data.savedSearchesCount}
                </div>
              </div>
              {Object.entries(data.searchesByMarketplace).map(([marketplace, count]) => (
                <div key={marketplace}>
                  <div className="text-xs text-[#6E7681] mb-1.5 capitalize">{marketplace}</div>
                  <div className="text-2xl font-bold text-[#ededed]">{count}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="text-5xl mb-3 opacity-30">🔍</div>
              <div className="text-sm text-[#6E7681]">No active saved searches</div>
              <div className="text-xs text-[#6E7681]/60 mt-1">Create searches to track specific deals</div>
            </div>
          )}
        </div>
      </section>

      {/* E) System Health */}
      <section>
        <h2 className="text-xl font-bold text-[#ededed] mb-3">System Health</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.scraperHealth.map((health) => {
            const lastRun = health.last_run_at
              ? new Date(health.last_run_at)
              : null;
            const isDelayed = lastRun
              ? Date.now() - lastRun.getTime() > 60 * 60 * 1000 // 1 hour
              : true;

            return (
              <div
                key={health.marketplace}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-[#ededed] capitalize">
                    {health.marketplace}
                  </h3>
                  {getHealthBadge(health.status, health.last_run_at)}
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6E7681]">Last Run:</span>
                    <span className="text-[#ededed] text-right ml-2 truncate">
                      {lastRun ? lastRun.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Never"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6E7681]">Error Rate:</span>
                    <span className={health.error_rate > 10 ? "text-red-400" : "text-green-400"}>
                      {health.error_rate}%
                    </span>
                  </div>
                  {isDelayed && health.status === "healthy" && (
                    <div className="text-xs text-yellow-400/80 mt-2 pt-2 border-t border-[#2a2a2a]">
                      ⚠ Last run &gt; 1 hour ago
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {data.scraperHealth.length === 0 && (
            <div className="col-span-full bg-[#0a0a0a]/50 border border-dashed border-[#2a2a2a] rounded-lg py-12 px-4">
              <div className="text-center">
                <div className="text-5xl mb-3 opacity-30">🔧</div>
                <div className="text-sm text-[#6E7681]">No scraper health data available</div>
                <div className="text-xs text-[#6E7681]/60 mt-1">System monitoring will appear here</div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default async function DashboardPage() {
  // ============================================================================
  // ADMIN GUARD: Server-side authentication enforcement
  // ============================================================================
  // This check runs BEFORE any data fetching or component rendering.
  // Non-admin users are redirected immediately, preventing unauthorized access
  // to pooled marketplace data and system metrics.
  const user = await getUser();

  // Check 1: User must be authenticated
  if (!user) {
    redirect("/");
  }

  // Check 2: User must have admin role in app_metadata
  // app_metadata.role is set by Supabase Auth and cannot be modified by users
  const userRole = user.app_metadata?.role as string | undefined;
  if (userRole !== "admin") {
    redirect("/");
  }

  // ============================================================================
  // Admin user verified - proceed with dashboard render
  // ============================================================================

  return (
    <div className="min-h-screen bg-[#0D1117] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#ededed] mb-1.5">
            Dashboard
          </h1>
          <p className="text-sm text-[#6E7681]">
            Real-time marketplace intelligence • Pooled data only
          </p>
        </header>

        <Suspense fallback={<LoadingSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Market Overview Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 h-28" />
        ))}
      </div>

      {/* Admin Operations Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 h-32" />
        ))}
      </div>

      <div className="text-center text-[#4FF0E6] text-lg py-8">
        <div className="text-4xl mb-2">⚡</div>
        Market is warming up...
      </div>

      {/* Marketplace Breakdown Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 h-24" />
        ))}
      </div>
    </div>
  );
}
