"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarketplaceSelect } from "@/components/pricing/MarketplaceSelect";
import { FeatureSlider } from "@/components/pricing/FeatureSlider";
import { ResultsBox } from "@/components/pricing/ResultsBox";
import type { SubscriptionPlan } from "@magnus-flipper-ai/core";

export function PriceCalculator() {
  const [marketplaces, setMarketplaces] = useState<string[]>(["Facebook Marketplace"]);
  const [keywords, setKeywords] = useState<number>(4);
  const [freqMinutes, setFreqMinutes] = useState<number>(5);
  const [windowMinutes, setWindowMinutes] = useState<number>(15);

  const recommended = useMemo<SubscriptionPlan>(() => {
    let plan: SubscriptionPlan = "STARTER";
    if (marketplaces.length > 1) plan = "BASIC";
    if (keywords > 8) plan = "PREMIUM";
    if (freqMinutes <= 5) plan = "ULTRA";
    return plan;
  }, [marketplaces.length, keywords, freqMinutes]);

  const estimatedFlips = Math.max(5, Math.round((marketplaces.length * keywords * (60 / freqMinutes)) / 4));
  const supportedSearches =
    recommended === "STARTER" ? 3 : recommended === "BASIC" ? 10 : recommended === "PREMIUM" ? 30 : 100;

  return (
    <Card className="border-slate-800 bg-slate-950/85">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Pricing calculator</CardTitle>
        <p className="text-sm text-slate-300">
          Tune marketplaces, keywords, and scan speed to find your ideal plan. Higher tiers increase scan frequency and
          alert window coverage.
        </p>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <MarketplaceSelect value={marketplaces} onChange={setMarketplaces} />

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">Keywords</p>
            <Input
              type="number"
              min={1}
              max={30}
              value={keywords}
              onChange={(e) => setKeywords(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
            />
            <p className="text-[11px] text-slate-500">More keywords expand coverage; higher plans fit larger sets.</p>
          </div>

          <FeatureSlider
            label="Search frequency (minutes)"
            value={freqMinutes}
            min={1}
            max={60}
            onChange={setFreqMinutes}
          />

          <FeatureSlider
            label="Alert window (minutes)"
            value={windowMinutes}
            min={1}
            max={60}
            onChange={setWindowMinutes}
          />

          <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Higher plans increase scan frequency & alert window size. Choose a plan that fits your deal velocity.
          </div>

          <Button asChild className="w-full rounded-full bg-white text-slate-900 hover:bg-slate-100">
            <a href="/signin?trial=1">Start 7-Day Free Trial</a>
          </Button>
        </div>

        <ResultsBox
          marketplaces={marketplaces.length}
          keywords={keywords}
          freqMinutes={freqMinutes}
          windowMinutes={windowMinutes}
          estimatedFlips={estimatedFlips}
          supportedSearches={supportedSearches}
          recommendedPlan={recommended}
        />
      </CardContent>
    </Card>
  );
}
