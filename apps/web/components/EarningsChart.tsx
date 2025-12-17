"use client";

import { Card } from "@magnus-flipper-ai/ui/components";

interface EarningsChartProps {
  data?: any[];
  period?: string;
}

export function EarningsChart({ data = [], period }: EarningsChartProps) {
  return (
    <Card className="p-6">
      <div className="h-64 flex items-center justify-center">
        <p className="text-text-secondary">Earnings chart will be displayed here</p>
      </div>
    </Card>
  );
}
