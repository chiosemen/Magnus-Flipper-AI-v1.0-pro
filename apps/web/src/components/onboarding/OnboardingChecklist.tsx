"use client";

import { useRouter } from "next/navigation";
import { OnboardingStepCard } from "./OnboardingStepCard";

type OnboardingChecklistProps = {
  searchesCount: number;
  alertsCount: number;
  hasListings: boolean;
};

export function OnboardingChecklist({ searchesCount, alertsCount, hasListings }: OnboardingChecklistProps) {
  const router = useRouter();

  const step1Status = searchesCount > 0 ? "done" : "todo";
  const step2Status = searchesCount > 0 && alertsCount > 0 ? "done" : step1Status === "done" ? "in_progress" : "todo";
  const step3Status = step2Status === "done" && hasListings ? "done" : step2Status === "done" ? "in_progress" : "todo";

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <OnboardingStepCard
        stepNumber={1}
        title="Define your hunting ground"
        description="Pick your marketplace, category, and filters to start scanning."
        status={step1Status as any}
        ctaLabel="Create search"
        onCtaClick={() => router.push("/searches/new")}
      />
      <OnboardingStepCard
        stepNumber={2}
        title="Turn on live alerts"
        description="Get notified when new matches arrive."
        status={step2Status as any}
        ctaLabel="Open alerts"
        onCtaClick={() => router.push("/alerts")}
      />
      <OnboardingStepCard
        stepNumber={3}
        title="Review your first deals"
        description="Inspect fresh listings and calculate your margin."
        status={step3Status as any}
        ctaLabel="View results"
        onCtaClick={() => router.push("/results")}
      />
    </div>
  );
}
