"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SubscriptionPlan } from "@magnus-flipper-ai/core";

type ResultsBoxProps = {
  marketplaces: number;
  keywords: number;
  freqMinutes: number;
  windowMinutes: number;
  estimatedFlips: number;
  supportedSearches: number;
  recommendedPlan: SubscriptionPlan;
};

export function ResultsBox({
  marketplaces,
  keywords,
  freqMinutes,
  windowMinutes,
  estimatedFlips,
  supportedSearches,
  recommendedPlan,
}: ResultsBoxProps) {
  return (
    <Card className="h-full border-cyan-500/40 bg-gradient-to-br from-slate-950 to-slate-900">
      <CardHeader>
        <CardTitle className="text-lg text-white">Your estimate</CardTitle>
        <p className="text-sm text-slate-300">
          Calculated from marketplaces, keyword breadth, and scan speed. Adjust inputs to see impact.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="Estimated flips/month" value={`${estimatedFlips}+`} />
          <Metric label="Supported searches" value={`${supportedSearches}+`} />
          <Metric label="Marketplaces selected" value={String(marketplaces)} />
          <Metric label="Keywords tracked" value={String(keywords)} />
          <Metric label="Scan every" value={`${freqMinutes} min`} />
          <Metric label="Alert window" value={`${windowMinutes} min`} />
        </div>
        <div className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-cyan-200">Recommended plan</p>
          <p className="text-2xl font-semibold text-white">{recommendedPlan}</p>
          <p className="text-sm text-cyan-100/90">
            Higher plans increase scan frequency, larger alert windows, and more saved searches.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
