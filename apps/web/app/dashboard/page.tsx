import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { SignalMetricCard } from "@/components/ui/SignalMetricCard";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/SafeImage";
import { MarketplaceLogo } from "@/components/ui/MarketplaceLogo";
import { MarketplaceCard } from "@/components/ui/MarketplaceCard";
import { LiveIntelligencePanel } from "@/components/ui/LiveIntelligencePanel";
import Link from "next/link";
import { AdminMetricCard } from "./_components/AdminMetricCard";
import { PoolHealthTable, PoolHealthData } from "./_components/PoolHealthTable";
import { PoolHealthStatus } from "./_components/PoolStatusBadge";
import { AdminControlsPanel } from "./_components/AdminControlsPanel";
import { ScraperActivity } from "@/components/ScraperActivity";
import { AdminBanner } from "@/components/AdminBanner";
import { isAdmin } from "@/lib/admin/auth";
import { getDashboardDataWithDemo } from "@/lib/demo/serverDemoMode";
import { isDemoUser } from "@/lib/demo/demoData";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LiveDeal = {
  id: string;
  title: string;
  marketplace: string;
  price: number;
  freshness_score: number;
  link?: string;
  images?: string[];
};

// Dashboard queries - uses demo data for demo users, real data for others
async function getDashboardData() {
  // DEVELOPMENT MODE: Use null user for demo data
  if (process.env.DISABLE_AUTH_GUARD === 'true') {
    console.log('[getDashboardData] 🚫 AUTH DISABLED - Using demo data');
    return await getDashboardDataWithDemo(null);
  }

  const user = await getUser();
  return await getDashboardDataWithDemo(user);
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

  // DEVELOPMENT MODE: Assume non-admin, non-demo user
  if (process.env.DISABLE_AUTH_GUARD === 'true') {
    const userIsAdmin = false;
    const isDemo = false;

    return renderDashboard(data, userIsAdmin, isDemo);
  }

  const userIsAdmin = await isAdmin();
  const user = await getUser();
  const isDemo = isDemoUser(user?.email);

  return renderDashboard(data, userIsAdmin, isDemo);
}

function renderDashboard(data: any, userIsAdmin: boolean, isDemo: boolean) {

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">⚡</div>
            <div>
              <h3 className="text-blue-400 font-semibold">Intelligence Preview Mode</h3>
              <p className="text-sm text-blue-300/80">
                Experiencing simulated signals. Upgrade to live access for real-time marketplace intelligence.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Banner */}
      {userIsAdmin && <AdminBanner />}

      {/* Admin Kill-Switches (SAFE MODE) */}
      {userIsAdmin && <AdminControlsPanel />}

      {/* A) Market Overview */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-[#ededed] mb-1">Market Intelligence</h2>
          <p className="text-sm text-[#a0a0a0]">Real-time signals across all monitored marketplaces</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SignalMetricCard
            label="Total Opportunities"
            value={data.overview.totalDeals}
            icon="💎"
            trend="up"
            trendValue="+12% vs avg"
            glow={true}
          />
          <SignalMetricCard
            label="New Signals (24h)"
            value={data.overview.new24h}
            icon="🆕"
            isLive={true}
            trend="up"
            trendValue={`${data.overview.new24h} fresh`}
          />
          <SignalMetricCard
            label="High Priority"
            value={data.overview.hotDeals}
            icon="🔥"
            trend={data.overview.hotDeals > 0 ? "up" : "neutral"}
            trendValue={data.overview.hotDeals > 0 ? "Active" : "Scanning"}
          />
          <SignalMetricCard
            label="Data Quality"
            value={`${data.overview.freshnessPercent}%`}
            icon="✨"
            trend={data.overview.freshnessPercent >= 80 ? "up" : "neutral"}
            trendValue="Fresh data"
            lastUpdate="Updated 2m ago"
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

      {/* Scraper Activity Panel */}
      <section>
        <ScraperActivity
          scraperHealth={data.scraperHealth}
          discoveredListings24h={data.overview.new24h}
        />
      </section>

      {/* Live Intelligence Panel */}
      <section>
        <LiveIntelligencePanel
          newListings24h={data.overview.new24h}
          newMatches={Math.floor(data.overview.new24h * 0.3)}
          activeAlerts={data.savedSearchesCount}
          lastScanTime={
            data.scraperHealth.length > 0 && data.scraperHealth[0].last_success_at
              ? (() => {
                  const lastScan = new Date(data.scraperHealth[0].last_success_at);
                  const now = new Date();
                  const diffMins = Math.floor((now.getTime() - lastScan.getTime()) / 60000);
                  return diffMins < 1 ? "Just now" : diffMins < 60 ? `${diffMins}m ago` : `${Math.floor(diffMins / 60)}h ago`;
                })()
              : "Initializing..."
          }
        />
      </section>

      {/* B) Marketplace Breakdown */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-[#ededed] mb-1">Marketplace Heatmap</h2>
            <p className="text-sm text-[#a0a0a0]">Activity intensity across platforms</p>
          </div>
          {/* Heat Legend */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-[#6E7681]">Heat Index:</span>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">🔥 80+</Badge>
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">⚡ 60+</Badge>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">❄️ &lt;60</Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(data.marketplaceBreakdown).map(([marketplace, stats]) => (
            <MarketplaceCard
              key={marketplace}
              marketplace={marketplace}
              count={stats.count}
              avgHeat={stats.avgHeat}
            />
          ))}
          {Object.keys(data.marketplaceBreakdown).length === 0 && (
            <div className="col-span-full bg-[#0a0a0a]/50 border border-dashed border-[#2a2a2a] rounded-lg py-16 px-4">
              <div className="text-center">
                <div className="text-5xl mb-3 opacity-30">📊</div>
                <div className="text-sm text-[#a0a0a0]">Scanners warming up</div>
                <div className="text-xs text-[#6E7681]/60 mt-1">First signals incoming...</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* C) Live Snapshots */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-[#ededed] mb-1">Live Deal Feed</h2>
          <p className="text-sm text-[#a0a0a0]">Latest opportunities with visual confirmation</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.liveDeals.map((deal: LiveDeal, index: number) => {
            const isNew = index < 3;
            const isHot = deal.freshness_score >= 85;
            return (
              <Link
                key={deal.id}
                href={deal.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden hover:border-[#4FF0E6] transition-all duration-200 hover:shadow-lg hover:shadow-[#4FF0E6]/10 hover:-translate-y-1"
              >
                <div className="aspect-square relative bg-[#0a0a0a] overflow-hidden">
                  {deal.images?.[0] ? (
                    <SafeImage
                      src={deal.images[0]}
                      alt={deal.title || "Deal"}
                      fill
                      className="object-cover object-center group-hover:scale-110 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-3xl opacity-30">
                      📦
                    </div>
                  )}
                  {/* Marketplace Logo */}
                  <div className="absolute top-2 left-2">
                    <MarketplaceLogo marketplace={deal.marketplace} size="sm" />
                  </div>
                  {/* NEW or HOT badge */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {isNew && (
                      <Badge className="bg-[#4FF0E6]/95 text-[#0a0a0a] border-none text-xs shadow-sm font-bold">
                        NEW
                      </Badge>
                    )}
                    {isHot && (
                      <Badge className="bg-red-500/95 text-white border-none text-xs shadow-sm font-bold">
                        🔥 HOT
                      </Badge>
                    )}
                  </div>
                  {/* Freshness Score */}
                  <div className="absolute bottom-2 right-2">
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
            );
          })}
          {data.liveDeals.length === 0 && (
            <div className="col-span-full bg-[#0a0a0a]/50 border border-dashed border-[#2a2a2a] rounded-lg py-16 px-4">
              <div className="text-center">
                <div className="text-6xl mb-3 opacity-30">📸</div>
                <div className="text-sm text-[#a0a0a0]">Feed initializing</div>
                <div className="text-xs text-[#6E7681]/60 mt-1">Visual confirmations loading...</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* D) Active Intelligence Feeds */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-[#ededed] mb-1">Active Intelligence Feeds</h2>
          <p className="text-sm text-[#a0a0a0]">Your personalized tracking parameters</p>
        </div>
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6">
          {data.savedSearchesCount > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              <div className="bg-[#0a0a0a]/50 rounded-lg p-4 border border-[#2a2a2a]">
                <div className="text-xs text-[#a0a0a0] mb-2 font-medium">TOTAL ACTIVE</div>
                <div className="text-3xl font-bold text-[#4FF0E6]">
                  {data.savedSearchesCount}
                </div>
              </div>
              {Object.entries(data.searchesByMarketplace).map(([marketplace, count]) => (
                <div key={marketplace} className="bg-[#0a0a0a]/30 rounded-lg p-4">
                  <div className="text-xs text-[#a0a0a0] mb-2 font-medium capitalize">{marketplace}</div>
                  <div className="text-3xl font-bold text-[#ededed]">{count}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-3 opacity-30">🎯</div>
              <div className="text-sm text-[#a0a0a0]">No intelligence feeds configured</div>
              <div className="text-xs text-[#6E7681]/60 mt-1">Set up custom filters to track high-value opportunities</div>
            </div>
          )}
        </div>
      </section>

      {/* E) Platform Status Monitor */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-[#ededed] mb-1">Platform Status Monitor</h2>
          <p className="text-sm text-[#a0a0a0]">Real-time health tracking across data sources</p>
        </div>
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
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#3a3a3a] transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MarketplaceLogo marketplace={health.marketplace} size="sm" />
                    <h3 className="text-base font-semibold text-[#ededed] capitalize">
                      {health.marketplace}
                    </h3>
                  </div>
                  {getHealthBadge(health.status, health.last_run_at)}
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#a0a0a0]">Last Scan:</span>
                    <span className="text-[#ededed] text-right ml-2 truncate font-medium">
                      {lastRun ? lastRun.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Initializing"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a0a0a0]">Reliability:</span>
                    <span className={health.error_rate > 10 ? "text-red-400 font-medium" : "text-green-400 font-medium"}>
                      {health.error_rate > 10 ? `${health.error_rate}% errors` : `${100 - health.error_rate}% uptime`}
                    </span>
                  </div>
                  {isDelayed && (health.status as string) !== "down" && (health.status as string) !== "degraded" && (
                    <div className="text-xs text-yellow-400/90 mt-2 pt-2 border-t border-[#2a2a2a] font-medium">
                      ⚠ Delayed scan detected
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {data.scraperHealth.length === 0 && (
            <div className="col-span-full bg-[#0a0a0a]/50 border border-dashed border-[#2a2a2a] rounded-lg py-16 px-4">
              <div className="text-center">
                <div className="text-5xl mb-3 opacity-30">🔧</div>
                <div className="text-sm text-[#a0a0a0]">Platform monitors booting up</div>
                <div className="text-xs text-[#6E7681]/60 mt-1">Health metrics will appear momentarily</div>
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
  // AUTH CHECK: Server-side authentication enforcement
  // ============================================================================

  // DEVELOPMENT MODE: Bypass server-side auth check
  if (process.env.DISABLE_AUTH_GUARD === 'true') {
    console.log('[dashboard/page] 🚫 AUTH DISABLED - Rendering without user check');
    // Render directly without auth - with prominent warning banner
    return (
      <div className="min-h-screen bg-[#0D1117] p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* VISUAL VERIFICATION MARKER - If you see this, the dashboard IS mounting */}
          <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-50 font-bold text-xl animate-pulse">
            ✅ DASHBOARD PAGE IS RENDERING - apps/web/app/dashboard/page.tsx
          </div>

          {/* Prominent Development Mode Banner */}
          <div className="mb-6 mt-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 animate-pulse" />
            <div className="relative bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border-2 border-yellow-500/50 rounded-lg p-4 shadow-lg shadow-yellow-500/20">
              <div className="flex items-center gap-3">
                <div className="text-4xl animate-bounce">🚫</div>
                <div className="flex-1">
                  <div className="text-yellow-300 text-lg font-bold mb-1">
                    ⚠️ DEVELOPMENT MODE ACTIVE
                  </div>
                  <div className="text-yellow-200/80 text-sm">
                    All authentication checks DISABLED • Dashboard rendering without user verification
                  </div>
                  <div className="text-yellow-400/60 text-xs mt-1 font-mono">
                    DISABLE_AUTH_GUARD=true
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="bg-yellow-500/20 rounded-full px-4 py-2 text-yellow-300 text-xs font-bold uppercase tracking-wide">
                    No Auth
                  </div>
                </div>
              </div>
            </div>
          </div>

          <header className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-[#ededed] mb-2">
              Command Center
            </h1>
            <p className="text-base text-[#a0a0a0]">
              Live marketplace intelligence • Multi-platform arbitrage signals
            </p>
          </header>

          <Suspense fallback={<LoadingSkeleton />}>
            <DashboardContent />
          </Suspense>
        </div>
      </div>
    );
  }

  // Layout guards (ProtectedRoute + OnboardingGuard) provide client-side protection
  // This is the server-side verification layer
  const user = await getUser();

  // Check: User must be authenticated
  if (!user) {
    redirect("/login");
  }

  // Note: Admin-specific features are gated within components
  // Demo users and regular users can see dashboard, but with different data
  // Admin users see pooled data + admin controls
  // Demo users (@demo.* emails) see seeded demo data
  // Regular users see their personal saved searches and deals

  // ============================================================================
  // Render dashboard for authenticated users
  // ============================================================================

  return (
    <div className="min-h-screen bg-[#0D1117] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#ededed] mb-2">
            Command Center
          </h1>
          <p className="text-base text-[#a0a0a0]">
            Live marketplace intelligence • Multi-platform arbitrage signals
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
      {/* Market Intelligence Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 h-32" />
        ))}
      </div>

      {/* Loading message */}
      <div className="text-center py-12">
        <div className="relative inline-block">
          <div className="text-6xl mb-4 animate-bounce">⚡</div>
          <div className="absolute inset-0 bg-[#4FF0E6]/20 blur-xl rounded-full" />
        </div>
        <div className="text-xl font-semibold text-[#4FF0E6] mb-2">
          Intelligence Systems Initializing
        </div>
        <div className="text-sm text-[#a0a0a0]">
          Connecting to marketplace data streams...
        </div>
      </div>

      {/* Marketplace Heatmap Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 h-36" />
        ))}
      </div>

      {/* Live Feed Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
            <div className="aspect-square bg-[#0a0a0a]" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-[#2a2a2a] rounded w-3/4" />
              <div className="h-3 bg-[#2a2a2a] rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
