"use client";

import { Card } from "@/marketing-swoopa/components/ui/card";

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
