"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { SubscriptionPlan } from "@magnus-flipper-ai/core";

const MARKETPLACES = ["Facebook Marketplace", "OfferUp", "Craigslist", "Gumtree"];

const PRICES: Record<SubscriptionPlan, string> = {
  STARTER: "£9.99",
  BASIC: "£19.99",
  PREMIUM: "£39.99",
  ULTRA: "£69.99",
};

const PLAN_NAMES: Record<SubscriptionPlan, string> = {
  STARTER: "Starter",
  BASIC: "Basic",
  PREMIUM: "Premium",
  ULTRA: "Ultra",
};

interface PricingCalculatorProps {
  onPlanSuggested?: (plan: SubscriptionPlan) => void;
}

export function PricingCalculator({ onPlanSuggested }: PricingCalculatorProps) {
  const [markets, setMarkets] = useState<string[]>(["Facebook Marketplace", "Craigslist"]);
  const [keywords, setKeywords] = useState(3);
  const [instant, setInstant] = useState(true);
  const [radius, setRadius] = useState(25);

  const recommended = useMemo<SubscriptionPlan>(() => {
    let plan: SubscriptionPlan = "STARTER";
    if (keywords > 3) plan = "BASIC";
    if (keywords > 5 || markets.length > 2) plan = "PREMIUM";
    if (instant && (markets.length > 3 || keywords > 7)) plan = "ULTRA";
    if (onPlanSuggested) onPlanSuggested(plan);
    return plan;
  }, [keywords, markets.length, instant, onPlanSuggested]);

  const toggleMarket = (mkt: string) => {
    setMarkets((prev) => (prev.includes(mkt) ? prev.filter((x) => x !== mkt) : [...prev, mkt]));
  };

  return (
    <Card className="border-slate-800 bg-slate-950/80">
      <CardHeader>
        <CardTitle className="text-lg">Pricing calculator</CardTitle>
        <p className="text-sm text-slate-300">Tune how aggressively you want to scan.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-400">Marketplaces</p>
          <div className="flex flex-wrap gap-2">
            {MARKETPLACES.map((mkt) => {
              const active = markets.includes(mkt);
              return (
                <button
                  key={mkt}
                  type="button"
                  onClick={() => toggleMarket(mkt)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    active
                      ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
                      : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {mkt}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">Keywords</p>
            <Input
              type="number"
              min={1}
              max={12}
              value={keywords}
              onChange={(e) => setKeywords(Math.max(1, Math.min(12, Number(e.target.value))))}
            />
            <p className="text-[11px] text-slate-400">More keywords suggest higher tiers.</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">Radius (miles)</p>
            <Input
              type="number"
              min={5}
              max={250}
              value={radius}
              onChange={(e) => setRadius(Math.max(5, Math.min(250, Number(e.target.value))))}
            />
            <p className="text-[11px] text-slate-400">Use tighter radius for local flips.</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">Instant alerts</p>
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
              <span className="text-sm text-slate-200">{instant ? "On" : "Off"}</span>
              <Switch checked={instant} onChange={(e) => setInstant((e.target as HTMLInputElement).checked)} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-cyan-300">Recommended</p>
          <p className="text-2xl font-semibold text-slate-50">{PLAN_NAMES[recommended]}</p>
          <p className="text-sm text-slate-200">
            Based on {markets.length} marketplaces, {keywords} keywords, {instant ? "instant" : "standard"} alerts,
            {` ${radius} mile radius.`}
          </p>
          <p className="text-sm font-semibold text-cyan-200">Price: {PRICES[recommended]}/mo</p>
          <Button className="mt-3 rounded-full text-sm font-semibold" asChild>
            <a href="/pricing">Start free trial</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
