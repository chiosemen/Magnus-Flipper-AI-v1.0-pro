"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrialBanner } from "@/components/billing/TrialBanner";
import { createCheckoutSession, openBillingPortal } from "@/lib/billingClient";

type PlanId = "STARTER" | "BASIC" | "PREMIUM" | "ULTRA";

interface Plan {
  id: PlanId;
  name: string;
  price: string;
  tagline: string;
  searches: string;
  findTime: string;
  bestFor: string;
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "STARTER",
    name: "Starter",
    price: "£9.99",
    tagline: "Kickstart your flipping journey.",
    searches: "1 saved search",
    findTime: "Every 5 minutes",
    bestFor: "Curious beginners & testers.",
  },
  {
    id: "BASIC",
    name: "Basic",
    price: "£19.99",
    tagline: "Beat casual competition.",
    searches: "3 saved searches",
    findTime: "Every 3 minutes",
    bestFor: "Side-hustlers doing regular flips.",
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: "£39.99",
    tagline: "Operate like a small flipping shop.",
    searches: "5 saved searches",
    findTime: "Every 2 minutes",
    bestFor: "Serious resellers scaling up.",
    highlight: true,
  },
  {
    id: "ULTRA",
    name: "Ultra",
    price: "£69.99",
    tagline: "Full-time, multi-category domination.",
    searches: "10 saved searches",
    findTime: "Instant scanning",
    bestFor: "Full-time operators & teams.",
  },
];

export default function PlanPage() {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  async function handleUpgrade(planId: PlanId) {
    try {
      setLoadingPlan(planId);
      const { url } = await createCheckoutSession(planId);
      window.location.href = url;
    } catch (err) {
      console.error("Checkout failed", err);
      alert("Could not start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handlePortal() {
    try {
      setPortalLoading(true);
      const { url } = await openBillingPortal();
      window.location.href = url;
    } catch (err) {
      console.error("Portal error", err);
      alert("Could not open billing portal. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <TrialBanner trialExpiresAt={undefined} />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your Magnus plan</h1>
          <p className="max-w-xl text-sm text-slate-300 sm:text-base">
            Switch plans as your flipping operation grows. Charges and upgrades are handled securely by Stripe.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="self-start border-slate-600 text-xs sm:self-auto"
          onClick={handlePortal}
          disabled={portalLoading}
        >
          {portalLoading ? "Opening portal..." : "Manage billing in Stripe"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col border-slate-800 bg-slate-950/80 ${
              plan.highlight ? "ring-2 ring-cyan-400/80 shadow-xl shadow-cyan-900/40" : "shadow-md shadow-black/40"
            }`}
          >
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{plan.name}</h3>
                {plan.highlight && (
                  <Badge className="bg-cyan-500 text-[10px] font-semibold uppercase tracking-wide text-slate-950">
                    Most popular
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-300">{plan.tagline}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{plan.price}</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 text-xs text-slate-300">
              <div className="rounded-md bg-slate-900/70 p-3">
                <div className="flex justify-between">
                  <span>Saved searches</span>
                  <span className="font-semibold text-slate-50">{plan.searches}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span>Find time*</span>
                  <span className="font-semibold text-slate-50">{plan.findTime}</span>
                </div>
              </div>
              <ul className="space-y-1">
                <li>✓ Smart spam filtering</li>
                <li>✓ Multi-market monitoring</li>
                <li>✓ Unified results feed</li>
                <li>✓ Alert history &amp; stats</li>
              </ul>
              <p className="text-[10px] text-slate-500">*Average alert time. Actual speed depends on marketplace limits.</p>
            </CardContent>
            <CardFooter className="mt-2 flex flex-col gap-2">
              <Button
                className="w-full rounded-full text-sm font-semibold"
                onClick={() => handleUpgrade(plan.id)}
                disabled={loadingPlan === plan.id}
              >
                {loadingPlan === plan.id ? "Redirecting to Stripe..." : "Upgrade with Stripe"}
              </Button>
              <p className="text-center text-[10px] text-slate-500">You&apos;ll be redirected to a secure Stripe checkout page.</p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
