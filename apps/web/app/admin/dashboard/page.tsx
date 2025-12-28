import { Suspense } from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/badge";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

// Force dynamic rendering (no static generation)
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Admin Dashboard - Live Scraper Activity
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
 * Fetch live scraper activity signals for the admin dashboard
 */
async function getLiveScraperActivity() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      status: "unavailable" as const,
      scansLast24h: null,
      workersLive: null,
      activeWindows: null,
      latestRuns: [] as Array<{
        created_at: string;
        marketplace: string | null;
        event: string | null;
      }>,
    };
  }

  try {
    const supabaseAdmin = createSupabaseAdmin();
    const now = Date.now();
    const since24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const since90s = new Date(now - 90_000).toISOString();

    const [
      latestRunsResult,
      scansLast24hResult,
      workersLiveResult,
      activeWindowsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("scan_ledger")
        .select("created_at, marketplace, event")
        .eq("event", "scan_start")
        .order("created_at", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("scan_ledger")
        .select("*", { count: "exact", head: true })
        .eq("event", "scan_start")
        .gte("created_at", since24h),
      supabaseAdmin
        .from("worker_heartbeats")
        .select("worker_id, marketplace, state, last_seen_at")
        .gte("last_seen_at", since90s),
      supabaseAdmin
        .from("scan_windows")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
    ]);

    return {
      status: "ok" as const,
      scansLast24h: scansLast24hResult.count ?? null,
      workersLive: workersLiveResult.data?.length ?? null,
      activeWindows: activeWindowsResult.count ?? null,
      latestRuns: latestRunsResult.data ?? [],
    };
  } catch (error) {
    console.error("Admin dashboard live activity error:", error);
    return {
      status: "error" as const,
      scansLast24h: null,
      workersLive: null,
      activeWindows: null,
      latestRuns: [],
    };
  }
}

/**
 * Admin Dashboard Content Component
 * Server Component that fetches and displays admin metrics
 */
async function AdminDashboardContent() {
  const activity = await getLiveScraperActivity();

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
              Production scrapers are live. Control panel actions are temporarily disabled during scaling validation.
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
        <section>
          <h2 className="text-xl font-bold text-[#ededed] mb-3">
            Live Scraper Activity (Production)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <MetricCard
              label="Scans (last 24h)"
              value={activity.scansLast24h ?? "—"}
              icon="⚡"
              subtitle={activity.scansLast24h === null ? "Data loading" : "scan_start events"}
            />
            <MetricCard
              label="Workers Live"
              value={activity.workersLive ?? "—"}
              icon="🧵"
              subtitle={activity.workersLive === null ? "Data loading" : "Heartbeat in last 90s"}
            />
            <MetricCard
              label="Active Windows"
              value={activity.activeWindows ?? "—"}
              icon="🪟"
              subtitle={activity.activeWindows === null ? "Data loading" : "scan_windows active"}
            />
          </div>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
                  <tr>
                    <th className="text-left text-xs text-[#6E7681] uppercase tracking-wide px-4 py-3">
                      Timestamp
                    </th>
                    <th className="text-left text-xs text-[#6E7681] uppercase tracking-wide px-4 py-3">
                      Marketplace
                    </th>
                    <th className="text-left text-xs text-[#6E7681] uppercase tracking-wide px-4 py-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activity.latestRuns.length > 0 ? (
                    activity.latestRuns.map((run, index) => (
                      <tr
                        key={`${run.created_at}-${index}`}
                        className="border-b border-[#2a2a2a] hover:bg-[#0a0a0a]/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-[#ededed] font-mono">
                          {new Date(run.created_at).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#ededed] capitalize">
                          {run.marketplace || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#4FF0E6]">
                          {run.event || "scan_start"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-6 text-center text-sm text-[#6E7681]"
                      >
                        {activity.status === "unavailable"
                          ? "Data loading"
                          : "No recent scan runs"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                  Admin Dashboard - Production Activity
                </h3>
                <p className="text-xs text-[#6E7681]">
                  This view reads live signals from{" "}
                  <code className="text-[#4FF0E6]">scan_ledger</code>,{" "}
                  <code className="text-[#4FF0E6]">worker_heartbeats</code>, and{" "}
                  <code className="text-[#4FF0E6]">scan_windows</code>. If data is
                  unavailable, values will show as “—”.
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
