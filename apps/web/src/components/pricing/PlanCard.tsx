import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SubscriptionPlan } from "@magnus-flipper-ai/core";

const PLAN_METADATA: Record<
  SubscriptionPlan,
  { name: string; displayName: string; description: string }
> = {
  STARTER: {
    name: "STARTER",
    displayName: "Starter",
    description: "Perfect for casual flippers getting started",
  },
  BASIC: {
    name: "BASIC",
    displayName: "Basic",
    description: "Great for regular marketplace monitoring",
  },
  PREMIUM: {
    name: "PREMIUM",
    displayName: "Premium",
    description: "Professional tier for serious flippers",
  },
  ULTRA: {
    name: "ULTRA",
    displayName: "Ultra",
    description: "Maximum power for professional resellers",
  },
};

const PLAN_LIMITS: Record<
  SubscriptionPlan,
  { maxSavedSearches: number; maxActiveSearches: number; maxResultsPerRun: number; minRunIntervalMinutes: number }
> = {
  STARTER: { maxSavedSearches: 3, maxActiveSearches: 1, maxResultsPerRun: 10, minRunIntervalMinutes: 60 },
  BASIC: { maxSavedSearches: 10, maxActiveSearches: 5, maxResultsPerRun: 20, minRunIntervalMinutes: 30 },
  PREMIUM: { maxSavedSearches: 30, maxActiveSearches: 20, maxResultsPerRun: 50, minRunIntervalMinutes: 10 },
  ULTRA: { maxSavedSearches: 100, maxActiveSearches: 100, maxResultsPerRun: 100, minRunIntervalMinutes: 5 },
};

interface PlanCardProps {
  plan: SubscriptionPlan;
  price: string;
  highlight?: boolean;
  onUpgrade: (plan: SubscriptionPlan) => void;
  onTrial?: () => void;
  showTrial?: boolean;
}

export function PlanCard({ plan, price, highlight, onUpgrade, onTrial, showTrial }: PlanCardProps) {
  const meta = PLAN_METADATA[plan];
  const limits = PLAN_LIMITS[plan];
  return (
    <Card
      className={`flex h-full flex-col border-slate-800 bg-slate-950/80 ${
        highlight ? "ring-2 ring-cyan-400/70 shadow-xl shadow-cyan-900/40" : "shadow-md shadow-black/40"
      }`}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{meta.displayName}</CardTitle>
          {highlight && (
            <Badge className="bg-cyan-500 text-[10px] font-semibold uppercase tracking-wide text-slate-950">
              Most Popular
            </Badge>
          )}
        </div>
        <p className="text-sm text-slate-300">{meta.description}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-xs text-slate-400">/ month</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col space-y-4 text-sm text-slate-200">
        <ul className="space-y-2">
          <li>✓ Up to {limits.maxSavedSearches} saved searches</li>
          <li>✓ {limits.maxActiveSearches} active searches</li>
          <li>✓ {limits.maxResultsPerRun} results per run</li>
          <li>✓ Scans every {limits.minRunIntervalMinutes} min</li>
        </ul>
        <div className="mt-auto space-y-2">
          <Button className="w-full rounded-full" onClick={() => onUpgrade(plan)}>
            Upgrade now
          </Button>
          {showTrial && onTrial && (
            <Button variant="outline" className="w-full rounded-full" onClick={onTrial}>
              Start free trial
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
