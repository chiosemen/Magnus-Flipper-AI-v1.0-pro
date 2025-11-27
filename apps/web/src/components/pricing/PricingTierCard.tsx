"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PricingTierCardProps {
  name: string;
  headline?: string;
  price: string;
  period?: string;
  features: string[];
  isMostPopular?: boolean;
  ctaLabel: string;
  onSelect?: () => void;
  footerNote?: string;
  ctaHref?: string;
}

export function PricingTierCard({
  name,
  headline,
  price,
  period = "mo",
  features,
  isMostPopular,
  ctaLabel,
  onSelect,
  footerNote,
  ctaHref,
}: PricingTierCardProps) {
  return (
    <Card
      className={`relative flex h-full flex-col overflow-hidden border border-transparent bg-slate-950/85 ${
        isMostPopular ? "ring-2 ring-cyan-400/70 shadow-xl shadow-cyan-900/40" : "shadow-md shadow-black/30"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/5 bg-gradient-to-r from-indigo-500/10 via-transparent to-cyan-500/10" />
      <Card
        className="flex h-full flex-col border-slate-800 bg-transparent shadow-none"
      >
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{name}</CardTitle>
            {isMostPopular && (
            <Badge className="bg-cyan-500 text-[10px] font-semibold uppercase tracking-wide text-slate-950">
              Most Popular
            </Badge>
          )}
        </div>
        {headline && <p className="text-sm text-slate-300">{headline}</p>}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-xs text-slate-400">/ {period}</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col space-y-4 text-sm">
        <ul className="space-y-2 text-slate-200">
          {features.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400/80" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto space-y-2">
          {ctaHref ? (
            <Button asChild className="w-full rounded-full">
              <a href={ctaHref}>{ctaLabel}</a>
            </Button>
          ) : (
            <Button className="w-full rounded-full" onClick={onSelect}>
              {ctaLabel}
            </Button>
          )}
          {footerNote && <p className="text-[11px] text-slate-400">{footerNote}</p>}
        </div>
      </CardContent>
      </Card>
    </Card>
  );
}
