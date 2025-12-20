"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LiquidMetalButton } from "../components/swoopa-ultra/LiquidMetalButton";
import { NeonCard } from "../components/swoopa-ultra/NeonCard";
import { useRegion } from "@/providers/RegionProvider";
import { getSupportedMarketplacesForRegion } from "@magnus-flipper-ai/marketplace-config";

type QuoteResponse = {
  region: "UK" | "US";
  currency: "USD" | "GBP";
  inputs: {
    marketplaces: string[];
    searches: number;
    findTime: "instant" | "2m" | "3m" | "5m" | "10m";
    monitoringWindowHours: number;
    currency?: "USD" | "GBP";
    region?: "UK" | "US" | "ROW";
  };
  recommendation: {
    tier: "FREE_BASIC" | "STARTER" | "PRO" | "ELITE";
    planKey: "starter" | "pro" | "elite" | null;
  };
  prices: Record<
    "starter" | "pro" | "elite",
    { planKey: string; priceId: string; currency: string; unitAmount: number | null; interval: string }
  >;
  trialDays: number;
};

const MARKETPLACES: Array<{ id: string; label: string }> = [
  { id: "facebook", label: "Facebook" },
  { id: "offerup", label: "OfferUp" },
  { id: "craigslist", label: "Craigslist" },
  { id: "gumtree", label: "Gumtree" },
  { id: "ebay", label: "eBay" },
  { id: "vinted", label: "Vinted" },
];

function formatPrice(unitAmount: number | null, currency: string): string {
  if (typeof unitAmount !== "number") return "—";
  const value = unitAmount / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(0)}`;
  }
}

export function PricingCalculator({
  defaultCurrency,
}: {
  defaultCurrency: "USD" | "GBP";
}) {
  const { region } = useRegion();
  const [marketplaces, setMarketplaces] = useState<string[]>(["facebook"]);
  const [searches, setSearches] = useState<number>(5);
  const [findTime, setFindTime] = useState<QuoteResponse["inputs"]["findTime"]>("5m");
  const [monitoringWindowHours, setMonitoringWindowHours] = useState<number>(24);
  const [currency, setCurrency] = useState<"USD" | "GBP">(defaultCurrency);

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const supportedMarketplaces = useMemo(() => {
    return getSupportedMarketplacesForRegion(region);
  }, [region]);

  const marketplaceOptions = useMemo(() => {
    const supportedSet = new Set(supportedMarketplaces);
    return MARKETPLACES.filter((m) => supportedSet.has(m.id));
  }, [supportedMarketplaces]);

  useEffect(() => {
    // Keep calculator consistent with region-based marketplace capabilities.
    setMarketplaces((prev) => {
      const next = prev.filter((m) => supportedMarketplaces.includes(m));
      if (next.length > 0) return next;
      // Default to Facebook (exists in both US/UK) or first supported marketplace.
      return supportedMarketplaces.includes("facebook")
        ? ["facebook"]
        : supportedMarketplaces.slice(0, 1);
    });
  }, [supportedMarketplaces]);

  useEffect(() => {
    // When region changes, reset currency to the region default (user can still toggle).
    setCurrency(defaultCurrency);
  }, [defaultCurrency]);

  const payload = useMemo(
    () => ({
      marketplaces,
      searches,
      findTime,
      monitoringWindowHours,
      currency,
      region,
    }),
    [currency, findTime, marketplaces, monitoringWindowHours, searches, region]
  );

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const ctrl = new AbortController();
    const timeout = setTimeout(() => {
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch("/api/pricing/quote", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
            signal: ctrl.signal,
          });

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body?.error || "Failed to load quote");
          }

          const data = (await res.json()) as QuoteResponse;
          if (requestIdRef.current !== requestId) return;
          setQuote(data);
        } catch (err: any) {
          if (ctrl.signal.aborted) return;
          if (requestIdRef.current !== requestId) return;
          setError(err?.message || "Failed to load quote");
          setQuote(null);
        } finally {
          if (requestIdRef.current === requestId) setLoading(false);
        }
      })();
    }, 250);

    return () => {
      clearTimeout(timeout);
      ctrl.abort();
    };
  }, [payload]);

  const recommended = quote?.recommendation?.tier ?? "FREE_BASIC";
  const recommendedPlanKey = quote?.recommendation?.planKey ?? null;
  const recommendedPrice =
    recommendedPlanKey && quote?.prices?.[recommendedPlanKey]
      ? quote.prices[recommendedPlanKey]
      : null;

  const handleCheckout = async () => {
    if (!recommendedPlanKey) return;
    setError(null);

    const res = await fetch(`/api/stripe/checkout?region=${encodeURIComponent(region)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        plan: recommendedPlanKey,
        calculator: payload,
        trialDays: quote?.trialDays ?? 7,
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.url) {
      throw new Error(body?.error || "Checkout failed");
    }

    window.location.href = body.url as string;
  };

  return (
    <NeonCard className="p-6 md:p-8" glowColor="rgba(59, 130, 246, 0.35)" hover={false}>
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="min-w-[240px]">
          <div className="text-white font-extrabold tracking-tight text-xl">
            Pricing calculator
          </div>
          <div className="text-white/60 text-sm mt-1">
            Tune the knobs — get a plan recommendation and start a {quote?.trialDays ?? 7}-day free trial.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`px-3 py-1.5 rounded-full text-xs font-extrabold border ${
              currency === "USD"
                ? "bg-white/10 border-white/20 text-white"
                : "bg-transparent border-white/10 text-white/70"
            }`}
            onClick={() => setCurrency("USD")}
          >
            USD
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-full text-xs font-extrabold border ${
              currency === "GBP"
                ? "bg-white/10 border-white/20 text-white"
                : "bg-transparent border-white/10 text-white/70"
            }`}
            onClick={() => setCurrency("GBP")}
          >
            GBP
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-white/60 mb-2">
              Marketplaces monitored
            </div>
          <div className="flex flex-wrap gap-2">
              {marketplaceOptions.map((m) => {
                const checked = marketplaces.includes(m.id);
                return (
                  <label
                    key={m.id}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                      checked
                        ? "bg-white/10 border-white/20 text-white"
                        : "bg-transparent border-white/10 text-white/70 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#00E5FF]"
                      checked={checked}
                      onChange={() => {
                        setMarketplaces((prev) =>
                          checked ? prev.filter((v) => v !== m.id) : [...prev, m.id]
                        );
                      }}
                    />
                    {m.label}
                  </label>
                );
              })}
            </div>
            <div className="text-[11px] text-white/45 mt-2">
              More marketplaces generally requires higher tiers to maintain alert speed.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-xs font-semibold text-white/60">
              Searches / keywords
              <input
                type="number"
                min={0}
                max={200}
                value={searches}
                onChange={(e) => setSearches(Math.max(0, Math.min(200, Number(e.target.value) || 0)))}
                className="mt-2 w-full rounded-lg bg-[#0F0F0F] border border-white/10 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs font-semibold text-white/60">
              Monitoring window
              <select
                value={monitoringWindowHours}
                onChange={(e) => setMonitoringWindowHours(Number(e.target.value))}
                className="mt-2 w-full rounded-lg bg-[#0F0F0F] border border-white/10 px-3 py-2 text-sm text-white"
              >
                {[12, 15, 18, 24].map((h) => (
                  <option key={h} value={h}>
                    {h} hours
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="text-xs font-semibold text-white/60">
            Average find time target
            <select
              value={findTime}
              onChange={(e) => setFindTime(e.target.value as any)}
              className="mt-2 w-full rounded-lg bg-[#0F0F0F] border border-white/10 px-3 py-2 text-sm text-white"
            >
              <option value="instant">Instant</option>
              <option value="2m">2 minutes</option>
              <option value="3m">3 minutes</option>
              <option value="5m">5 minutes</option>
              <option value="10m">10 minutes</option>
            </select>
          </label>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0F0F0F] border border-white/10 rounded-xl p-4">
            <div className="text-xs text-white/60 font-semibold">
              Recommended plan
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-4">
              <div className="text-white font-extrabold text-2xl tracking-tight">
                {recommended === "FREE_BASIC"
                  ? "Free/Basic"
                  : recommended === "STARTER"
                  ? "Starter"
                  : recommended === "PRO"
                  ? "Pro"
                  : "Elite"}
              </div>
              <div className="text-white font-extrabold text-xl">
                {recommendedPrice
                  ? formatPrice(recommendedPrice.unitAmount, recommendedPrice.currency)
                  : "£0"}
                {recommendedPrice ? (
                  <span className="text-xs text-white/60 font-semibold">
                    /{recommendedPrice.interval}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-2 text-[11px] text-white/55">
              Quote is pulled directly from Stripe prices — no currency conversion in-app.
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-200 bg-red-500/10 border border-red-400/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            {(() => {
              const checkoutDisabled = loading || !recommendedPlanKey;
              return (
            <LiquidMetalButton
              variant="primary"
              className={`w-full ${checkoutDisabled ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => {
                if (checkoutDisabled) return;
                handleCheckout().catch((err) => setError(err?.message || "Checkout failed"));
              }}
            >
              {recommendedPlanKey ? "Start free trial" : "Stay on Free/Basic"}
            </LiquidMetalButton>
              );
            })()}
          </div>

          <div className="text-[11px] text-white/45">
            Trial applies to paid plans. Cancel anytime.
          </div>
        </div>
      </div>
    </NeonCard>
  );
}
