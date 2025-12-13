"use client";

import { useState } from "react";
import { Button } from "@magnus-flipper-ai/ui/components";
import { Card } from "@magnus-flipper-ai/ui/components";
import { useAffiliateEarnings } from "@/hooks/useAffiliateEarnings";
import { EarningsChart } from "../../../components/EarningsChart";
import { MetricsSummaryBar } from "../../../components/MetricsSummaryBar";
import type { EarningsPeriod } from "@magnus-flipper-ai/core/types/affiliate";

/**
 * Affiliate Earnings Content - Client component with period filtering
 */
export function AffiliateEarningsContent() {
  const [period, setPeriod] = useState<EarningsPeriod>("7d");
  const { data, isLoading, error } = useAffiliateEarnings(period);

  if (isLoading) {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-surfaceSubtle rounded w-24 mb-2"></div>
              <div className="h-8 bg-surfaceSubtle rounded w-32"></div>
            </Card>
          ))}
        </div>
        <Card className="p-6 animate-pulse">
          <div className="h-64 bg-surfaceSubtle rounded"></div>
        </Card>
      </>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <p className="text-body-m text-text-secondary mb-4">
            Failed to load earnings data. Please try again later.
          </p>
          <Button variant="default" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const metrics = data?.metrics || [];
  const earningsData = data?.earningsData || [];

  return (
    <>
      {/* Metrics Summary */}
      <MetricsSummaryBar metrics={metrics} />

      {/* Period Filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        {(['7d', '30d', '90d', 'all'] as EarningsPeriod[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "secondary"}
            size="sm"
            onClick={() => setPeriod(p)}
          >
            {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : p === "90d" ? "90 Days" : "All Time"}
          </Button>
        ))}
      </div>

      {/* Earnings Chart */}
      <EarningsChart data={earningsData} period={period} />

      {/* Additional Stats */}
      {data?.topPerformers && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="p-6">
            <h3 className="text-h5 font-heading font-semibold text-foreground mb-2">
              Top Performing Link
            </h3>
            <div className="space-y-2">
              <p className="text-body-s text-text-secondary">
                {data.topPerformers.links[0]?.link?.name || "N/A"}
              </p>
              <p className="text-h3 font-bold text-success">
                ${data.topPerformers.links[0]?.revenue?.toFixed(2) || "0.00"}
              </p>
              <p className="text-body-s text-text-muted">
                {data.topPerformers.links[0]?.conversions || 0} conversions
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-h5 font-heading font-semibold text-foreground mb-2">
              Conversion Rate
            </h3>
            <div className="space-y-2">
              <p className="text-body-s text-text-secondary">Overall</p>
              <p className="text-h3 font-bold text-primary">
                {data.metrics?.conversionRate?.toFixed(2) || "0.00"}%
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-h5 font-heading font-semibold text-foreground mb-2">
              Next Payout
            </h3>
            <div className="space-y-2">
              <p className="text-body-s text-text-secondary">Scheduled</p>
              <p className="text-h3 font-bold text-foreground">
                ${data.metrics?.pendingPayout?.toFixed(2) || "0.00"}
              </p>
              <p className="text-body-s text-text-muted">Due in 5 days</p>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
