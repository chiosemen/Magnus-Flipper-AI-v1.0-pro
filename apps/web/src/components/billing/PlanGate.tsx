"use client";

import { ReactNode } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PlanGateProps {
  children: ReactNode;
  allowed: boolean;
  featureLabel?: string;
}

export function PlanGate({ children, allowed, featureLabel }: PlanGateProps) {
  if (allowed) return <>{children}</>;

  return (
    <div className="relative">
      <div className="absolute inset-0 z-10 rounded-lg bg-slate-950/60 backdrop-blur-sm" />
      <div className="absolute inset-0 z-20 flex items-end justify-end p-3">
        <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-200 shadow-lg">
          <Lock className="h-4 w-4 text-amber-300" />
          <span>Upgrade to unlock {featureLabel || "this feature"}</span>
          <Button variant="outline" size="sm" className="rounded-full border-amber-300 text-amber-100" asChild>
            <a href="/billing">Billing</a>
          </Button>
        </div>
      </div>
      <div className={cn("opacity-60", "pointer-events-none")}>{children}</div>
    </div>
  );
}
