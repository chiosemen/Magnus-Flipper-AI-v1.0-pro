"use client";

import { Button } from "@/components/ui/button";

type Status = "todo" | "in_progress" | "done";

type OnboardingStepCardProps = {
  stepNumber: number;
  title: string;
  description: string;
  status: Status;
  ctaLabel: string;
  onCtaClick: () => void;
};

const statusMap: Record<Status, string> = {
  todo: "border-muted",
  in_progress: "border-cyan-300",
  done: "border-emerald-400",
};

export function OnboardingStepCard({
  stepNumber,
  title,
  description,
  status,
  ctaLabel,
  onCtaClick,
}: OnboardingStepCardProps) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm transition ${statusMap[status]}`}
    >
      <div className="flex items-center justify-between">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
          {stepNumber}
        </div>
        <span
          className={`text-xs font-semibold uppercase ${
            status === "done" ? "text-emerald-500" : status === "in_progress" ? "text-cyan-400" : "text-muted-foreground"
          }`}
        >
          {status === "done" ? "Done" : status === "in_progress" ? "In progress" : "Todo"}
        </span>
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button onClick={onCtaClick} variant={status === "done" ? "outline" : "default"}>
        {ctaLabel}
      </Button>
    </div>
  );
}
