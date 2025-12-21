"use client";

import { useState } from "react";
import { PoolStatusBadge, PoolHealthStatus } from "./PoolStatusBadge";

export interface PoolHealthData {
  poolId: string;
  marketplace: string;
  region: string;
  lastScrapeAt: Date | null;
  dealCount: number;
  staleCount: number;
  stalePercent: number;
  status: PoolHealthStatus;
}

interface PoolHealthTableProps {
  pools: PoolHealthData[];
}

type SortKey = "status" | "lastScrapeAt" | "dealCount" | "stalePercent";
type SortOrder = "asc" | "desc";

/**
 * PoolHealthTable - Admin visualization of pool health metrics
 *
 * Data source: Grouped scraped_listings by marketplace + region
 * Architecture: Read-only, pooled data (search_id IS NULL)
 * Interactions: Client-side sorting only (no server mutations)
 *
 * Health logic (calculated server-side):
 * - Healthy: last_scrape < 15 min AND stale < 20%
 * - Degraded: last_scrape < 1 hr OR stale 20–50%
 * - Stale: last_scrape > 1 hr OR stale > 50%
 *
 * TODO (Future enhancements):
 * - Add trend charts (7-day health history)
 * - Add historical snapshots (compare vs yesterday)
 * - Add export to CSV functionality
 * - Add filtering by marketplace/status
 */
export function PoolHealthTable({ pools }: PoolHealthTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const sortedPools = [...pools].sort((a, b) => {
    let aValue: string | number | Date | null;
    let bValue: string | number | Date | null;

    switch (sortKey) {
      case "status":
        // Sort by status priority: stale > degraded > healthy
        const statusPriority = { stale: 3, degraded: 2, healthy: 1 };
        aValue = statusPriority[a.status];
        bValue = statusPriority[b.status];
        break;
      case "lastScrapeAt":
        aValue = a.lastScrapeAt?.getTime() || 0;
        bValue = b.lastScrapeAt?.getTime() || 0;
        break;
      case "dealCount":
        aValue = a.dealCount;
        bValue = b.dealCount;
        break;
      case "stalePercent":
        aValue = a.stalePercent;
        bValue = b.stalePercent;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <span className="text-[#6E7681] opacity-30">↕</span>;
    }
    return (
      <span className="text-[#4FF0E6]">
        {sortOrder === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const formatTimestamp = (date: Date | null) => {
    if (!date) return "Never";
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (pools.length === 0) {
    return (
      <div className="bg-[#0a0a0a]/50 border border-dashed border-[#2a2a2a] rounded-lg py-12 px-4">
        <div className="text-center">
          <div className="text-5xl mb-3 opacity-30">📊</div>
          <div className="text-sm text-[#6E7681]">No pool data available</div>
          <div className="text-xs text-[#6E7681]/60 mt-1">
            Pools will appear when marketplace scraping is active
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6E7681] uppercase tracking-wider">
                Pool ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6E7681] uppercase tracking-wider">
                Marketplace
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6E7681] uppercase tracking-wider">
                Region
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-[#6E7681] uppercase tracking-wider cursor-pointer hover:text-[#4FF0E6] transition-colors"
                onClick={() => handleSort("lastScrapeAt")}
              >
                <div className="flex items-center gap-1">
                  Last Scrape <SortIcon columnKey="lastScrapeAt" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-[#6E7681] uppercase tracking-wider cursor-pointer hover:text-[#4FF0E6] transition-colors"
                onClick={() => handleSort("dealCount")}
              >
                <div className="flex items-center gap-1">
                  Deals <SortIcon columnKey="dealCount" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-[#6E7681] uppercase tracking-wider cursor-pointer hover:text-[#4FF0E6] transition-colors"
                onClick={() => handleSort("stalePercent")}
              >
                <div className="flex items-center gap-1">
                  Stale % <SortIcon columnKey="stalePercent" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-[#6E7681] uppercase tracking-wider cursor-pointer hover:text-[#4FF0E6] transition-colors"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-1">
                  Status <SortIcon columnKey="status" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2a2a]">
            {sortedPools.map((pool) => (
              <tr
                key={pool.poolId}
                className="hover:bg-[#0a0a0a]/50 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-[#ededed] font-mono">
                  {pool.poolId}
                </td>
                <td className="px-4 py-3 text-sm text-[#ededed] capitalize">
                  {pool.marketplace}
                </td>
                <td className="px-4 py-3 text-sm text-[#9BA7B4]">
                  {pool.region || "—"}
                </td>
                <td className="px-4 py-3 text-sm text-[#9BA7B4]">
                  {formatTimestamp(pool.lastScrapeAt)}
                </td>
                <td className="px-4 py-3 text-sm text-[#ededed] font-semibold">
                  {pool.dealCount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={
                      pool.stalePercent > 50
                        ? "text-red-400"
                        : pool.stalePercent > 20
                        ? "text-yellow-400"
                        : "text-green-400"
                    }
                  >
                    {pool.stalePercent.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <PoolStatusBadge status={pool.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="bg-[#0a0a0a] border-t border-[#2a2a2a] px-4 py-3 flex items-center justify-between text-xs text-[#6E7681]">
        <div>
          Total Pools: <span className="text-[#ededed] font-semibold">{pools.length}</span>
        </div>
        <div className="flex items-center gap-4">
          <div>
            Healthy:{" "}
            <span className="text-green-400 font-semibold">
              {pools.filter((p) => p.status === "healthy").length}
            </span>
          </div>
          <div>
            Degraded:{" "}
            <span className="text-yellow-400 font-semibold">
              {pools.filter((p) => p.status === "degraded").length}
            </span>
          </div>
          <div>
            Stale:{" "}
            <span className="text-red-400 font-semibold">
              {pools.filter((p) => p.status === "stale").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
