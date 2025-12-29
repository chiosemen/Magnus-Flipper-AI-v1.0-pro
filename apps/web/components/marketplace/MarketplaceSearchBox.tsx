"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TierLimitsPanel } from "@/components/TierLimitsPanel";
import { RadiusSelector } from "@/components/marketplace/RadiusSelector";
import {
  MARKETPLACES,
  type MarketplaceConfig,
  type MarketplaceId,
} from "@/lib/marketplaceRegistry";

type SearchRequest = {
  query: string;
  marketplaces: MarketplaceId[];
  postalCode?: string | null;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number | null;
};

type MarketplaceSearchBoxProps = {
  defaultMarketplace?: string;
  disabled?: boolean;
  onSearchCreated?: (search: SearchRequest, jobId?: string | null) => void;
};

const MARKETPLACE_OPTIONS = Object.values(MARKETPLACES)
  .filter((market) => market.enabled)
  .map((market) => ({
    value: market.id,
    label: market.label,
  }));

type SearchPolicy = {
  tier: string;
  maxQueriesPerRun: number;
  maxConcurrency: number;
  marketsAllowed: MarketplaceId[];
  dailyCuLimit?: number;
  cuCapPerRun?: number;
};

type MarketCapability = {
  supportsRadiusKm: boolean;
  supportsPostal: boolean;
  supportsLatLng: boolean;
  supportsCountry: boolean;
};

type SearchResult = {
  market: string;
  query: string;
  count: number;
  durationMs?: number;
  items: any[];
  error?: string;
  pooling?: {
    pooled: boolean;
    geoKey: string;
    precision?: number | null;
    strategy?: string;
    poolingApplied?: boolean;
    poolingKey?: string;
    poolingReason?: string | null;
  } | null;
  warnings?: string[];
  locationUsed?: {
    text?: string | null;
    lat?: number;
    lng?: number;
    country?: string | null;
  } | null;
  radiusKmUsed?: number | null;
};

type SearchMeta = {
  marketCapabilities?: Record<string, MarketCapability>;
  radiusIgnoredMarkets?: string[];
  warnings?: string[];
  estimatedCuTotal?: number;
  estimatedCuByMarket?: Record<string, number>;
};

type SearchResponse = {
  policy: SearchPolicy;
  requestedQueries: number;
  executedQueries: string[];
  markets: string[];
  stats: { totalTasks: number; concurrency: number };
  results: SearchResult[];
  meta?: SearchMeta;
};

const DEFAULT_MARKETPLACE =
  MARKETPLACE_OPTIONS[0]?.value ?? ("facebook" as MarketplaceId);

function normalizeMarketplace(value?: string): MarketplaceId {
  const normalized = value?.toLowerCase().trim() as MarketplaceId | undefined;
  if (normalized && MARKETPLACES[normalized]?.enabled) {
    return normalized;
  }
  return DEFAULT_MARKETPLACE;
}

function toCapability(market: MarketplaceConfig): MarketCapability {
  return {
    supportsRadiusKm: market.geoCapabilities.supportsRadiusKm,
    supportsPostal: market.geoCapabilities.supportsPostal,
    supportsLatLng: market.geoCapabilities.supportsLatLng,
    supportsCountry: market.geoCapabilities.supportsCountry,
  };
}

function getGeoBadge(capability: MarketCapability) {
  if (capability.supportsRadiusKm) {
    return {
      label: "Radius OK",
      className: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    };
  }
  if (!capability.supportsPostal && !capability.supportsLatLng) {
    return {
      label: "Country-only",
      className: "border-yellow-500/40 bg-yellow-500/15 text-yellow-300",
    };
  }
  return {
    label: "No Radius",
    className: "border-red-500/40 bg-red-500/15 text-red-300",
  };
}

export default function MarketplaceSearchBox({
  defaultMarketplace,
  disabled = false,
  onSearchCreated,
}: MarketplaceSearchBoxProps) {
  const [query, setQuery] = useState("");
  const [marketplace, setMarketplace] = useState<MarketplaceId>(() =>
    normalizeMarketplace(defaultMarketplace)
  );
  const [postalCode, setPostalCode] = useState("SW1A 1AA");
  const [radiusMiles, setRadiusMiles] = useState(25);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [useDeviceLocation, setUseDeviceLocation] = useState(false);
  const [showUseMyLocation, setShowUseMyLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [policy, setPolicy] = useState<SearchPolicy | null>(null);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [requestedQueries, setRequestedQueries] = useState<number | null>(null);
  const [executedQueries, setExecutedQueries] = useState<string[] | null>(null);
  const [clientLimitHit, setClientLimitHit] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geoRequestIdRef = useRef(0);

  const formattedQuery = useMemo(() => query.trim(), [query]);
  const trimmedPostal = useMemo(() => postalCode.trim(), [postalCode]);
  const radiusKm = useMemo(
    () => Number((radiusMiles * 1.60934).toFixed(2)),
    [radiusMiles]
  );
  const selectedMarketplace = MARKETPLACES[marketplace];
  const fallbackCapability = useMemo(
    () => toCapability(selectedMarketplace),
    [selectedMarketplace]
  );
  const lockedMarkets = useMemo(() => {
    if (!policy?.marketsAllowed?.length) return [];
    return MARKETPLACE_OPTIONS.filter(
      (option) => !policy.marketsAllowed.includes(option.value)
    );
  }, [policy]);
  const isMarketDisabled = (value: MarketplaceId) =>
    policy ? !policy.marketsAllowed.includes(value) : false;
  const selectedCapability =
    meta?.marketCapabilities?.[marketplace] ?? fallbackCapability;
  const geoBadge = useMemo(
    () => getGeoBadge(selectedCapability),
    [selectedCapability]
  );
  const estimatedCuTotal =
    typeof meta?.estimatedCuTotal === "number" ? meta.estimatedCuTotal : null;
  const geoBadges = MARKETPLACE_OPTIONS.map((option) => ({
    ...option,
    badge: getGeoBadge(
      meta?.marketCapabilities?.[option.value] ??
        toCapability(MARKETPLACES[option.value])
    ),
  }));
  const isAdmin = useMemo(() => {
    if (typeof window === "undefined") return false;
    const value = new URLSearchParams(window.location.search).get("admin");
    return value === "1" || value === "true";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShowUseMyLocation("geolocation" in navigator);
  }, []);

  useEffect(() => {
    if (!policy?.marketsAllowed?.length) return;
    if (policy.marketsAllowed.includes(marketplace)) return;
    setMarketplace(policy.marketsAllowed[0]);
  }, [policy, marketplace]);

  useEffect(() => {
    if (useDeviceLocation) return;
    if (!trimmedPostal) {
      setLat(null);
      setLng(null);
      setGeoError(null);
      setGeoLoading(false);
      return;
    }
    if (geoDebounceRef.current) {
      clearTimeout(geoDebounceRef.current);
    }
    geoDebounceRef.current = setTimeout(() => {
      const requestId = ++geoRequestIdRef.current;
      setGeoLoading(true);
      setGeoError(null);
      fetch("/api/geo/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postalCode: trimmedPostal }),
      })
        .then(async (response) => {
          const payload = await response.json().catch(() => ({}));
          if (requestId !== geoRequestIdRef.current) return;
          if (!response.ok) {
            setLat(null);
            setLng(null);
            setGeoError(payload?.error || "Unable to resolve postal code.");
            return;
          }
          setLat(typeof payload.lat === "number" ? payload.lat : null);
          setLng(typeof payload.lng === "number" ? payload.lng : null);
          setGeoError(null);
        })
        .catch((err) => {
          if (requestId !== geoRequestIdRef.current) return;
          setLat(null);
          setLng(null);
          setGeoError(err instanceof Error ? err.message : "Location lookup failed.");
        })
        .finally(() => {
          if (requestId === geoRequestIdRef.current) {
            setGeoLoading(false);
          }
        });
    }, 450);

    return () => {
      if (geoDebounceRef.current) {
        clearTimeout(geoDebounceRef.current);
      }
    };
  }, [trimmedPostal, useDeviceLocation]);

  const executeSearch = async () => {
    if (disabled || loading) {
      return;
    }
    setError(null);
    setLoading(true);
    setResults([]);
    setPolicy(null);
    setMeta(null);
    setRequestedQueries(null);
    setExecutedQueries(null);

    if (!formattedQuery) {
      setError("Please enter a search term.");
      setLoading(false);
      return;
    }

    const needsGeo =
      selectedCapability.supportsRadiusKm && selectedCapability.supportsLatLng;
    const hasCoords = typeof lat === "number" && typeof lng === "number";
    if (needsGeo && geoLoading) {
      setError("Resolving location. Please wait a moment.");
      setLoading(false);
      return;
    }
    if (needsGeo && !hasCoords && !trimmedPostal) {
      setError("Add a postal code or use my location to search this market.");
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
          postalCode: trimmedPostal || undefined,
          lat,
          lng,
          radiusKm,
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
      setMeta(payload.meta || null);
      setRequestedQueries(payload.requestedQueries ?? null);
      setExecutedQueries(payload.executedQueries ?? null);
      (window as any).__MAGNUS_SEARCH_POLICY__ = payload.policy || null;

      const searchRequest: SearchRequest = {
        query: formattedQuery,
        marketplaces: [marketplace],
        postalCode: trimmedPostal || null,
        lat,
        lng,
        radiusKm,
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
    trimmedPostal,
    radiusKm,
    lat,
    lng,
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
              onChange={(e) => setMarketplace(e.target.value as MarketplaceId)}
              className="w-full rounded-lg bg-[#0f0f0f] border border-white/10 px-4 py-2 text-white focus:outline-none focus:border-[#00E5FF]/60 disabled:opacity-60"
              disabled={disabled || loading}
            >
              {MARKETPLACE_OPTIONS.map((option) => {
                const locked = isMarketDisabled(option.value);
                return (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={locked}
                    title={
                      locked
                        ? "Upgrade required to search this marketplace."
                        : undefined
                    }
                  >
                    {option.label}
                  </option>
                );
              })}
            </select>
            {lockedMarkets.length > 0 && (
              <div className="mt-1 text-xs text-white/50">
                Upgrade required to search:{" "}
                {lockedMarkets.map((option) => option.label).join(", ")}
              </div>
            )}
            <div
              className={`mt-2 inline-flex items-center gap-2 rounded-full border px-2 py-1 text-[11px] ${geoBadge.className}`}
            >
              Geo support: {geoBadge.label}
            </div>
          </div>
          <div className="flex items-end gap-3">
            <button
              type="submit"
              disabled={loading || disabled}
              className="w-full rounded-lg bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] px-4 py-2 font-semibold text-white transition hover:from-[#00E5FF]/90 hover:to-[#7B2FFF]/90 disabled:opacity-60"
            >
              {loading ? "Searching..." : "Instant scan"}
            </button>
            {estimatedCuTotal !== null && (
              <span
                title="Estimated based on selected markets, queries, and geo. Actual usage may vary."
                className="whitespace-nowrap rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-white/70"
              >
                Estimated cost: ~{estimatedCuTotal.toFixed(1)} CU
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-white/70">
          {geoBadges.map((badge) => (
            <div
              key={badge.value}
              className={`rounded-full border px-2 py-1 ${badge.badge.className}`}
            >
              {badge.label}: {badge.badge.label}
            </div>
          ))}
        </div>
        <RadiusSelector
          postalCode={postalCode}
          onPostalChange={(value) => {
            setPostalCode(value);
            setUseDeviceLocation(false);
          }}
          radiusMiles={radiusMiles}
          onRadiusChange={setRadiusMiles}
          lat={lat}
          lng={lng}
          geoLoading={geoLoading}
          geoError={geoError}
          onUseMyLocation={() => {
            if (!navigator?.geolocation) return;
            setGeoLoading(true);
            setGeoError(null);
            setUseDeviceLocation(true);
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setLat(position.coords.latitude);
                setLng(position.coords.longitude);
                setGeoLoading(false);
              },
              (err) => {
                setGeoError(err.message || "Unable to access location.");
                setGeoLoading(false);
                setUseDeviceLocation(false);
              },
              { enableHighAccuracy: false, timeout: 8000 }
            );
          }}
          showUseMyLocation={showUseMyLocation}
          supportsRadius={selectedCapability.supportsRadiusKm}
          disabled={disabled || loading}
        />
        {!selectedCapability.supportsRadiusKm && (
          <div className="text-xs text-yellow-300">
            {selectedMarketplace.label}{" "}
            does not support radius targeting. We fall back to country-level
            matching when possible.
          </div>
        )}
        {meta?.radiusIgnoredMarkets && meta.radiusIgnoredMarkets.length > 0 && (
          <div className="text-xs text-yellow-300">
            Radius ignored for:{" "}
            {meta.radiusIgnoredMarkets
              .map(
                (market) =>
                  MARKETPLACES[market as MarketplaceId]?.label ?? market
              )
              .join(", ")}
          </div>
        )}
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
                {isAdmin && (
                  <div className="mt-2 text-xs text-white/50">
                    Pooled execution:{" "}
                    {result.pooling?.pooled ? "on" : "off"} · Geo cell:{" "}
                    {result.pooling?.geoKey ?? "n/a"}
                  </div>
                )}

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
