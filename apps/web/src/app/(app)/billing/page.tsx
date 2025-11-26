"use client";

import { useMemo, useState } from "react";
import type { SubscriptionPlan } from "@magnus-flipper-ai/core";
import { usePlan } from "@/hooks/use-plan";
import { useBilling } from "@/lib/queries/useBilling";
import { startCheckout, openCustomerPortal } from "@/lib/api/billing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const PLAN_ORDER: SubscriptionPlan[] = ["STARTER", "BASIC", "PREMIUM", "ULTRA"];

const PLAN_LIMITS: Record<
  SubscriptionPlan,
  { maxSavedSearches: number; maxActiveSearches: number; maxResultsPerRun: number; minRunIntervalMinutes: number }
> = {
  STARTER: { maxSavedSearches: 3, maxActiveSearches: 1, maxResultsPerRun: 10, minRunIntervalMinutes: 60 },
  BASIC: { maxSavedSearches: 10, maxActiveSearches: 5, maxResultsPerRun: 20, minRunIntervalMinutes: 30 },
  PREMIUM: { maxSavedSearches: 30, maxActiveSearches: 20, maxResultsPerRun: 50, minRunIntervalMinutes: 10 },
  ULTRA: { maxSavedSearches: 100, maxActiveSearches: 100, maxResultsPerRun: 100, minRunIntervalMinutes: 5 },
};

const PLAN_METADATA: Record<
  SubscriptionPlan,
  { displayName: string; description: string; price?: { monthly: number; currency: string } }
> = {
  STARTER: {
    displayName: "Starter",
    description: "Perfect for casual flippers getting started",
    price: { monthly: 9.99, currency: "USD" },
  },
  BASIC: {
    displayName: "Basic",
    description: "Great for regular marketplace monitoring",
    price: { monthly: 19.99, currency: "USD" },
  },
  PREMIUM: {
    displayName: "Premium",
    description: "Professional tier for serious flippers",
    price: { monthly: 39.99, currency: "USD" },
  },
  ULTRA: {
    displayName: "Ultra",
    description: "Maximum power for professional resellers",
    price: { monthly: 69.99, currency: "USD" },
  },
};

const priceLabel = (plan: SubscriptionPlan) => {
  const meta = PLAN_METADATA[plan];
  if (meta.price?.monthly) {
    const symbol = meta.price.currency === "USD" ? "$" : meta.price.currency;
    return `${symbol}${meta.price.monthly}`;
  }
  return "";
};

export default function BillingPage() {
  const { plan, limits, usage } = usePlan();
  const { data: billing } = useBilling();
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const currentPlan: SubscriptionPlan = plan || "STARTER";
  const trialing = billing?.status?.toLowerCase().includes("trial");

  const usageRows = useMemo(() => {
    if (!limits) return [];
    return [
      { label: "Saved searches", value: `${usage?.savedSearches ?? 0} / ${limits.maxSavedSearches}` },
      { label: "Active searches", value: `${usage?.activeSearches ?? 0} / ${limits.maxActiveSearches}` },
      { label: "Results per run", value: `${limits.maxResultsPerRun}` },
      { label: "Scan interval", value: `${limits.minRunIntervalMinutes} min` },
    ];
  }, [limits, usage]);

  const handleUpgrade = async (target: SubscriptionPlan) => {
    setError(null);
    try {
      setLoadingPlan(target);
      const { url } = await startCheckout(target);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handlePortal = async () => {
    try {
      setPortalLoading(true);
      const { url } = await openCustomerPortal();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open portal.");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-16 pt-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wide text-cyan-300">Billing</p>
          <h1 className="text-3xl font-bold">Manage your Magnus plan</h1>
          <p className="text-sm text-slate-300">
            Current plan: {PLAN_METADATA[currentPlan].displayName}
            {trialing ? " (Trial)" : ""}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Card className="border-slate-800 bg-slate-950/80">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-xl">Usage & limits</CardTitle>
              <Badge variant="secondary">{PLAN_METADATA[currentPlan].displayName}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {usageRows.length === 0 && <p className="text-sm text-slate-300">Usage data unavailable.</p>}
              {usageRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm text-slate-200">
                  <span className="text-slate-300">{row.label}</span>
                  <span className="font-semibold text-white">{row.value}</span>
                </div>
              ))}
              <Separator className="bg-slate-800" />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="rounded-full" onClick={handlePortal} disabled={portalLoading}>
                  {portalLoading ? "Opening portal..." : "Open customer portal"}
                </Button>
                {trialing && (
                  <Badge className="bg-amber-500/20 text-amber-100">
                    Trial active {billing?.trial_expires_at ? `• ends ${new Date(billing.trial_expires_at).toLocaleDateString()}` : ""}
                  </Badge>
                )}
              </div>
              {error && <p className="text-sm text-rose-300">{error}</p>}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-950/80">
            <CardHeader>
              <CardTitle className="text-xl">Plan actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-200">
              <p>Upgrade to faster scans and more saved searches.</p>
              <div className="flex flex-wrap gap-2">
                {trialing && (
                  <Badge className="bg-amber-500/20 text-amber-100">
                    Trial active • upgrade anytime
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-white">Plans</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {PLAN_ORDER.map((p) => {
              const limitsForPlan = PLAN_LIMITS[p];
              const meta = PLAN_METADATA[p];
              const isCurrent = currentPlan === p;
              const highlight = p === "PREMIUM";
              return (
                <Card
                  key={p}
                  className={`flex h-full flex-col border-slate-800 bg-slate-950/80 ${
                    highlight ? "ring-2 ring-cyan-400/70 shadow-cyan-900/30" : ""
                  }`}
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{meta.displayName}</CardTitle>
                      {isCurrent ? (
                        <Badge variant="secondary">Current</Badge>
                      ) : highlight ? (
                        <Badge className="bg-cyan-500 text-slate-950">Most Popular</Badge>
                      ) : null}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{priceLabel(p)}</span>
                      <span className="text-xs text-slate-400">/ month</span>
                    </div>
                    <p className="text-sm text-slate-300">{meta.description}</p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col space-y-3 text-sm text-slate-200">
                    <ul className="space-y-2">
                      <li>✓ Up to {limitsForPlan.maxSavedSearches} saved searches</li>
                      <li>✓ {limitsForPlan.maxActiveSearches} active searches</li>
                      <li>✓ {limitsForPlan.maxResultsPerRun} results per run</li>
                      <li>✓ Scans every {limitsForPlan.minRunIntervalMinutes} min</li>
                    </ul>
                    <div className="mt-auto">
                      <Button
                        className="w-full rounded-full"
                        variant={isCurrent ? "outline" : "default"}
                        disabled={isCurrent || loadingPlan === p}
                        onClick={() => handleUpgrade(p)}
                      >
                        {isCurrent ? "Current plan" : loadingPlan === p ? "Redirecting..." : "Upgrade"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
