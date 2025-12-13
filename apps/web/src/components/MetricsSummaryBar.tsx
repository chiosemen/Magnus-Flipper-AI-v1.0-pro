"use client";

import { Card } from "@magnus-flipper-ai/ui/components";

interface Metric {
  label: string;
  value: string;
}

interface MetricsSummaryBarProps {
  metrics: Metric[];
}

export function MetricsSummaryBar({ metrics }: MetricsSummaryBarProps) {
  return (
    <Card className="p-6 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="text-center">
            <p className="text-h6 font-semibold text-foreground">{metric.value}</p>
            <p className="text-body-s text-text-secondary mt-1">{metric.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
