"use client";

import { cn } from "@/lib/utils";
import type { TierConfig } from "@/lib/pricing/constants";
import { usePricingRegion } from "@/lib/hooks/usePricingRegion";
import { FeatureCheck } from "./FeatureCheck";

interface PricingCardProps {
  tier: TierConfig;
  onSelect?: () => void;
}

export function PricingCard({ tier, onSelect }: PricingCardProps) {
  const { formatPrice, region } = usePricingRegion();
  const price = region === "uk" ? tier.price.uk : tier.price.us;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 backdrop-blur-sm transition-all duration-200",
        tier.isPopular
          ? "border-emerald-500/50 bg-emerald-950/20 ring-1 ring-emerald-500/20"
          : tier.badge === "Best Value"
            ? "border-amber-500/50 bg-amber-950/20 ring-1 ring-amber-500/20"
            : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
      )}
    >
      {/* Badge */}
      {tier.badge && (
        <div
          className={cn(
            "absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold",
            tier.isPopular
              ? "bg-emerald-500 text-white"
              : "bg-amber-500 text-black"
          )}
        >
          {tier.badge}
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
        <p className="mt-1 text-sm text-zinc-400">{tier.tagline}</p>
      </div>

      {/* Price */}
      <div className="mt-6 text-center">
        {price === 0 ? (
          <span className="text-4xl font-bold text-white">Free</span>
        ) : (
          <>
            <span className="text-4xl font-bold text-white">
              {formatPrice(price)}
            </span>
            <span className="text-zinc-400">/month</span>
          </>
        )}
      </div>

      {/* Description */}
      <p className="mt-4 text-center text-sm text-zinc-400">{tier.description}</p>

      {/* Scans per day */}
      <div className="mt-6 rounded-lg bg-zinc-800/50 p-3 text-center">
        <span className="text-sm text-zinc-300">
          {tier.scansPerDay === "unlimited" ? (
            <span className="font-semibold text-emerald-400">Unlimited scans</span>
          ) : (
            <>
              <span className="font-semibold text-white">{tier.scansPerDay}</span>{" "}
              scans per day
            </>
          )}
        </span>
      </div>

      {/* Features */}
      <ul className="mt-6 flex-1 space-y-3">
        {tier.features.map((feature) => (
          <li key={feature}>
            <FeatureCheck feature={feature} />
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onSelect}
        className={cn(
          "mt-8 w-full rounded-lg py-3 text-sm font-semibold transition-all duration-200",
          tier.isPopular
            ? "bg-emerald-500 text-white hover:bg-emerald-400"
            : tier.badge === "Best Value"
              ? "bg-amber-500 text-black hover:bg-amber-400"
              : tier.id === "free"
                ? "bg-zinc-800 text-white hover:bg-zinc-700"
                : "bg-zinc-100 text-zinc-900 hover:bg-white"
        )}
      >
        {tier.id === "free" ? "Get Started" : "Start Free Trial"}
      </button>

      {/* Highlights */}
      {tier.highlights.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {tier.highlights.map((highlight) => (
            <span
              key={highlight}
              className="text-xs text-zinc-500"
            >
              {highlight}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

