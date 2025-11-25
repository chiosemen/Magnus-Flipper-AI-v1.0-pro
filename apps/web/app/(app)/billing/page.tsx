"use client";

import { AppShell } from "@/components/AppShell";
import { PlanComparisonTable } from "@/components/billing/PlanComparisonTable";
import { TrialCounter } from "@/components/billing/TrialCounter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BillingPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Billing</p>
            <h1 className="text-3xl font-bold text-white">Plans & usage</h1>
          </div>
        </div>

        <TrialCounter daysLeft={7} />

        <Card className="border-border/40 bg-slate-950/70">
          <CardHeader>
            <CardTitle>Choose your plan</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanComparisonTable />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
