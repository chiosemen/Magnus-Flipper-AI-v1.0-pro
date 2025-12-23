/**
 * Scraper Activity Panel
 *
 * Displays live scraper activity in a user-safe, read-only format.
 * Shows marketplace coverage, last scan times, and discovery metrics.
 * No internal worker names or technical details.
 */

"use client";

import { Clock, Activity, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./flipbomb/ui/card";
import { motion } from "framer-motion";
import { fadeRiseVariants, prefersReducedMotion } from "@/lib/motion";

interface ScraperHealthData {
  marketplace: string;
  status: "active" | "paused" | "error";
  last_run_at: string | null;
  last_success_at: string | null;
  error_rate: number;
}

interface ScraperActivityProps {
  scraperHealth: ScraperHealthData[];
  discoveredListings24h?: number;
}

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return "Never";

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Get status badge color
 */
function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "paused":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "error":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

/**
 * Scraper Activity Panel Component
 */
export function ScraperActivity({
  scraperHealth = [],
  discoveredListings24h = 0
}: ScraperActivityProps) {
  const activeMarketplaces = scraperHealth.filter(
    (s) => s.status === "active"
  ).length;

  // Find most recent scan time
  const recentScans = scraperHealth
    .map((s) => s.last_success_at)
    .filter((t): t is string => t !== null)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const lastScanTime = recentScans[0] || null;

  return (
    <motion.div
      initial={prefersReducedMotion() ? false : "hidden"}
      animate={prefersReducedMotion() ? false : "visible"}
      variants={fadeRiseVariants}
    >
      <Card className="bg-[#1a1a1a] border border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-[#4FF0E6]" />
            Live Discovery Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-[#a0a0a0]">
                <CheckCircle2 className="w-4 h-4" />
                Active Marketplaces
              </div>
              <div className="text-2xl font-bold text-[#ededed]">
                {activeMarketplaces}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-[#a0a0a0]">
                <TrendingUp className="w-4 h-4" />
                Discovered (24h)
              </div>
              <div className="text-2xl font-bold text-[#ededed]">
                {discoveredListings24h.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Last Scan Time */}
          <div className="pt-2 border-t border-[#2a2a2a]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#a0a0a0] flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Last Scan
              </span>
              <span className="text-[#ededed] font-medium">
                {formatRelativeTime(lastScanTime)}
              </span>
            </div>
          </div>

          {/* Marketplace Status List */}
          {scraperHealth.length > 0 && (
            <div className="pt-2 border-t border-[#2a2a2a] space-y-2">
              <div className="text-sm font-medium text-[#a0a0a0]">
                Marketplace Coverage
              </div>
              <div className="space-y-2">
                {scraperHealth.map((health) => (
                  <div
                    key={health.marketplace}
                    className="flex items-center justify-between p-2 rounded bg-[#0a0a0a] border border-[#2a2a2a]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="capitalize font-medium text-[#ededed] text-sm">
                        {health.marketplace}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(
                          health.status
                        )}`}
                      >
                        {health.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#a0a0a0]">
                      {formatRelativeTime(health.last_success_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {scraperHealth.length === 0 && (
            <div className="text-center py-6 text-sm text-[#a0a0a0]">
              No marketplace activity data available
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
