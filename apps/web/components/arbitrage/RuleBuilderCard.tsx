"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type MarketOption = {
  id: string;
  label: string;
};

type RuleBuilderCardProps = {
  markets: MarketOption[];
};

export function RuleBuilderCard({ markets }: RuleBuilderCardProps) {
  const [buyMarket, setBuyMarket] = useState(markets[0]?.id ?? "facebook");
  const [sellMarket, setSellMarket] = useState(markets[1]?.id ?? "vinted");
  const [minProfitPct, setMinProfitPct] = useState("18");
  const [minProfitAbs, setMinProfitAbs] = useState("45");
  const [location, setLocation] = useState("London");
  const [radiusMiles, setRadiusMiles] = useState("25");

  const geoSummary = useMemo(() => {
    const locationLabel = location.trim() || "London";
    const radiusLabel = radiusMiles.trim() || "25";
    return `${locationLabel} - ${radiusLabel} mi`;
  }, [location, radiusMiles]);

  return (
    <Card className="border-white/10 bg-[#121621] text-white">
      <CardHeader>
        <CardTitle className="text-xl">Rule Builder</CardTitle>
        <CardDescription className="text-white/60">
          Define a market pair and profit thresholds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-white/50">
              Buy market
            </label>
            <select
              className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              value={buyMarket}
              onChange={(event) => setBuyMarket(event.target.value)}
            >
              {markets.map((market) => (
                <option key={market.id} value={market.id}>
                  {market.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-white/50">
              Sell market
            </label>
            <select
              className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              value={sellMarket}
              onChange={(event) => setSellMarket(event.target.value)}
            >
              {markets.map((market) => (
                <option key={market.id} value={market.id}>
                  {market.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-white/50">
              Min profit %
            </label>
            <Input
              type="number"
              min="0"
              value={minProfitPct}
              onChange={(event) => setMinProfitPct(event.target.value)}
              className="border-white/10 bg-black/40 text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-white/50">
              Min profit GBP/USD
            </label>
            <Input
              type="number"
              min="0"
              value={minProfitAbs}
              onChange={(event) => setMinProfitAbs(event.target.value)}
              className="border-white/10 bg-black/40 text-white"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-white/50">
              Location
            </label>
            <Input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="border-white/10 bg-black/40 text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-white/50">
              Radius (miles)
            </label>
            <Input
              type="number"
              min="1"
              value={radiusMiles}
              onChange={(event) => setRadiusMiles(event.target.value)}
              className="border-white/10 bg-black/40 text-white"
            />
          </div>
        </div>

        <div className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/70">
          Geo summary: {geoSummary}
        </div>
        <div className="text-xs text-white/50">
          Current pairing: {buyMarket} to {sellMarket}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="text-xs text-white/50">
          Phase 4 backend pending
        </div>
        <Button
          disabled
          title="Phase 4 backend pending"
          className="bg-white/10 text-white hover:bg-white/10"
        >
          Save rule
        </Button>
      </CardFooter>
    </Card>
  );
}
