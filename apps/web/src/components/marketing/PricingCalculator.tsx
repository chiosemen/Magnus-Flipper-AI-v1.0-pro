"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type PlanId = "STARTER" | "BASIC" | "PREMIUM" | "ULTRA";

interface PlanConfig {
  id: PlanId;
  name: string;
  maxSearches: number;
  scanSpeed: "5m" | "3m" | "2m" | "instant";
  price: string;
}

const PLANS: PlanConfig[] = [
  { id: "STARTER", name: "Starter", maxSearches: 1, scanSpeed: "5m", price: "£9.99" },
  { id: "BASIC", name: "Basic", maxSearches: 3, scanSpeed: "3m", price: "£19.99" },
  { id: "PREMIUM", name: "Premium", maxSearches: 5, scanSpeed: "2m", price: "£39.99" },
  { id: "ULTRA", name: "Ultra", maxSearches: 10, scanSpeed: "instant", price: "£69.99" },
];

const MARKETPLACES = ["Facebook Marketplace", "Craigslist", "Gumtree", "Kijiji", "eBay"];

export function PricingCalculator() {
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(["Facebook Marketplace", "Craigslist"]);
  const [searches, setSearches] = useState<number[]>([3]);
  const [alertSpeed, setAlertSpeed] = useState<"normal" | "fast" | "max">("fast");
  const [daytimeOnly, setDaytimeOnly] = useState(true);

  const recommended = useMemo(() => {
    const desiredSearches = searches[0];
    const desiredSpeed = alertSpeed;

    let plan = PLANS[0];

    if (desiredSearches <= 1) {
      plan = PLANS[0];
    } else if (desiredSearches <= 3) {
      plan = PLANS[1];
    } else if (desiredSearches <= 5) {
      plan = PLANS[2];
    } else {
      plan = PLANS[3];
    }

    if (desiredSpeed === "max") {
      plan = PLANS[3];
    } else if (desiredSpeed === "fast" && plan.id === "STARTER") {
      plan = PLANS[1];
    }

    return plan;
  }, [searches, alertSpeed]);

  const scanWindowLabel = daytimeOnly ? "7am – 11pm" : "24/7 scanning";

  return (
    <section className="space-y-4">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Find your ideal flip plan</h2>
        <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
          Tell Magnus how aggressively you want to hunt and we’ll suggest the right plan. You can change this anytime.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[3fr_2fr]">
        <Card className="border-slate-800 bg-slate-950/80">
          <CardHeader>
            <h3 className="text-sm font-semibold">Your flipping setup</h3>
            <p className="text-xs text-slate-300">
              Choose marketplaces, number of searches, and how fast you want alerts to fire.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-slate-400">Marketplaces</Label>
              <div className="flex flex-wrap gap-2">
                {MARKETPLACES.map((mkt) => {
                  const active = selectedMarkets.includes(mkt);
                  return (
                    <button
                      key={mkt}
                      type="button"
                      onClick={() =>
                        setSelectedMarkets((prev) => (prev.includes(mkt) ? prev.filter((x) => x !== mkt) : [...prev, mkt]))
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

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <Label className="uppercase tracking-wide text-slate-400">Saved searches</Label>
                <span className="font-semibold text-slate-100">{searches[0]} searches</span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  value={searches[0]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const clamped = Math.min(10, Math.max(1, Number.isNaN(val) ? 1 : val));
                    setSearches([clamped]);
                  }}
                  className="w-28 bg-slate-900/80"
                />
                <p className="text-[11px] text-slate-400">
                  Think of each saved search as a dedicated radar for one flip niche or price band.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wide text-slate-400">Alert speed</Label>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { id: "normal", label: "Standard", desc: "Balanced scanning" },
                  { id: "fast", label: "Fast", desc: "Competitive edge" },
                  { id: "max", label: "Max", desc: "Aggressive 24/7" },
                ].map((opt) => {
                  const active = alertSpeed === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAlertSpeed(opt.id as "normal" | "fast" | "max")}
                      className={`flex flex-col items-start gap-1 rounded-lg border px-3 py-2 transition ${
                        active
                          ? "border-cyan-400 bg-cyan-500/10 text-cyan-100"
                          : "border-slate-700 bg-slate-900/60 text-slate-200 hover:border-slate-500"
                      }`}
                    >
                      <span className="text-xs font-semibold">{opt.label}</span>
                      <span className="text-[11px] text-slate-400">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
              <div className="space-y-1">
                <Label className="text-xs text-slate-200">Scan window</Label>
                <p className="text-[11px] text-slate-400">{scanWindowLabel}. 24/7 is best for ultra-competitive niches.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Daytime only</span>
                <Switch checked={!daytimeOnly} onCheckedChange={(val) => setDaytimeOnly(!val)} />
                <span className="text-[11px] text-slate-400">24/7</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/40 bg-slate-950/90 shadow-xl shadow-cyan-900/40">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Recommended plan for you</h3>
              <Badge className="bg-cyan-500 text-[10px] font-bold uppercase tracking-wide text-slate-950">Live quote</Badge>
            </div>
            <p className="text-xs text-slate-300">Based on your marketplaces, number of searches and alert speed.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-slate-400">Plan</p>
              <p className="text-2xl font-bold text-slate-50">{recommended.name}</p>
              <p className="text-sm text-slate-300">
                {recommended.price}
                <span className="text-xs text-slate-400"> / month</span>
              </p>
            </div>

            <div className="space-y-2 rounded-lg bg-slate-900/80 p-3 text-xs text-slate-200">
              <div className="flex justify-between">
                <span>Saved searches</span>
                <span>
                  Up to <span className="font-semibold">{recommended.maxSearches}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span>Alert scan speed</span>
                <span className="font-semibold">
                  {recommended.scanSpeed === "instant" ? "Instant scanning" : `Every ${recommended.scanSpeed}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Marketplaces</span>
                <span className="font-semibold">{selectedMarkets.length} selected</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              You can adjust this later from your billing page as your flipping operation grows.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full rounded-full text-sm font-semibold">Start 7-day free trial</Button>
            <p className="text-center text-[10px] text-slate-400">
              No setup fee. Cancel anytime. Trials auto-convert to {recommended.name}.
            </p>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
