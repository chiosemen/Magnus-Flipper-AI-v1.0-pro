"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TierLimitsPanel } from "@/components/TierLimitsPanel";

type Marketplace = "facebook" | "ebay" | "vinted" | "gumtree";

type SearchRequest = {
  query: string;
  marketplaces: Marketplace[];
  location?: string | null;
  radiusKm?: number | null;
  units?: "mi" | "km";
};

type MarketplaceSearchBoxProps = {
  defaultMarketplace?: string;
  disabled?: boolean;
  onSearchCreated?: (search: SearchRequest, jobId?: string | null) => void;
};

const MARKETPLACE_OPTIONS: { value: Marketplace; label: string }[] = [
  { value: "facebook", label: "Facebook Marketplace" },
  { value: "ebay", label: "eBay" },
  { value: "vinted", label: "Vinted" },
  { value: "gumtree", label: "Gumtree" },
];

type SearchPolicy = {
  tier: string;
  maxQueriesPerRun: number;
  maxConcurrency: number;
  marketsAllowed: string[];
};

type SearchResult = {
  market: string;
  query: string;
  count: number;
  durationMs?: number;
  items: any[];
  error?: string;
  locationUsed?: {
    text?: string | null;
    lat?: number;
    lng?: number;
    country?: string | null;
  } | null;
  radiusKmUsed?: number | null;
};

type SearchResponse = {
  policy: SearchPolicy;
  requestedQueries: number;
  executedQueries: string[];
  markets: string[];
  stats: { totalTasks: number; concurrency: number };
  results: SearchResult[];
};

function normalizeMarketplace(value?: string): Marketplace {
  const normalized = value?.toLowerCase().trim();
  if (normalized === "facebook") return "facebook";
  if (normalized === "ebay") return "ebay";
  if (normalized === "vinted") return "vinted";
  if (normalized === "gumtree") return "gumtree";
  return "facebook";
}

export default function MarketplaceSearchBox({
  defaultMarketplace,
  disabled = false,
  onSearchCreated,
}: MarketplaceSearchBoxProps) {
  const [query, setQuery] = useState("");
  const [marketplace, setMarketplace] = useState<Marketplace>(() =>
    normalizeMarketplace(defaultMarketplace)
  );
  const [locationText, setLocationText] = useState("London");
  const [radiusValue, setRadiusValue] = useState(25);
  const [radiusUnits, setRadiusUnits] = useState<"mi" | "km">("mi");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [policy, setPolicy] = useState<SearchPolicy | null>(null);
  const [requestedQueries, setRequestedQueries] = useState<number | null>(null);
  const [executedQueries, setExecutedQueries] = useState<string[] | null>(null);
  const [clientLimitHit, setClientLimitHit] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formattedQuery = useMemo(() => query.trim(), [query]);
  const trimmedLocation = useMemo(() => locationText.trim(), [locationText]);
  const normalizedLocation = trimmedLocation || "London";

  const executeSearch = async () => {
    if (disabled || loading) {
      return;
    }
    setError(null);
    setLoading(true);
    setResults([]);
    setPolicy(null);
    setRequestedQueries(null);
    setExecutedQueries(null);

    if (!formattedQuery) {
      setError("Please enter a search term.");
      setLoading(false);
      return;
    }

    try {
      const parsedQueries = formattedQuery
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const limitedQueries = parsedQueries.slice(0, 10);
      const truncated = parsedQueries.length > 10;
      setClientLimitHit(truncated);

      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queries: limitedQueries,
          markets: [marketplace],
          locationText: normalizedLocation,
          radiusKm: radiusValue,
          units: radiusUnits,
        }),
      });

      const responseJson = await response.json().catch(() => ({}));

      if (response.status === 400) {
        setError(responseJson?.error || "Invalid request.");
        setLoading(false);
        return;
      }

      if (response.status === 429) {
        setError("Plan limit reached.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError("Search failed. Please try again.");
        if (process.env.NODE_ENV !== "production") {
          console.log("Search error", responseJson);
        }
        setLoading(false);
        return;
      }

      const payload = responseJson as SearchResponse;
      setResults(payload.results || []);
      setPolicy(payload.policy || null);
      setRequestedQueries(payload.requestedQueries ?? null);
      setExecutedQueries(payload.executedQueries ?? null);
      (window as any).__MAGNUS_SEARCH_POLICY__ = payload.policy || null;

      const searchRequest: SearchRequest = {
        query: formattedQuery,
        marketplaces: [marketplace],
        location: normalizedLocation,
        radiusKm: radiusValue,
        units: radiusUnits,
      };
      onSearchCreated?.(searchRequest, null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
      if (process.env.NODE_ENV !== "production") {
        console.log("Search error", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    await executeSearch();
  };

  useEffect(() => {
    if (!formattedQuery || disabled) return;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void executeSearch();
    }, 500);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [
    formattedQuery,
    normalizedLocation,
    radiusValue,
    radiusUnits,
    marketplace,
    disabled,
  ]);

  const executedCount = Array.isArray(executedQueries)
    ? executedQueries.length
    : 0;
  const totalResults = results.reduce((sum, result) => sum + result.count, 0);
  const avgDuration = results.length
    ? Math.round(
        results.reduce((sum, result) => sum + (result.durationMs || 0), 0) /
          results.length
      )
    : 0;

  const effectiveDetails = useMemo(() => {
    const candidate = results.find(
      (result) =>
        result.locationUsed ||
        typeof result.radiusKmUsed === "number"
    );
    if (!candidate) {
      return { locationLabel: null, radiusKm: null };
    }
    const location = candidate.locationUsed;
    let locationLabel: string | null = null;
    if (location?.text) {
      locationLabel = location.text;
    } else if (
      typeof location?.lat === "number" &&
      typeof location?.lng === "number"
    ) {
      locationLabel = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
    }
    const radiusKm =
      typeof candidate.radiusKmUsed === "number"
        ? candidate.radiusKmUsed
        : null;
    return { locationLabel, radiusKm };
  }, [results]);

  const pickField = (item: any, keys: string[]) => {
    for (const key of keys) {
      const value = key.split(".").reduce((acc, part) => {
        if (!acc || typeof acc !== "object") return undefined;
        return acc[part];
      }, item);
      if (typeof value === "string" && value.trim()) return value.trim();
      if (typeof value === "number") return String(value);
    }
    return "";
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_180px]">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Search query
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                const nextValue = e.target.value;
                setQuery(nextValue);
                const total = nextValue
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean).length;
                setClientLimitHit(total > 10);
              }}
              placeholder="e.g., MacBook Pro, iPad, AirPods"
              className="w-full rounded-lg bg-[#0f0f0f] border border-white/10 px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-[#00E5FF]/60 disabled:opacity-60"
              required
              disabled={disabled || loading}
            />
            {clientLimitHit && (
              <p className="text-xs text-yellow-300 mt-1">
                Max 10 concurrent searches (demo limit).
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Marketplace
            </label>
            <select
              value={marketplace}
              onChange={(e) => setMarketplace(e.target.value as Marketplace)}
              className="w-full rounded-lg bg-[#0f0f0f] border border-white/10 px-4 py-2 text-white focus:outline-none focus:border-[#00E5FF]/60 disabled:opacity-60"
              disabled={disabled || loading}
            >
              {MARKETPLACE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading || disabled}
              className="w-full rounded-lg bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] px-4 py-2 font-semibold text-white transition hover:from-[#00E5FF]/90 hover:to-[#7B2FFF]/90 disabled:opacity-60"
            >
              {loading ? "Searching..." : "Instant scan"}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_180px]">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Location (text)
            </label>
            <input
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              onBlur={() => {
                if (!locationText.trim()) {
                  setLocationText("London");
                }
              }}
              placeholder="London"
              className="w-full rounded-lg bg-[#0f0f0f] border border-white/10 px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-[#00E5FF]/60 disabled:opacity-60"
              disabled={disabled || loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Radius ({radiusUnits})
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={100}
                value={radiusValue}
                onChange={(e) => setRadiusValue(Number(e.target.value))}
                className="w-full accent-[#00E5FF]"
                disabled={disabled || loading}
              />
              <span className="text-sm text-white/70 min-w-[48px] text-right">
                {radiusValue}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Units
            </label>
            <div className="flex rounded-lg border border-white/10 bg-[#0f0f0f] p-1">
              {(["mi", "km"] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setRadiusUnits(unit)}
                  className={`flex-1 rounded-md px-3 py-1 text-sm font-semibold transition ${
                    radiusUnits === unit
                      ? "bg-[#00E5FF] text-black"
                      : "text-white/70 hover:text-white"
                  }`}
                  disabled={disabled || loading}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-sm text-white/70">
          Running live search…
        </div>
      )}

      {policy && (
        <TierLimitsPanel
          policy={policy}
          requestedQueries={requestedQueries ?? undefined}
          executedQueries={executedCount || undefined}
        />
      )}

      {(results.length > 0 || policy) && (
        <div className="rounded-xl border border-white/10 bg-[#0f0f0f] p-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm text-white/70">
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="text-xs text-white/50">Total listings</div>
              <div className="text-base font-semibold text-white">
                {totalResults}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="text-xs text-white/50">Tasks executed</div>
              <div className="text-base font-semibold text-white">
                {results.length}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="text-xs text-white/50">Avg duration</div>
              <div className="text-base font-semibold text-white">
                {avgDuration ? `${avgDuration} ms` : "—"}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="text-xs text-white/50">Effective location</div>
              <div className="text-base font-semibold text-white">
                {effectiveDetails.locationLabel || "—"}
              </div>
              <div className="mt-1 text-xs text-white/50">
                Effective radius:{" "}
                {typeof effectiveDetails.radiusKm === "number"
                  ? `${effectiveDetails.radiusKm.toFixed(1)} km`
                  : "—"}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={`${result.market}-${result.query}-${index}`}
                className="rounded-lg border border-white/10 bg-black/40 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-white/70">
                  <div className="text-white font-semibold capitalize">
                    {result.market} · {result.query}
                  </div>
                  <div>
                    {result.count} results · {result.durationMs ?? 0} ms
                  </div>
                </div>

                {result.error ? (
                  <div className="mt-3 text-xs text-red-300">
                    {result.error}
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {result.items.slice(0, 9).map((item, itemIndex) => {
                      const title =
                        pickField(item, [
                          "title",
                          "name",
                          "listingTitle",
                          "heading",
                          "marketplace_listing_title",
                        ]) || "Listing";
                      const price =
                        pickField(item, [
                          "price",
                          "priceLabel",
                          "listingPrice",
                          "priceValue",
                        ]) || "—";
                      const locationLabel =
                        pickField(item, [
                          "location.city",
                          "city",
                          "location.name",
                          "location.address",
                        ]) || "—";
                      const link =
                        pickField(item, [
                          "url",
                          "listingUrl",
                          "itemUrl",
                          "link",
                          "productUrl",
                          "permalink",
                        ]) || "";

                      return (
                        <a
                          key={`${result.market}-${itemIndex}`}
                          href={link || "#"}
                          target={link ? "_blank" : undefined}
                          rel={link ? "noopener noreferrer" : undefined}
                          className="rounded-lg border border-white/10 bg-[#0f0f0f] p-3 text-xs text-white/70 transition hover:border-[#00E5FF]/40"
                        >
                          <div className="text-sm font-semibold text-white">
                            {title}
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-emerald-300 font-semibold">
                              {price}
                            </span>
                            <span>{locationLabel}</span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
