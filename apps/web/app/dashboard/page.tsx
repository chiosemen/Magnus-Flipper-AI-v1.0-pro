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
    <div className="space-y-8">
      {/* A) Market Overview */}
      <section>
        <h2 className="text-2xl font-bold text-[#ededed] mb-4">Market Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <h2 className="text-2xl font-bold text-[#ededed] mb-4">Marketplace Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(data.marketplaceBreakdown).map(([marketplace, stats]) => (
            <div
              key={marketplace}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-[#ededed] capitalize">
                  {marketplace}
                </h3>
                {getHeatBadge(stats.avgHeat)}
              </div>
              <div className="text-2xl font-bold text-[#4FF0E6]">{stats.count.toLocaleString()}</div>
              <div className="text-sm text-[#a0a0a0] mt-1">
                Avg Heat: {stats.avgHeat}/100
              </div>
            </div>
          ))}
          {Object.keys(data.marketplaceBreakdown).length === 0 && (
            <div className="col-span-full text-center text-[#a0a0a0] py-8">
              No marketplace data available
            </div>
          )}
        </div>
      </section>

      {/* C) Live Snapshots */}
      <section>
        <h2 className="text-2xl font-bold text-[#ededed] mb-4">Live Snapshots</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.liveDeals.map((deal) => (
            <Link
              key={deal.id}
              href={deal.link || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden hover:border-[#4FF0E6] transition-colors"
            >
              <div className="aspect-square relative bg-[#0a0a0a]">
                {deal.images?.[0] ? (
                  <Image
                    src={deal.images[0]}
                    alt={deal.title || "Deal"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-4xl">
                    📦
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-[#8A4FFF]/90 text-white border-[#8A4FFF] text-xs">
                    {deal.freshness_score}
                  </Badge>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm text-[#ededed] truncate font-medium">
                  {deal.title || "Untitled"}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[#4FF0E6] font-bold">
                    ${parseFloat(deal.price || "0").toLocaleString()}
                  </span>
                  <span className="text-xs text-[#a0a0a0] capitalize">
                    {deal.marketplace}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {data.liveDeals.length === 0 && (
            <div className="col-span-full text-center text-[#a0a0a0] py-12 border border-dashed border-[#2a2a2a] rounded-lg">
              No deals with images available
            </div>
          )}
        </div>
      </section>

      {/* D) Saved Searches Snapshot */}
      <section>
        <h2 className="text-2xl font-bold text-[#ededed] mb-4">Saved Searches Snapshot</h2>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-[#a0a0a0] mb-1">Total Active</div>
              <div className="text-2xl font-bold text-[#4FF0E6]">
                {data.savedSearchesCount}
              </div>
            </div>
            {Object.entries(data.searchesByMarketplace).map(([marketplace, count]) => (
              <div key={marketplace}>
                <div className="text-sm text-[#a0a0a0] mb-1 capitalize">{marketplace}</div>
                <div className="text-2xl font-bold text-[#ededed]">{count}</div>
              </div>
            ))}
          </div>
          {data.savedSearchesCount === 0 && (
            <div className="text-center text-[#a0a0a0] py-8">
              No active saved searches
            </div>
          )}
        </div>
      </section>

      {/* E) System Health */}
      <section>
        <h2 className="text-2xl font-bold text-[#ededed] mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-[#ededed] capitalize">
                    {health.marketplace}
                  </h3>
                  {getHealthBadge(health.status, health.last_run_at)}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#a0a0a0]">Last Run:</span>
                    <span className="text-[#ededed]">
                      {lastRun ? lastRun.toLocaleString() : "Never"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a0a0a0]">Error Rate:</span>
                    <span className={health.error_rate > 10 ? "text-red-400" : "text-green-400"}>
                      {health.error_rate}%
                    </span>
                  </div>
                  {isDelayed && health.status === "healthy" && (
                    <div className="text-xs text-yellow-400 mt-2">
                      ⚠ Last run &gt; 1 hour ago
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {data.scraperHealth.length === 0 && (
            <div className="col-span-full text-center text-[#a0a0a0] py-8">
              No scraper health data available
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#0D1117] p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-[#ededed] mb-2">
            Dashboard
          </h1>
          <p className="text-[#a0a0a0]">
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
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 h-32" />
        ))}
      </div>
      <div className="text-center text-[#4FF0E6] text-lg">
        ⚡ Market is warming up...
      </div>
    </div>
  );
}
