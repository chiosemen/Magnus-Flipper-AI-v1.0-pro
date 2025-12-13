"use client";

import { Card } from "@magnus-flipper-ai/ui/components";
import { Badge } from "@magnus-flipper-ai/ui/components";
import type { PerformanceSnapshot } from "@magnus-flipper-ai/core/types/scraper";

interface PerformanceMetricsProps {
  snapshots: PerformanceSnapshot[];
}

/**
 * PerformanceMetrics - Displays scraper performance metrics
 * Uses design tokens for consistent styling
 */
export function PerformanceMetrics({ snapshots }: PerformanceMetricsProps) {
  if (snapshots.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <p className="text-body-m text-text-secondary">No performance data available</p>
        </div>
      </Card>
    );
  }

  // Group by marketplace
  const marketplaceGroups = new Map<string, PerformanceSnapshot[]>();
  snapshots.forEach((snapshot) => {
    const mp = snapshot.marketplace;
    if (!marketplaceGroups.has(mp)) {
      marketplaceGroups.set(mp, []);
    }
    marketplaceGroups.get(mp)!.push(snapshot);
  });

  return (
    <div className="space-y-4">
      {Array.from(marketplaceGroups.entries()).map(([marketplace, items]) => {
        const latest = items[0];
        const avgDuration = items.reduce((sum, s) => sum + s.metrics.duration, 0) / items.length;
        const avgSuccessRate =
          items.reduce((sum, s) => sum + s.health.successRate, 0) / items.length;
        const avgListings = items.reduce((sum, s) => sum + s.metrics.listingsSaved, 0) / items.length;

        const getHealthColor = (status: string) => {
          switch (status) {
            case "healthy":
              return "bg-success/20 text-success";
            case "degraded":
              return "bg-warning/20 text-warning";
            case "down":
              return "bg-destructive/20 text-destructive";
            default:
              return "bg-surfaceSubtle text-text-secondary";
          }
        };

        return (
          <Card key={marketplace} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-h5 font-heading font-semibold text-foreground capitalize">
                {marketplace}
              </h3>
              <Badge className={getHealthColor(latest.health.status)}>
                {latest.health.status.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-body-s text-text-secondary mb-1">Avg Duration</p>
                <p className="text-h4 font-bold text-foreground">
                  {(avgDuration / 1000).toFixed(1)}s
                </p>
              </div>
              <div>
                <p className="text-body-s text-text-secondary mb-1">Success Rate</p>
                <p className="text-h4 font-bold text-success">
                  {(avgSuccessRate * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-body-s text-text-secondary mb-1">Avg Listings</p>
                <p className="text-h4 font-bold text-foreground">{avgListings.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-body-s text-text-secondary mb-1">Total Runs</p>
                <p className="text-h4 font-bold text-foreground">{items.length}</p>
              </div>
            </div>

            {/* Latest Run Details */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-body-s">
                <div>
                  <span className="text-text-secondary">Requests:</span>{" "}
                  <span className="text-foreground font-medium">{latest.metrics.requestsMade}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Rate Limits:</span>{" "}
                  <span className="text-warning font-medium">
                    {latest.metrics.rateLimitHits}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Errors:</span>{" "}
                  <span className="text-destructive font-medium">{latest.metrics.errors}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Latency:</span>{" "}
                  <span className="text-foreground font-medium">
                    {latest.health.avgLatency.toFixed(0)}ms
                  </span>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
