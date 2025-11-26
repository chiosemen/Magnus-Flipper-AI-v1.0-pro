"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SubscriptionPlan } from "@magnus-flipper-ai/core";
import { TrialBanner } from "./TrialBanner";
import { BillingPortalButton } from "./BillingPortalButton";
import { Button } from "@/components/ui/button";

interface PlanSummaryProps {
  plan: SubscriptionPlan | string;
  status?: string;
  trialExpiresAt?: string | null;
  onUpgrade?: (plan: SubscriptionPlan) => void;
  upgradingPlan?: SubscriptionPlan | null;
}

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  STARTER: "Starter",
  BASIC: "Basic",
  PREMIUM: "Premium",
  ULTRA: "Ultra",
};

export function PlanSummary({ plan, status, trialExpiresAt, onUpgrade, upgradingPlan }: PlanSummaryProps) {
  const planLabel = PLAN_LABELS[plan as SubscriptionPlan] || plan;

  return (
    <Card className="border-slate-800 bg-slate-950/80">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl">
            Current plan
            <Badge variant="secondary">{planLabel}</Badge>
          </CardTitle>
          <p className="text-sm text-slate-300">Status: {status || "Active"}</p>
        </div>
        <Badge className="bg-cyan-500/20 text-cyan-200">Live</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <TrialBanner plan={typeof plan === "string" ? plan : undefined} status={status} trialExpiresAt={trialExpiresAt} />
        <div className="flex flex-wrap gap-2">
          {(["STARTER", "BASIC", "PREMIUM", "ULTRA"] as SubscriptionPlan[]).map((tier) => (
            <Button
              key={tier}
              variant={tier === plan ? "secondary" : "outline"}
              size="sm"
              onClick={() => onUpgrade?.(tier)}
              disabled={upgradingPlan === tier}
            >
              {upgradingPlan === tier ? "Redirecting..." : `Switch to ${PLAN_LABELS[tier]}`}
            </Button>
          ))}
        </div>
        <BillingPortalButton />
      </CardContent>
    </Card>
  );
}
