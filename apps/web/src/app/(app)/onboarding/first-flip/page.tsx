"use client";

import { Badge } from "@/components/ui/badge";
import { FirstFlipLayout } from "@/components/onboarding/FirstFlipLayout";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { useSavedSearches } from "@/lib/queries/useSavedSearches";
import { useAlerts } from "@/lib/queries/useAlerts";
import { useListingsFeed } from "@/lib/queries/useListings";
import { usePlan } from "@/lib/queries/usePlan";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FirstFlipOnboardingPage() {
  const { searches } = useSavedSearches();
  const { alerts } = useAlerts();
  const { feed } = useListingsFeed({ page: 1, pageSize: 6 });
  const { plan } = usePlan();

  const searchesCount = searches?.length ?? 0;
  const alertsCount = alerts?.length ?? 0;
  const hasListings = !!(feed?.listings && feed.listings.length > 0);

  const planLabel =
    plan?.toLowerCase() === "trial"
      ? "7-day trial"
      : plan
      ? `${plan.charAt(0)}${plan.slice(1).toLowerCase()} plan`
      : null;

  return (
    <FirstFlipLayout>
      <div className="space-y-4">
        {planLabel ? (
          <Badge variant="outline" className="bg-muted/40 text-xs">
            {planLabel}
          </Badge>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your First Flip, Step-by-Step</h1>
        <p className="max-w-2xl text-muted-foreground">
          We’ll guide you from zero to your first profitable flip. Follow the checklist to get searches, alerts, and
          fresh listings flowing.
        </p>
        <div className="inline-flex gap-3">
          <Button asChild>
            <Link href="/searches/new">Create search</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/billing">Upgrade</Link>
          </Button>
        </div>
      </div>

      <OnboardingChecklist
        searchesCount={searchesCount}
        alertsCount={alertsCount}
        hasListings={hasListings}
      />
    </FirstFlipLayout>
  );
}
