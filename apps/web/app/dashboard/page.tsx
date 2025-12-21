import { Suspense } from "react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";

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
                  <Image
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

export default function DashboardPage() {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 h-28" />
        ))}
      </div>
      <div className="text-center text-[#4FF0E6] text-lg py-8">
        <div className="text-4xl mb-2">⚡</div>
        Market is warming up...
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 h-24" />
        ))}
      </div>
    </div>
  );
}
