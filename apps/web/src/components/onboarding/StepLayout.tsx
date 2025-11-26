"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StepLayoutProps {
  title: string;
  description?: string;
  step: number;
  total: number;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  backLabel?: string;
  children: ReactNode;
  disableNext?: boolean;
}

export function StepLayout({
  title,
  description,
  step,
  total,
  onNext,
  onBack,
  onSkip,
  nextLabel = "Next",
  backLabel = "Back",
  children,
  disableNext,
}: StepLayoutProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-cyan-300">
            Step {step + 1} of {total}
          </p>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
          {description && <p className="text-sm text-slate-300">{description}</p>}
        </div>
        {onSkip && (
          <Button variant="ghost" className="text-sm text-slate-300" onClick={onSkip}>
            Skip onboarding
          </Button>
        )}
      </div>

      <Card className="border-slate-800 bg-slate-950/80">
        <CardContent className="p-6 space-y-4">{children}</CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" className="rounded-full" onClick={onBack} disabled={!onBack}>
          {backLabel}
        </Button>
        <Button className={cn("rounded-full", disableNext && "opacity-50")} onClick={onNext} disabled={disableNext}>
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
