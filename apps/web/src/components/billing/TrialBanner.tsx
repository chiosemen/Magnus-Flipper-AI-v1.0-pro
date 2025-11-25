"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { startSevenDayTrial } from "@/lib/billingClient";

interface TrialBannerProps {
  trialExpiresAt?: string | null;
}

function daysLeft(trialExpiresAt?: string | null): number | null {
  if (!trialExpiresAt) return null;
  const end = new Date(trialExpiresAt).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function TrialBanner({ trialExpiresAt }: TrialBannerProps) {
  const [loading, setLoading] = useState(false);
  const [localExpires, setLocalExpires] = useState<string | null>(trialExpiresAt ?? null);

  const remaining = useMemo(() => daysLeft(localExpires), [localExpires]);
  const hasActiveTrial = remaining !== null && remaining > 0;

  async function handleStartTrial() {
    try {
      setLoading(true);
      const res = await startSevenDayTrial();
      setLocalExpires(res.trial_expires_at);
    } catch (err) {
      console.error("Failed to start trial", err);
      alert("Could not start trial. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (hasActiveTrial) {
    return (
      <Card className="border-emerald-500/40 bg-emerald-500/5">
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500 text-[10px] font-semibold text-slate-950">Trial active</Badge>
              <p className="text-xs text-emerald-200">
                {remaining} day{remaining === 1 ? "" : "s"} left
              </p>
            </div>
            <p className="text-sm text-emerald-50">
              Explore every feature, run real searches and alerts. We&apos;ll remind you before your trial ends.
            </p>
          </div>
          <CardFooter className="p-0">
            <p className="text-[11px] text-emerald-200/80">
              After your trial, you&apos;ll stay on Starter unless you pick a higher plan.
            </p>
          </CardFooter>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-cyan-500/40 bg-cyan-500/5">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Badge className="bg-cyan-500 text-[10px] font-semibold text-slate-950">New to Magnus?</Badge>
          <p className="text-sm text-cyan-50">
            Start a 7-day free trial and let Magnus watch the marketplaces for you — before you commit to a paid plan.
          </p>
          <p className="text-[11px] text-cyan-100/80">
            No card lock-in. Cancel in a couple of clicks. We don&apos;t resell your data.
          </p>
        </div>
        <CardFooter className="flex flex-col gap-2 p-0 sm:items-end">
          <Button
            size="sm"
            className="rounded-full px-5 text-xs font-semibold"
            disabled={loading}
            onClick={handleStartTrial}
          >
            {loading ? "Starting trial..." : "Start 7-day free trial"}
          </Button>
          <p className="text-[10px] text-cyan-100/80">Trial applies to your current account, not per device.</p>
        </CardFooter>
      </CardContent>
    </Card>
  );
}
