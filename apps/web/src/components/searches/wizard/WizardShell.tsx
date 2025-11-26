"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STEPS = [
  "Category",
  "Marketplace",
  "Keywords",
  "Filters",
  "Frequency",
  "Notifications",
  "Review",
] as const;

interface WizardShellProps {
  currentStep: number;
  children: ReactNode;
}

export function WizardShell({ currentStep, children }: WizardShellProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Create Saved Search</h1>
        <p className="text-sm text-slate-300">Step {currentStep + 1} of {STEPS.length}</p>
      </div>
      <Card className="border-slate-800 bg-slate-950/70">
        <CardContent className="p-4">
          <ol className="flex flex-wrap items-center gap-2">
            {STEPS.map((label, idx) => (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
                  idx === currentStep
                    ? "border-cyan-400 bg-cyan-500/10 text-cyan-100"
                    : idx < currentStep
                    ? "border-slate-600 bg-slate-900/80 text-slate-100"
                    : "border-slate-800 bg-slate-950 text-slate-500"
                )}
              >
                <span className="font-semibold">{idx + 1}</span>
                <span>{label}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
      {children}
    </div>
  );
}
