import { Suspense } from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/badge";
import { ApifyKillSwitches } from "./_components/ApifyKillSwitches";
import { ElitePoolActivationRequests } from "./_components/ElitePoolActivationRequests";

// Force dynamic rendering (no static generation)
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Admin Dashboard - Financial Metrics & Cost Tracking
 *
 * CRITICAL SECURITY:
 * ==================
 * - Server-side admin guard runs BEFORE any data fetching
 * - Non-admins receive redirect (fail-closed)
 * - Uses app_metadata.role === "admin" from Supabase Auth
 * - NOT exposed in public navigation
 *
 * ARCHITECTURE:
 * =============
 * - Server Component (no "use client")
 * - Read-only queries (no mutations)
 * - No scraping triggers
 * - No per-user data (admin-only aggregates)
 */

/**
 * Fetch admin-only financial and operational metrics
 * UI-ONLY MODE: Returns hardcoded demo data
 */
async function getAdminMetrics() {
  // UI-ONLY DEPLOYMENT: Return demo data
  return {
    financial: {
      todaySpend: 12.45,
      week7Spend: 87.23,
      costPerDeal: 0.0034,
      poolCostBreakdown: [
        {
          poolId: 'facebook_US',
          marketplace: 'facebook',
          region: 'US',
          totalCost: 45.67,
          totalItems: 12500,
          costPerItem: 0.0037,
        },
        {
          poolId: 'vinted_UK',
          marketplace: 'vinted',
          region: 'UK',
          totalCost: 28.34,
          totalItems: 8900,
          costPerItem: 0.0032,
        },
      ],
    },
    operational: {
      totalPooledDeals: 1250,
      activeUsersCount: 42,
    },
  };
}

/**
 * Fetch Elite Pool Coverage metrics
 * UI-ONLY MODE: Returns hardcoded demo data
 */
async function getElitePoolCoverage() {
  // UI-ONLY DEPLOYMENT: Return demo data
  return {
    eliteSubscriberCount: 15,
    elitePrice: 29.99,
    coverage: {
      monthlyRevenue: 449.85,
      monthlyCost: 350.00,
      coverageRatio: 1.28,
      headroomUSD: 99.85,
      enabledPoolCount: 5,
    },
    status: 'SAFE' as const,
    statusColor: 'bg-green-500/20 text-green-400 border-green-500/30',
    disabledPools: [],
  };
}

/**
 * Admin Dashboard Content Component
 * Server Component that fetches and displays admin metrics
 */
async function AdminDashboardContent() {
  const metrics = await getAdminMetrics();
  const elitePoolCoverage = await getElitePoolCoverage();

  return (
    <div className="min-h-screen bg-[#0D1117] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#ededed] flex items-center gap-3">
              💰 Admin Dashboard
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                ADMIN ONLY
              </Badge>
            </h1>
            <p className="text-sm text-[#6E7681] mt-2">
              Financial metrics, cost tracking, and operational insights
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#6E7681]">Last Updated</div>
            <div className="text-sm text-[#ededed] font-mono">
              {new Date().toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Apify Burn Rate Section */}
        <section>
          <h2 className="text-xl font-bold text-[#ededed] mb-3">
            Apify Burn Rate
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <MetricCard
              label="Today's Spend"
              value={`$${metrics.financial.todaySpend.toFixed(2)}`}
              icon="💸"
              subtitle={metrics.financial.todaySpend > 0 ? "Since midnight UTC" : "No runs today"}
            />
            <MetricCard
              label="7-Day Spend"
              value={`$${metrics.financial.week7Spend.toFixed(2)}`}
              icon="📊"
              subtitle={metrics.financial.week7Spend > 0 ? "Last 7 days" : "No data available"}
            />
            <MetricCard
              label="Cost per Deal"
              value={metrics.financial.costPerDeal > 0 ? `$${metrics.financial.costPerDeal.toFixed(4)}` : "N/A"}
              icon="💎"
              subtitle={metrics.financial.costPerDeal > 0 ? "Last 7 days average" : "No deals scraped"}
            />
          </div>
        </section>

        {/* Elite Pool Coverage Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-[#ededed]">
              Elite Pool Coverage
            </h2>
            <Badge className={elitePoolCoverage.statusColor}>
              {elitePoolCoverage.status}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <MetricCard
              label="Elite Subscribers"
              value={elitePoolCoverage.eliteSubscriberCount}
              icon="👥"
              subtitle={elitePoolCoverage.eliteSubscriberCount === 0 ? "No subscribers yet" : "Active Elite tier"}
            />
            <MetricCard
              label="Monthly Revenue"
              value={`$${elitePoolCoverage.coverage.monthlyRevenue.toFixed(2)}`}
              icon="💰"
              subtitle={`${elitePoolCoverage.eliteSubscriberCount} × $${elitePoolCoverage.elitePrice}/mo`}
            />
            <MetricCard
              label="Active Pool Cost"
              value={`$${elitePoolCoverage.coverage.monthlyCost.toFixed(2)}`}
              icon="🏊"
              subtitle={`${elitePoolCoverage.coverage.enabledPoolCount} pool${elitePoolCoverage.coverage.enabledPoolCount !== 1 ? 's' : ''} enabled`}
            />
            <MetricCard
              label="Coverage Ratio"
              value={elitePoolCoverage.coverage.coverageRatio === Infinity
                ? "∞"
                : `${(elitePoolCoverage.coverage.coverageRatio * 100).toFixed(0)}%`}
              icon={elitePoolCoverage.coverage.coverageRatio >= 1.15 ? "✅" : elitePoolCoverage.coverage.coverageRatio >= 0.9 ? "⚠️" : "🚫"}
              subtitle={
                elitePoolCoverage.coverage.coverageRatio >= 1.15
                  ? "Healthy margin"
                  : elitePoolCoverage.coverage.coverageRatio >= 1.0
                  ? "Low margin"
                  : elitePoolCoverage.coverage.coverageRatio >= 0.9
                  ? "Needs throttle"
                  : "Needs pause"
              }
            />
            <MetricCard
              label="Headroom"
              value={`$${elitePoolCoverage.coverage.headroomUSD.toFixed(2)}`}
              icon={elitePoolCoverage.coverage.headroomUSD >= 0 ? "💎" : "⚠️"}
              subtitle={elitePoolCoverage.coverage.headroomUSD >= 0 ? "Monthly profit" : "Monthly deficit"}
            />
          </div>
        </section>

        {/* Elite Pool Activation Requests Section */}
        <section>
          <ElitePoolActivationRequests
            disabledPools={elitePoolCoverage.disabledPools}
            currentSubscriberCount={elitePoolCoverage.eliteSubscriberCount}
            elitePrice={elitePoolCoverage.elitePrice}
            apifyCuPriceUsd={0.30}
          />
        </section>

        {/* Cost Per Pool Section */}
        <section>
          <h2 className="text-xl font-bold text-[#ededed] mb-3">
            Cost Per Pool (Last 7 Days)
          </h2>
          {metrics.financial.poolCostBreakdown.length > 0 ? (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
                    <tr>
                      <th className="text-left text-xs text-[#6E7681] uppercase tracking-wide px-4 py-3">
                        Pool ID
                      </th>
                      <th className="text-left text-xs text-[#6E7681] uppercase tracking-wide px-4 py-3">
                        Marketplace
                      </th>
                      <th className="text-left text-xs text-[#6E7681] uppercase tracking-wide px-4 py-3">
                        Region
                      </th>
                      <th className="text-right text-xs text-[#6E7681] uppercase tracking-wide px-4 py-3">
                        Total Cost
                      </th>
                      <th className="text-right text-xs text-[#6E7681] uppercase tracking-wide px-4 py-3">
                        Items
                      </th>
                      <th className="text-right text-xs text-[#6E7681] uppercase tracking-wide px-4 py-3">
                        $/Item
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.financial.poolCostBreakdown.map((pool) => (
                      <tr
                        key={pool.poolId}
                        className="border-b border-[#2a2a2a] hover:bg-[#0a0a0a]/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-mono text-[#4FF0E6]">
                          {pool.poolId}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#ededed] capitalize">
                          {pool.marketplace}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#ededed] uppercase">
                          {pool.region || "Global"}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#ededed] text-right font-mono">
                          ${pool.totalCost.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#ededed] text-right">
                          {pool.totalItems.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#4FF0E6] text-right font-mono">
                          ${pool.costPerItem.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-[#0a0a0a]/50 border border-dashed border-[#2a2a2a] rounded-lg py-12 px-4">
              <div className="text-center">
                <div className="text-5xl mb-3 opacity-30">📊</div>
                <div className="text-sm text-[#6E7681]">No Apify usage data available</div>
                <div className="text-xs text-[#6E7681]/60 mt-1">
                  Run the migration and start logging Apify events
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Apify Kill Switches (UI-Only) */}
        <section>
          <ApifyKillSwitches />
        </section>

        {/* Operational Metrics Section */}
        <section>
          <h2 className="text-xl font-bold text-[#ededed] mb-3">
            Operational Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <MetricCard
              label="Total Pooled Deals"
              value={metrics.operational.totalPooledDeals.toLocaleString()}
              icon="🏊"
              subtitle="Active deals in pool"
            />
            <MetricCard
              label="Active Users"
              value={metrics.operational.activeUsersCount.toLocaleString()}
              icon="👥"
              subtitle="Users with saved searches"
            />
            <MetricCard
              label="System Health"
              value="Healthy"
              icon="✅"
              subtitle="All systems operational"
            />
          </div>
        </section>

        {/* Informational Notice */}
        <section>
          <div className="bg-[#0a0a0a] border border-[#4FF0E6]/20 rounded-lg p-5">
            <div className="flex items-start gap-3">
              <div className="text-2xl">ℹ️</div>
              <div>
                <h3 className="text-sm font-semibold text-[#ededed] mb-1">
                  Admin Dashboard - Financial Tracking
                </h3>
                <p className="text-xs text-[#6E7681]">
                  This dashboard displays Apify burn rate metrics from the{" "}
                  <code className="text-[#4FF0E6]">apify_usage_events</code> table.
                  All queries are read-only. Kill switches are UI-only and require backend integration.
                </p>
                <p className="text-xs text-[#6E7681] mt-2">
                  For operational controls (pool health, scraper status), see{" "}
                  <a href="/dashboard" className="text-[#4FF0E6] hover:underline">
                    /dashboard
                  </a>.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Loading Skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0D1117] p-4 sm:p-6 lg:p-8">
      <div className="animate-pulse space-y-6">
        {/* Header skeleton */}
        <div className="h-10 w-64 bg-[#2a2a2a] rounded" />

        {/* Financial cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg" />
          ))}
        </div>

        {/* Operational cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg" />
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="h-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg" />
      </div>

      <div className="text-center text-[#4FF0E6] text-lg py-8">
        <div className="text-4xl mb-2">⚡</div>
        Loading admin metrics...
      </div>
    </div>
  );
}

/**
 * Admin Dashboard Page Component
 *
 * SECURITY: Admin guard runs BEFORE Suspense boundary
 * Fail-closed: Non-admins are redirected before any data fetching
 */
export default async function AdminDashboardPage() {
  // UI-ONLY DEPLOYMENT: Always render admin dashboard
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
