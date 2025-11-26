import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SubscriptionPlan } from "@magnus-flipper-ai/core";
import { format } from "date-fns";

interface PlanStatusProps {
  plan?: SubscriptionPlan;
  status?: string;
  trialExpiresAt?: string | null;
  renewsAt?: string | null;
}

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  STARTER: "Starter",
  BASIC: "Basic",
  PREMIUM: "Premium",
  ULTRA: "Ultra",
};

export function PlanStatus({ plan = "STARTER", status, trialExpiresAt, renewsAt }: PlanStatusProps) {
  const isTrial = Boolean(trialExpiresAt);
  const renewLabel = isTrial
    ? trialExpiresAt
      ? `Trial ends ${format(new Date(trialExpiresAt), "MMM d, yyyy")}`
      : "Trial active"
    : renewsAt
    ? `Renews ${format(new Date(renewsAt), "MMM d, yyyy")}`
    : "Billing info unavailable";

  return (
    <Card className="border-border/40 bg-slate-950/80">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          Current Plan <Badge variant="secondary">{PLAN_LABELS[plan]}</Badge>
        </CardTitle>
        {isTrial && <Badge className="bg-amber-500/20 text-amber-200">Trial</Badge>}
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>Status: {status || "Active"}</p>
        <p>{renewLabel}</p>
      </CardContent>
    </Card>
  );
}
