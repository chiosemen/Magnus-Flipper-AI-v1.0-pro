"use client";

import { Button } from "@magnus-flipper-ai/ui/components";
import { Card } from "@magnus-flipper-ai/ui/components";
import { useState } from "react";
import { useScraperPerformance } from "@/hooks/useScraperPerformance";
import { useScraperVelocity } from "@/hooks/useScraperVelocity";
import { useScraperFingerprints } from "@/hooks/useScraperFingerprints";
import { PerformanceMetrics } from "./PerformanceMetrics";
import { VelocityChart } from "./VelocityChart";
import { FingerprintStats } from "./FingerprintStats";
import { ScraperHealth } from "./ScraperHealth";
import type { PerformanceSummary } from "@magnus-flipper-ai/core/types/scraper";

/**
 * ScraperPerformanceDashboard - Main scraper performance dashboard component
 */
export function ScraperPerformanceDashboard() {
  const [timeWindow, setTimeWindow] = useState<string>("24h");
  const [selectedMarketplace, setSelectedMarketplace] = useState<string | undefined>(undefined);

  const { data: performanceData, isLoading: performanceLoading } = useScraperPerformance(
    selectedMarketplace,
    timeWindow
  );
  const { data: velocityData, isLoading: velocityLoading } = useScraperVelocity(
    selectedMarketplace,
    timeWindow
  );
  const { data: fingerprintsData, isLoading: fingerprintsLoading } = useScraperFingerprints(
    selectedMarketplace,
    timeWindow
  );

  const summary: PerformanceSummary = performanceData?.summary || {
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    avgDuration: 0,
    avgListingsPerRun: 0,
    avgSuccessRate: 0,
    marketplaces: [],
  };

  const snapshots = performanceData?.snapshots || [];
  const velocity = velocityData?.velocity;
  const fingerprints = fingerprintsData?.fingerprints;

  if (performanceLoading || velocityLoading || fingerprintsLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-surfaceSubtle rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-surfaceSubtle rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Window Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-body-m font-semibold text-foreground">Time Window:</span>
          {(["1h", "6h", "24h", "7d"] as const).map((window) => (
            <Button
              key={window}
              variant={timeWindow === window ? "default" : "secondary"}
              size="sm"
              onClick={() => setTimeWindow(window)}
            >
              {window}
            </Button>
          ))}
          {summary.marketplaces.length > 0 && (
            <>
              <span className="text-body-m font-semibold text-foreground ml-4">Marketplace:</span>
              <Button
                variant={selectedMarketplace === undefined ? "default" : "secondary"}
                size="sm"
                onClick={() => setSelectedMarketplace(undefined)}
              >
                All
              </Button>
              {summary.marketplaces.map((mp) => (
                <Button
                  key={mp}
                  variant={selectedMarketplace === mp ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setSelectedMarketplace(mp)}
                >
                  {mp}
                </Button>
              ))}
            </>
          )}
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-body-s text-text-secondary mb-1">Total Runs</div>
          <div className="text-h3 font-bold text-foreground">{summary.totalRuns}</div>
        </Card>
        <Card className="p-6">
          <div className="text-body-s text-text-secondary mb-1">Success Rate</div>
          <div className="text-h3 font-bold text-success">
            {(summary.avgSuccessRate * 100).toFixed(1)}%
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-body-s text-text-secondary mb-1">Avg Duration</div>
          <div className="text-h3 font-bold text-foreground">
            {(summary.avgDuration / 1000).toFixed(1)}s
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-body-s text-text-secondary mb-1">Avg Listings/Run</div>
          <div className="text-h3 font-bold text-primary">{summary.avgListingsPerRun.toFixed(0)}</div>
        </Card>
      </div>

      {/* Scraper Health */}
      {snapshots.length > 0 && <ScraperHealth snapshots={snapshots} />}

      {/* Performance Metrics */}
      {snapshots.length > 0 && <PerformanceMetrics snapshots={snapshots} />}

      {/* Velocity Charts */}
      {velocity && (
        <div>
          {Array.isArray(velocity) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {velocity.map((v) => (
                <VelocityChart key={v.marketplace} velocity={v} />
              ))}
            </div>
          ) : (
            <VelocityChart velocity={velocity} />
          )}
        </div>
      )}

      {/* Fingerprint Stats */}
      {fingerprints && (
        <div>
          {Array.isArray(fingerprints) ? (
            <FingerprintStats fingerprints={fingerprints} />
          ) : (
            <FingerprintStats fingerprints={[fingerprints]} />
          )}
        </div>
      )}
    </div>
  );
}
