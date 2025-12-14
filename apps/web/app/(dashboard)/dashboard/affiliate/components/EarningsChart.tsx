"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Stack } from "../../../../components/ui/stack";

export interface EarningsDataPoint {
  date: string;
  amount: number;
}

interface EarningsChartProps {
  data: EarningsDataPoint[];
  period: "7d" | "30d" | "90d" | "all";
}

export function EarningsChart({ data, period }: EarningsChartProps) {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings Over Time</CardTitle>
        <CardDescription>
          {period === "7d" && "Last 7 days"}
          {period === "30d" && "Last 30 days"}
          {period === "90d" && "Last 90 days"}
          {period === "all" && "All time"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-end justify-between h-[200px] gap-1 sm:gap-2">
            {data.map((point, index) => {
              const height = (point.amount / maxAmount) * 100;
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center justify-end group"
                  role="img"
                  aria-label={`${point.date}: $${point.amount.toFixed(2)}`}
                >
                  <div
                    className="w-full bg-primary rounded-t transition-all hover:opacity-80 min-h-[4px]"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  <span className="text-xs text-muted-foreground mt-1 hidden sm:block">
                    {point.date}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground sm:hidden">
            <span>{data[0]?.date}</span>
            <span>{data[data.length - 1]?.date}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
