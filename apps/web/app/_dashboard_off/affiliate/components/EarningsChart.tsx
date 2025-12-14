"use client";

import { Card } from "@magnus-flipper-ai/ui/components";
import type { EarningsDataPoint, EarningsPeriod } from "@/types/affiliate";

interface EarningsChartProps {
  data: EarningsDataPoint[];
  period: EarningsPeriod;
}

/**
 * EarningsChart - Displays earnings over time
 * Uses design tokens for styling
 * TODO: Integrate with charting library (Recharts) for visual charts
 */
export function EarningsChart({ data, period }: EarningsChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-h4 font-heading font-semibold text-foreground mb-4">
          Earnings Over Time
        </h3>
        <div className="text-center py-12">
          <p className="text-body-m text-text-secondary">No earnings data available</p>
        </div>
      </Card>
    );
  }

  const totalEarnings = data.reduce((sum, point) => sum + point.earnings, 0);
  const maxEarnings = Math.max(...data.map((p) => p.earnings), 0);

  return (
    <Card className="p-6">
      <h3 className="text-h4 font-heading font-semibold text-foreground mb-4">
        Earnings Over Time ({period})
      </h3>
      <div className="space-y-4">
        {/* Simple bar chart representation */}
        <div className="space-y-2">
          {data.slice(0, 10).map((point, index) => {
            const percentage = maxEarnings > 0 ? (point.earnings / maxEarnings) * 100 : 0;
            return (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-body-s text-text-secondary">
                  {new Date(point.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="flex-1 h-8 bg-surfaceSubtle rounded-md relative overflow-hidden">
                  <div
                    className="h-full bg-gradient-brand-combined rounded-md transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-20 text-right text-body-m font-semibold text-foreground">
                  ${point.earnings.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-body-m text-text-secondary">Total</span>
            <span className="text-h3 font-bold text-success">${totalEarnings.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
