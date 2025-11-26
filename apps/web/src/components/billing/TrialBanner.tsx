"use client";

import { differenceInDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SubscriptionPlan } from "@magnus-flipper-ai/core";
import { startCheckout } from "@/lib/api/billing";
import { useState } from "react";

interface TrialBannerProps {
  plan?: string | null;
  status?: string | null;
  trialExpiresAt?: string | null;
  defaultUpgradeTarget?: SubscriptionPlan;
}

export function TrialBanner({
  plan,
  status,
  trialExpiresAt,
  defaultUpgradeTarget = "BASIC",
}: TrialBannerProps) {
  const [loading, setLoading] = useState(false);
  const isTrial =
    (plan && plan.toLowerCase() === "trial") || (status && status.toLowerCase().includes("trial"));

  if (!isTrial) return null;

  const daysLeft = trialExpiresAt ? Math.max(0, differenceInDays(new Date(trialExpiresAt), new Date())) : null;

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const { url } = await startCheckout(defaultUpgradeTarget);
      window.location.href = url;
    } catch (err) {
      alert("Could not start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-amber-500/40 bg-amber-500/10">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500 text-xs font-semibold text-slate-900">Trial</Badge>
            {daysLeft !== null && (
              <p className="text-sm text-amber-50">
                {daysLeft} day{daysLeft === 1 ? "" : "s"} left
              </p>
            )}
          </div>
          <p className="text-sm text-amber-50/90">
            Upgrade now to keep scans running at full speed.
          </p>
        </div>
        <Button className="rounded-full" onClick={handleUpgrade} disabled={loading}>
          {loading ? "Redirecting..." : "Upgrade now"}
        </Button>
      </CardContent>
    </Card>
  );
}
