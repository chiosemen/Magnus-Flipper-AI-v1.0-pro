import { Card } from "@magnus-flipper-ai/ui/components";

export interface Metric {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

interface MetricsSummaryBarProps {
  metrics: Metric[];
}

/**
 * MetricsSummaryBar - Displays key metrics in a horizontal bar
 * Uses design tokens for consistent styling
 */
export function MetricsSummaryBar({ metrics }: MetricsSummaryBarProps) {
  return (
    <div className="w-full overflow-x-auto mb-8">
      <div className="flex gap-4 min-w-max sm:min-w-0">
        {metrics.map((metric, index) => (
          <Card key={index} className="min-w-[140px] sm:min-w-[180px] flex-1 p-4 sm:p-6">
            <div className="space-y-2">
              <p className="text-body-s text-text-secondary">{metric.label}</p>
              <p className="text-h3 font-bold text-foreground">{metric.value}</p>
              {metric.change && (
                <p
                  className={`text-body-s ${
                    metric.changeType === "positive"
                      ? "text-success"
                      : metric.changeType === "negative"
                      ? "text-destructive"
                      : "text-text-muted"
                  }`}
                >
                  {metric.change}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
