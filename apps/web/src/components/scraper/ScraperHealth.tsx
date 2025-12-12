"use client";

import { Card } from "@magnus-flipper-ai/ui/components/Card";
import { Badge } from "@magnus-flipper-ai/ui/components";
import type { PerformanceSnapshot } from "@magnus-flipper-ai/core/types/scraper";

interface ScraperHealthProps {
  snapshots: PerformanceSnapshot[];
}

/**
 * ScraperHealth - Displays scraper health status
 * Uses design tokens for consistent styling
 */
export function ScraperHealth({ snapshots }: ScraperHealthProps) {
  if (snapshots.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <p className="text-body-m text-text-secondary">No health data available</p>
        </div>
      </Card>
    );
  }

  // Get latest snapshot per marketplace
  const marketplaceLatest = new Map<string, PerformanceSnapshot>();
  snapshots.forEach((snapshot) => {
    const mp = snapshot.marketplace;
    const existing = marketplaceLatest.get(mp);
    if (!existing || new Date(snapshot.timestamp) > new Date(existing.timestamp)) {
      marketplaceLatest.set(mp, snapshot);
    }
  });

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from(marketplaceLatest.entries()).map(([marketplace, snapshot]) => (
        <Card key={marketplace} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-h5 font-heading font-semibold text-foreground capitalize">
              {marketplace}
            </h3>
            <Badge className={getHealthColor(snapshot.health.status)}>
              {snapshot.health.status.toUpperCase()}
            </Badge>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-body-s text-text-secondary">Success Rate</span>
                <span className="text-body-m font-semibold text-success">
                  {(snapshot.health.successRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-surfaceSubtle rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-success transition-all"
                  style={{ width: `${snapshot.health.successRate * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-body-s text-text-secondary">Error Rate</span>
                <span className="text-body-m font-semibold text-destructive">
                  {(snapshot.health.errorRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-surfaceSubtle rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-destructive transition-all"
                  style={{ width: `${snapshot.health.errorRate * 100}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between text-body-s">
                <span className="text-text-secondary">Avg Latency</span>
                <span className="text-foreground font-medium">
                  {snapshot.health.avgLatency.toFixed(0)}ms
                </span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
