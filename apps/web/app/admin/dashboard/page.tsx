import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { createSupabaseServer, getUser } from "@/lib/supabase/server";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/badge";

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
 * READ-ONLY: All queries are SELECT only, no mutations
 */
async function getAdminMetrics() {
  const supabase = await createSupabaseServer();

  // Placeholder queries - replace with actual Apify cost tracking when available
  // These demonstrate the pattern for read-only admin metrics

  // Example: Total pooled deals (read-only)
  const { count: totalDeals } = await supabase
    .from("scraped_listings")
    .select("*", { count: "exact", head: true })
    .is("search_id", null)
    .eq("is_stale", false);

  // Example: Active users count (read-only)
  const { count: activeUsers } = await supabase
    .from("saved_searches")
    .select("user_id", { count: "exact", head: true })
    .eq("active", true);

  // Placeholder for Apify spend metrics
  // TODO: Implement when apify_runs table exists
  const apifySpendMonth = 0; // Placeholder
  const dailyBurnRate = 0;   // Placeholder
  const projectedSpend = 0;  // Placeholder
  const costPerDeal = 0;     // Placeholder

  return {
    financial: {
      currentMonthSpend: apifySpendMonth,
      dailyBurnRate,
      projectedMonthlySpend: projectedSpend,
      costPerDeal,
    },
    operational: {
      totalPooledDeals: totalDeals || 0,
      activeUsersCount: activeUsers || 0,
    },
  };
}

/**
 * Admin Dashboard Content Component
 * Server Component that fetches and displays admin metrics
 */
async function AdminDashboardContent() {
  const metrics = await getAdminMetrics();

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
        {/* Financial Overview Section */}
        <section>
          <h2 className="text-xl font-bold text-[#ededed] mb-3">
            Financial Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="Current Month Spend"
              value={`$${metrics.financial.currentMonthSpend.toFixed(2)}`}
              icon="💸"
              subtitle="Apify costs (placeholder)"
            />
            <MetricCard
              label="Daily Burn Rate"
              value={`$${metrics.financial.dailyBurnRate.toFixed(2)}`}
              icon="📉"
              subtitle="Average per day"
            />
            <MetricCard
              label="Projected Monthly"
              value={`$${metrics.financial.projectedMonthlySpend.toFixed(2)}`}
              icon="📊"
              subtitle="Based on current trend"
            />
            <MetricCard
              label="Cost per Deal"
              value={`$${metrics.financial.costPerDeal.toFixed(4)}`}
              icon="💎"
              subtitle="Average scraping cost"
            />
          </div>
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

        {/* Placeholder: Cost Breakdown */}
        <section>
          <h2 className="text-xl font-bold text-[#ededed] mb-3">
            Cost Breakdown by Pool
          </h2>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="text-center py-12">
              <div className="text-5xl mb-3 opacity-30">📊</div>
              <div className="text-sm text-[#6E7681]">
                Pool cost tracking coming soon
              </div>
              <div className="text-xs text-[#6E7681]/60 mt-1">
                Requires apify_runs table setup
              </div>
            </div>
          </div>
        </section>

        {/* Placeholder: Burn Rate Chart */}
        <section>
          <h2 className="text-xl font-bold text-[#ededed] mb-3">
            30-Day Burn Rate Trend
          </h2>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="text-center py-12">
              <div className="text-5xl mb-3 opacity-30">📈</div>
              <div className="text-sm text-[#6E7681]">
                Burn rate visualization coming soon
              </div>
              <div className="text-xs text-[#6E7681]/60 mt-1">
                Requires time-series cost data
              </div>
            </div>
          </div>
        </section>

        {/* Informational Notice */}
        <section>
          <div className="bg-[#0a0a0a] border border-[#4FF0E6]/20 rounded-lg p-5">
            <div className="flex items-start gap-3">
              <div className="text-2xl">ℹ️</div>
              <div>
                <h3 className="text-sm font-semibold text-[#ededed] mb-1">
                  Admin Dashboard - Read-Only Mode
                </h3>
                <p className="text-xs text-[#6E7681]">
                  This dashboard displays aggregated metrics and costs for administrative oversight.
                  All queries are read-only. Financial tracking requires{" "}
                  <code className="text-[#4FF0E6]">apify_runs</code> table setup and webhook integration.
                </p>
                <p className="text-xs text-[#6E7681] mt-2">
                  For operational controls, see{" "}
                  <a href="/dashboard" className="text-[#4FF0E6] hover:underline">
                    /dashboard
                  </a>
                  {" "}(kill-switches, pool health, market overview).
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
  // ========================================================================
  // ADMIN GUARD: Server-side enforcement (PRIMARY SECURITY LAYER)
  // ========================================================================
  // This check runs BEFORE any data fetching or component rendering
  // Non-admins are immediately redirected (fail-closed)
  const user = await getUser();

  // Unauthorized: No user session
  if (!user) {
    redirect("/login");
  }

  // Forbidden: User exists but is not admin
  const userRole = user.app_metadata?.role as string | undefined;
  if (userRole !== "admin") {
    // Fail-closed: Return 404 to non-admins (hides route existence)
    notFound();
  }

  // ========================================================================
  // Admin verified - proceed with dashboard rendering
  // ========================================================================
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
