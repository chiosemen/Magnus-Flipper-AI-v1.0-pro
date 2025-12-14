"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Stack } from "@/components/ui/stack";

export interface Metric {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

interface MetricsSummaryBarProps {
  metrics: Metric[];
}

export function MetricsSummaryBar({ metrics }: MetricsSummaryBarProps) {
  return (
    <div className="w-full overflow-x-auto">
      <Stack direction="row" spacing={4} className="min-w-max sm:min-w-0">
        {metrics.map((metric, index) => (
          <Card key={index} className="min-w-[140px] sm:min-w-[180px] flex-1">
            <CardContent className="p-4 sm:p-6">
              <Stack direction="column" spacing={2}>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="text-2xl sm:text-3xl font-bold">{metric.value}</p>
                {metric.change && (
                  <p
                    className={`text-xs sm:text-sm ${
                      metric.changeType === "positive"
                        ? "text-success"
                        : metric.changeType === "negative"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {metric.change}
                  </p>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </div>
  );
}
