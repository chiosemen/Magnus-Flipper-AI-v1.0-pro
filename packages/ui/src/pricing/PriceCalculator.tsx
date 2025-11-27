"use client";

import React, { useMemo, useState, ChangeEvent } from "react";

type PlanId = "STARTER" | "BASIC" | "PREMIUM" | "ULTRA";

const MARKETPLACES = ["Facebook Marketplace", "Craigslist", "Gumtree", "OfferUp", "Kijiji", "eBay"];

interface PriceCalculatorProps {
  onPlanSuggested?: (planId: PlanId) => void;
}

export function PriceCalculator({ onPlanSuggested }: PriceCalculatorProps) {
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(["Facebook Marketplace", "Craigslist"]);
  const [keywordCount, setKeywordCount] = useState(3);
  const [instant, setInstant] = useState(true);
  const [coverage, setCoverage] = useState<"local" | "regional" | "national">("regional");

  const recommended = useMemo(() => {
    let plan: PlanId = "STARTER";
    if (keywordCount <= 2 && !instant) plan = "STARTER";
    else if (keywordCount <= 5) plan = "BASIC";
    else if (keywordCount <= 8) plan = "PREMIUM";
    else plan = "ULTRA";
    if (instant && plan !== "ULTRA") plan = "PREMIUM";
    if (selectedMarkets.length > 3) plan = "ULTRA";
    if (onPlanSuggested) onPlanSuggested(plan);
    return plan;
  }, [keywordCount, instant, selectedMarkets.length, onPlanSuggested]);

  const coverageLabel =
    coverage === "local" ? "Local radius" : coverage === "regional" ? "Regional coverage" : "Nationwide sweep";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Pricing calculator</p>
        <p className="text-sm text-slate-300">Tune how aggressively you want to scan; we’ll suggest a plan.</p>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-slate-400">Marketplaces</p>
        <div className="flex flex-wrap gap-2">
          {MARKETPLACES.map((mkt) => {
            const active = selectedMarkets.includes(mkt);
            return (
              <button
                key={mkt}
                type="button"
                onClick={() =>
                  setSelectedMarkets((prev) =>
                    prev.includes(mkt) ? prev.filter((x) => x !== mkt) : [...prev, mkt]
                  )
                }
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

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-400">Keywords to track</p>
        <input
          type="number"
          min={1}
          max={12}
          value={keywordCount}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setKeywordCount(Math.max(1, Math.min(12, Number(e.target.value))))
          }
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
        />
        <p className="text-[11px] text-slate-400">
          Each saved search can include multiple keywords; add more for broader coverage.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3">
        <div>
          <p className="text-sm text-slate-100">Instant alerts</p>
          <p className="text-xs text-slate-400">Faster scans suggest higher tiers.</p>
        </div>
        <input
          type="checkbox"
          checked={instant}
          onChange={(e) => setInstant(e.target.checked)}
          className="h-4 w-4"
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-slate-400">Coverage window</p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {["local", "regional", "national"].map((scope) => {
            const active = coverage === scope;
            return (
              <button
                key={scope}
                type="button"
                onClick={() => setCoverage(scope as any)}
                className={`rounded-lg border px-3 py-2 ${
                  active
                    ? "border-cyan-400 bg-cyan-500/10 text-cyan-100"
                    : "border-slate-700 bg-slate-900/60 text-slate-200"
                }`}
              >
                {scope === "local" ? "Local" : scope === "regional" ? "Regional" : "National"}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400">{coverageLabel}</p>
      </div>

      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
        <p className="text-xs uppercase tracking-wide text-cyan-300">Recommended plan</p>
        <p className="text-2xl font-semibold text-slate-50">{recommended}</p>
        <p className="text-sm text-slate-200">
          Based on {selectedMarkets.length} marketplaces, {keywordCount} keywords,{" "}
          {instant ? "instant" : "standard"} alerts, {coverageLabel.toLowerCase()}.
        </p>
        <button
          className="mt-3 w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900"
          onClick={() => onPlanSuggested?.(recommended)}
        >
          Start 7-day free trial
        </button>
      </div>
    </div>
  );
}
