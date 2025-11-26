"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OnboardingStepMarketplaceProps {
  value: string[];
  onChange: (next: string[]) => void;
  onNext: () => void;
}

const MARKETPLACES = ["Facebook Marketplace", "Craigslist", "Gumtree", "OfferUp", "Kijiji"];

export function OnboardingStepMarketplace({ value, onChange, onNext }: OnboardingStepMarketplaceProps) {
  const toggle = (mkt: string) => {
    onChange(value.includes(mkt) ? value.filter((x) => x !== mkt) : [...value, mkt]);
  };

  return (
    <Card className="border-slate-800 bg-slate-950/80">
      <CardHeader>
        <CardTitle>Select marketplaces</CardTitle>
        <p className="text-sm text-slate-300">Pick where Magnus should scan for flips.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {MARKETPLACES.map((mkt) => {
            const active = value.includes(mkt);
            return (
              <button
                key={mkt}
                type="button"
                onClick={() => toggle(mkt)}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  active
                    ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
                    : "border-slate-700 bg-slate-900/60 text-slate-200"
                }`}
              >
                {mkt}
              </button>
            );
          })}
        </div>
        <Button className="rounded-full" onClick={onNext} disabled={value.length === 0}>
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}
