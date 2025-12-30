"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Lock, Check, X, Info } from "lucide-react";
import { FEATURE_COMPARISON, PRICING_TIERS, TIER_ORDER } from "@/lib/pricing/constants";
import { usePricingRegion } from "@/lib/hooks/usePricingRegion";

function FeatureValue({ value, tooltip }: { value: string | boolean; tooltip?: string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-4 w-4 text-emerald-400" />
    ) : (
      <X className="h-4 w-4 text-zinc-600" />
    );
  }

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="inline-flex items-center gap-1 text-zinc-300">
            {value}
            <Info className="h-3 w-3 text-zinc-500" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <span className="text-zinc-300">{value}</span>;
}

function LockedFeature({ reason }: { reason: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="inline-flex items-center gap-1 text-zinc-500">
          <Lock className="h-3.5 w-3.5" />
          <span className="text-xs">Locked</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-xs">{reason}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ComparePlansTableProps {
  className?: string;
}

export function ComparePlansTable({ className }: ComparePlansTableProps) {
  const { formatPrice, region } = usePricingRegion();

  return (
    <section id="compare" className={cn("py-16 px-6", className)}>
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="inline-block rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            Compare Plans
          </span>
          <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
            Choose your operating mode
          </h2>
          <p className="mt-4 text-zinc-400">
            From occasional searches to autonomous market observation.
          </p>
        </div>

        {/* Table */}
        <div className="mt-12 overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Header */}
            <thead>
              <tr>
                <th className="border-b border-zinc-800 p-4 text-left text-sm font-medium text-zinc-400">
                  Feature
                </th>
                {TIER_ORDER.map((tierId) => {
                  const tier = PRICING_TIERS[tierId];
                  const price = region === "uk" ? tier.price.uk : tier.price.us;
                  return (
                    <th
                      key={tier.id}
                      className={cn(
                        "border-b border-zinc-800 p-4 text-center",
                        tier.isPopular && "bg-emerald-950/30",
                        tier.badge === "Best Value" && "bg-amber-950/30"
                      )}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-semibold text-white">
                          {tier.name}
                        </span>
                        {tier.badge && (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              tier.isPopular
                                ? "bg-emerald-500 text-white"
                                : "bg-amber-500 text-black"
                            )}
                          >
                            {tier.badge}
                          </span>
                        )}
                        <span className="mt-1 text-lg font-bold text-white">
                          {price === 0 ? "Free" : formatPrice(price)}
                        </span>
                        {price > 0 && (
                          <span className="text-xs text-zinc-500">/month</span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {FEATURE_COMPARISON.map((row, index) => (
                <tr
                  key={row.name}
                  className={cn(
                    "border-b border-zinc-800/50",
                    index % 2 === 0 && "bg-zinc-900/30"
                  )}
                >
                  <td className="p-4 text-sm text-zinc-300">
                    {row.tooltip ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="inline-flex items-center gap-1">
                            {row.name}
                            <Info className="h-3 w-3 text-zinc-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">{row.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      row.name
                    )}
                  </td>
                  {TIER_ORDER.map((tierId) => {
                    const tier = PRICING_TIERS[tierId];
                    const value = row[tierId];
                    return (
                      <td
                        key={tierId}
                        className={cn(
                          "p-4 text-center text-sm",
                          tier.isPopular && "bg-emerald-950/20",
                          tier.badge === "Best Value" && "bg-amber-950/20"
                        )}
                      >
                        <div className="flex items-center justify-center">
                          <FeatureValue value={value} tooltip={row.tooltip} />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* CTA Row */}
              <tr>
                <td className="p-4" />
                {TIER_ORDER.map((tierId) => {
                  const tier = PRICING_TIERS[tierId];
                  return (
                    <td
                      key={tierId}
                      className={cn(
                        "p-4 text-center",
                        tier.isPopular && "bg-emerald-950/20",
                        tier.badge === "Best Value" && "bg-amber-950/20"
                      )}
                    >
                      <a
                        href={tier.id === "free" ? "/search" : "/checkout"}
                        className={cn(
                          "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                          tier.isPopular
                            ? "bg-emerald-500 text-white hover:bg-emerald-400"
                            : tier.badge === "Best Value"
                              ? "bg-amber-500 text-black hover:bg-amber-400"
                              : tier.id === "free"
                                ? "bg-zinc-800 text-white hover:bg-zinc-700"
                                : "bg-zinc-100 text-zinc-900 hover:bg-white"
                        )}
                      >
                        {tier.id === "free" ? "Get Started" : "Start Trial"}
                      </a>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          All paid plans include a 7-day free trial. No credit card required to start.
        </p>
      </div>
    </section>
  );
}
