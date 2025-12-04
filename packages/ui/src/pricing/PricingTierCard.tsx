"use client";

import React from "react";
import { BadgeMostPopular } from "./BadgeMostPopular.js";
import { FeatureRow } from "./FeatureRow.js";

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
}: PricingTierCardProps) {
  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/85 p-4 ${
        isMostPopular ? "ring-2 ring-cyan-400/70 shadow-xl shadow-cyan-900/40" : "shadow-md shadow-black/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xl font-semibold text-white">{name}</p>
        {isMostPopular && <BadgeMostPopular />}
      </div>
      {headline && <p className="mt-2 text-sm text-slate-300">{headline}</p>}
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white">{price}</span>
        <span className="text-xs text-slate-400">/ {period}</span>
      </div>
      <ul className="mt-3 flex-1 space-y-2 text-sm text-slate-200">
        {features.map((item) => (
          <FeatureRow key={item} text={item} />
        ))}
      </ul>
      <div className="mt-auto space-y-2">
        <button
          className="w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900"
          onClick={onSelect}
        >
          {ctaLabel}
        </button>
        {footerNote && <p className="text-[11px] text-slate-400">{footerNote}</p>}
      </div>
    </div>
  );
}
