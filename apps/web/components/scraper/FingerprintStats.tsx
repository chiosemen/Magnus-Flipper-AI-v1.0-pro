"use client";

import { Card } from "@magnus-flipper-ai/ui/components";
import { Badge } from "@magnus-flipper-ai/ui/components";
import type { FingerprintStats } from "@magnus-flipper-ai/core/types/scraper";

interface FingerprintStatsProps {
  fingerprints: FingerprintStats[];
}

/**
 * FingerprintStats - Displays fingerprint statistics
 * Uses design tokens for consistent styling
 */
export function FingerprintStats({ fingerprints }: FingerprintStatsProps) {
  if (fingerprints.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <p className="text-body-m text-text-secondary">No fingerprint data available</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {fingerprints.map((stats) => (
        <Card key={stats.marketplace} className="p-6">
          <h3 className="text-h5 font-heading font-semibold text-foreground capitalize mb-4">
            {stats.marketplace}
          </h3>

          {/* Summary Stats */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-body-s text-text-secondary">Total Fingerprints</span>
              <span className="text-body-m font-semibold text-foreground">
                {stats.totalFingerprints.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-s text-text-secondary">Unique Fingerprints</span>
              <span className="text-body-m font-semibold text-success">
                {stats.uniqueFingerprints.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-s text-text-secondary">Duplicate Rate</span>
              <Badge
                className={
                  stats.duplicateRate > 0.3
                    ? "bg-warning/20 text-warning"
                    : stats.duplicateRate > 0.1
                    ? "bg-info/20 text-info"
                    : "bg-success/20 text-success"
                }
              >
                {(stats.duplicateRate * 100).toFixed(1)}%
              </Badge>
            </div>
          </div>

          {/* Distribution */}
          {stats.fingerprintDistribution.length > 0 && (
            <div className="pt-4 border-t border-border">
              <h4 className="text-body-m font-semibold text-foreground mb-2">
                Top Hash Prefixes
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {stats.fingerprintDistribution.slice(0, 5).map((dist, index) => (
                  <div key={index} className="flex items-center justify-between text-body-s">
                    <code className="text-text-secondary font-mono text-xs">
                      {dist.hashPrefix}...
                    </code>
                    <span className="text-foreground font-medium">{dist.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
