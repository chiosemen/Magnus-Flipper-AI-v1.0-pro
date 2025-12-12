"use client";

import { Card } from "@magnus-flipper-ai/ui/components/Card";
import type { VelocityMetrics } from "@magnus-flipper-ai/core/types/scraper";

interface VelocityChartProps {
  velocity: VelocityMetrics;
}

/**
 * VelocityChart - Displays velocity metrics visualization
 * Uses design tokens for styling
 * TODO: Integrate with Recharts for better visualization
 */
export function VelocityChart({ velocity }: VelocityChartProps) {
  const maxVelocity = Math.max(
    ...velocity.velocityTrend.map((point) => point.avgVelocity),
    100
  );

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-h5 font-heading font-semibold text-foreground capitalize mb-1">
          {velocity.marketplace} Velocity
        </h3>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-body-s text-text-secondary">Avg Velocity Score</p>
            <p className="text-h3 font-bold text-primary">{velocity.avgVelocityScore.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-body-s text-text-secondary">Top Velocity Listings</p>
            <p className="text-h3 font-bold text-success">{velocity.topVelocityListings}</p>
          </div>
        </div>
      </div>

      {/* Simple bar chart */}
      <div className="space-y-2">
        <h4 className="text-body-m font-semibold text-foreground mb-2">Velocity Trend</h4>
        <div className="flex items-end gap-1 h-32">
          {velocity.velocityTrend.slice(-24).map((point, index) => {
            const percentage = maxVelocity > 0 ? (point.avgVelocity / maxVelocity) * 100 : 0;
            return (
              <div key={index} className="flex-1 flex flex-col items-center justify-end group">
                <div
                  className="w-full bg-gradient-brand-combined rounded-t transition-all hover:opacity-80 min-h-[4px]"
                  style={{ height: `${Math.max(percentage, 2)}%` }}
                  title={`${point.timestamp}: ${point.avgVelocity.toFixed(1)} (${point.count} listings)`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-body-s text-text-secondary mt-2">
          <span>{velocity.velocityTrend[0]?.timestamp || ""}</span>
          <span>{velocity.velocityTrend[velocity.velocityTrend.length - 1]?.timestamp || ""}</span>
        </div>
      </div>
    </Card>
  );
}
