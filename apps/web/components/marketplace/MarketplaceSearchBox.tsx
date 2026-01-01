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
  features?: {
    dealScore: boolean;
    dealScoreExplain?: boolean;
    dealScoreContext?: boolean;
    insights: boolean;
    signals: boolean;
    heatmap: boolean;
    arbitrageReadOnly: boolean;
  };
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
  timestamp?: string;
};

type SearchMeta = {
  marketCapabilities?: Record<string, MarketCapability>;
  radiusIgnoredMarkets?: string[];
  warnings?: string[];
  estimatedCuTotal?: number;
  estimatedCuByMarket?: Record<string, number>;
  poolingApplied?: boolean;
  poolingEnabled?: boolean;
};

type SearchError = {
  marketplaceId: string;
  message: string;
  classified?: string;
};

type SearchResponse = {
  blocked?: boolean;
  reason?: string;
  resetsAt?: string | null;
  policy: SearchPolicy;
  requestedMarkets?: number;
  requestedQueries: number;
  executedQueries: string[];
  markets: string[];
  stats: { totalTasks: number; concurrency: number };
  results: SearchResult[];
  errors?: SearchError[];
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
      label: "Exact",
      className: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
      tooltip:
        "All selected markets used your specified location and radius.",
    };
  }
  if (capability.supportsPostal || capability.supportsLatLng) {
    return {
      label: "Inferred",
      className: "border-yellow-500/40 bg-yellow-500/15 text-yellow-300",
      tooltip:
        "Some markets required a nearby location to return results.",
    };
  }
  return {
    label: "Partial",
    className: "border-red-500/40 bg-red-500/15 text-red-300",
    tooltip:
      "One or more markets do not support precise location filtering.",
  };
}

function formatRelativeTime(iso?: string | null) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  const diffMs = Date.now() - then;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const r = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const aVal =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const cVal = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  return r * cVal;
}

function getItemLatLng(item: any): { lat: number; lng: number } | null {
  const candidates = [
    { lat: item?.lat, lng: item?.lng },
    { lat: item?.latitude, lng: item?.longitude },
    { lat: item?.location?.lat, lng: item?.location?.lng },
    { lat: item?.location?.latitude, lng: item?.location?.longitude },
    { lat: item?.geo?.lat, lng: item?.geo?.lng },
  ];
  for (const candidate of candidates) {
    if (
      typeof candidate.lat === "number" &&
      typeof candidate.lng === "number"
    ) {
      return { lat: candidate.lat, lng: candidate.lng };
    }
  }
  return null;
}

function getResultQuality(count: number, items: any[]) {
  const hasRecent = items.some((item) => {
    const value =
      item?.createdAt ||
      item?.created_at ||
      item?.listedAt ||
      item?.timestamp ||
      item?.date;
    const parsed = typeof value === "string" ? Date.parse(value) : NaN;
    if (!Number.isFinite(parsed)) return false;
    return Date.now() - parsed < 48 * 60 * 60 * 1000;
  });

  if (count >= 10 && hasRecent) {
    return {
      label: "Strong",
      className: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    };
  }
  if (count >= 3) {
    return {
      label: "Limited",
      className: "border-yellow-500/40 bg-yellow-500/15 text-yellow-300",
    };
  }
  return {
    label: "Sparse",
    className: "border-red-500/40 bg-red-500/15 text-red-300",
  };
}

function getDealScoreTone(score: number) {
  if (score >= 75) {
    return "border-emerald-500/40 bg-emerald-500/15 text-emerald-300";
  }
  if (score >= 50) {
    return "border-yellow-500/40 bg-yellow-500/15 text-yellow-300";
  }
  return "border-red-500/40 bg-red-500/15 text-red-300";
}

function formatConfidence(confidence?: string) {
  if (!confidence) return "Low";
  if (confidence === "high") return "High";
  if (confidence === "medium") return "Medium";
  return "Low";
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
  const [errors, setErrors] = useState<SearchError[]>([]);
  const [policy, setPolicy] = useState<SearchPolicy | null>(null);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [requestedQueries, setRequestedQueries] = useState<number | null>(null);
  const [requestedMarkets, setRequestedMarkets] = useState<number | null>(null);
  const [executedQueries, setExecutedQueries] = useState<string[] | null>(null);
  const [executedMarkets, setExecutedMarkets] = useState<string[] | null>(null);
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
  const dealScoreEnabled = policy?.features?.dealScore ?? false;
  const dealScoreExplainEnabled =
    policy?.features?.dealScoreExplain ?? false;
  const dealScoreContextEnabled =
    policy?.features?.dealScoreContext ?? false;
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

  const parsedQueryList = useMemo(
    () =>
      formattedQuery
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [formattedQuery]
  );
  const plannedQueries = parsedQueryList.slice(0, 10);
  const plannedScans = plannedQueries.length * 1;

  const geoSummary = useMemo(() => {
    const locationLabel =
      trimmedPostal ||
      (lat !== null && lng !== null
        ? `${lat.toFixed(2)}, ${lng.toFixed(2)}`
        : "Location");
    const radiusLabel = selectedCapability.supportsRadiusKm
      ? `${radiusMiles} miles`
      : "Location approximated";
    const marketLabel = selectedMarketplace?.label ?? marketplace;
    return `Location: ${locationLabel} · ${radiusLabel} · ${marketLabel}`;
  }, [
    trimmedPostal,
    lat,
    lng,
    radiusMiles,
    selectedCapability.supportsRadiusKm,
    selectedMarketplace,
    marketplace,
  ]);

  const errorMarkets = useMemo(() => {
    if (!errors.length) return [];
    const labels = new Set<string>();
    for (const entry of errors) {
      const label =
        MARKETPLACES[entry.marketplaceId as MarketplaceId]?.label ??
        entry.marketplaceId;
      labels.add(label);
    }
    return Array.from(labels);
  }, [errors]);

  const infoMessages = useMemo(() => {
    const messages: string[] = [];
    if (clientLimitHit) {
      const entered = parsedQueryList.length;
      messages.push(
        `${entered} queries entered -> capped at 10 (plan limit).`
      );
    }
    if (
      typeof requestedQueries === "number" &&
      executedQueries?.length &&
      requestedQueries > executedQueries.length
    ) {
      messages.push(
        `${requestedQueries} queries entered -> ran ${executedQueries.length} (plan limit).`
      );
    }
    if (
      typeof requestedMarkets === "number" &&
      requestedMarkets > 0 &&
      executedMarkets?.length &&
      requestedMarkets > executedMarkets.length
    ) {
      const skipped = requestedMarkets - executedMarkets.length;
      if (skipped > 0) {
        messages.push(`${skipped} markets skipped (plan limit).`);
      }
    }
    if (meta?.radiusIgnoredMarkets && meta.radiusIgnoredMarkets.length > 0) {
      const ignored = meta.radiusIgnoredMarkets
        .map(
          (market) =>
            MARKETPLACES[market as MarketplaceId]?.label ?? market
        )
        .join(", ");
      messages.push(
        `Some selected markets do not support precise location filtering: ${ignored}.`
      );
    }
    if (errorMarkets.length > 0) {
      messages.push(
        `${errorMarkets.join(
          ", "
        )} unavailable this run; will retry automatically.`
      );
    }
    if (meta?.warnings && meta.warnings.length > 0) {
      meta.warnings.forEach((warning) => messages.push(warning));
    }
    return Array.from(new Set(messages));
  }, [
    clientLimitHit,
    parsedQueryList.length,
    requestedQueries,
    executedQueries,
    requestedMarkets,
    executedMarkets,
    meta?.radiusIgnoredMarkets,
    meta?.warnings,
    errorMarkets,
  ]);

  const executedScans = useMemo(() => {
    if (executedQueries?.length && executedMarkets?.length) {
      return executedQueries.length * executedMarkets.length;
    }
    return results.length;
  }, [executedQueries, executedMarkets, results.length]);

  const lastChecked = useMemo(() => {
    const timestamps = results
      .map((result) => result.timestamp)
      .filter((value): value is string => typeof value === "string");
    if (!timestamps.length) return null;
    const latest = timestamps.sort().at(-1) ?? null;
    return formatRelativeTime(latest);
  }, [results]);

  const scannedMarkets = useMemo(() => {
    const unique = new Set<string>();
    results.forEach((result) => unique.add(result.market));
    return Array.from(unique);
  }, [results]);

  const marketProgress = useMemo(() => {
    if (!executedMarkets?.length) return null;
    const total =
      typeof requestedMarkets === "number" && requestedMarkets > 0
        ? requestedMarkets
        : executedMarkets.length;
    return `${executedMarkets.length} / ${total} markets completed`;
  }, [executedMarkets, requestedMarkets]);

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
    setErrors([]);
    setPolicy(null);
    setMeta(null);
    setRequestedQueries(null);
    setRequestedMarkets(null);
    setExecutedQueries(null);
    setExecutedMarkets(null);

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
        setError(
          "This scan could not run with the current settings. Adjust your inputs and try again."
        );
        setLoading(false);
        return;
      }

      if (response.status === 429) {
        setError(
          "You've reached today's usage allowance. New scans resume tomorrow."
        );
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError("This scan could not be completed. Please try again.");
        if (process.env.NODE_ENV !== "production") {
          console.log("Search error", responseJson);
        }
        setLoading(false);
        return;
      }

      const payload = responseJson as SearchResponse;
      if (payload.blocked) {
        const reason =
          payload.reason ||
          "This scan was paused to stay within your current plan limits.";
        setError(reason);
        setPolicy(payload.policy || null);
        setMeta(payload.meta || null);
        setLoading(false);
        return;
      }
      setResults(payload.results || []);
      setErrors(payload.errors || []);
      setPolicy(payload.policy || null);
      setMeta(payload.meta || null);
      setRequestedQueries(payload.requestedQueries ?? null);
      setRequestedMarkets(payload.requestedMarkets ?? null);
      setExecutedQueries(payload.executedQueries ?? null);
      setExecutedMarkets(payload.markets ?? null);
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
      setError("This scan could not be completed. Please try again.");
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
              placeholder="iphone 13, macbook pro, ps5..."
              className="w-full rounded-lg bg-[#0f0f0f] border border-white/10 px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-[#00E5FF]/60 disabled:opacity-60"
              required
              disabled={disabled || loading}
            />
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
              title={geoBadge.tooltip}
              className={`mt-2 inline-flex items-center gap-2 rounded-full border px-2 py-1 text-[11px] ${geoBadge.className}`}
            >
              Location accuracy: {geoBadge.label}
            </div>
          </div>
          <div className="flex items-end gap-3">
            <button
              type="submit"
              disabled={loading || disabled}
              className="w-full rounded-lg bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] px-4 py-2 font-semibold text-white transition hover:from-[#00E5FF]/90 hover:to-[#7B2FFF]/90 disabled:opacity-60"
            >
              {loading ? "Running scan..." : "Run scan"}
            </button>
            {estimatedCuTotal !== null && (
              <span
                title="This is an estimate based on the number of queries, markets, and location settings. Final usage is recorded after the scan completes."
                className="whitespace-nowrap rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-white/70"
              >
                Estimated usage: ~{estimatedCuTotal.toFixed(1)} CU
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-white/70">
          {geoBadges.map((badge) => (
            <div
              key={badge.value}
              title={badge.badge.tooltip}
              className={`rounded-full border px-2 py-1 ${badge.badge.className}`}
            >
              {badge.label}: {badge.badge.label}
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/70">
          <div className="text-[11px] font-semibold text-white/80">
            Location Accuracy
          </div>
          <div className="mt-1 text-[11px] text-white/60">
            Some marketplaces support precise location filtering, while others
            approximate by region. Magnus always shows you how accurately each
            scan matched your requested location.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
          <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">
            {geoSummary}
          </span>
          {meta?.poolingApplied && (
            <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">
              Pooled execution enabled
            </span>
          )}
        </div>
        {infoMessages.length > 0 && (
          <div className="space-y-1 text-xs text-yellow-200">
            {infoMessages.map((message) => (
              <div key={message}>{message}</div>
            ))}
          </div>
        )}
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
            {selectedMarketplace.label} does not support precise location
            filtering. Results may be matched by region instead.
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
          <div>Running pooled scan...</div>
          {plannedScans > 0 && (
            <div className="mt-1 text-xs text-white/50">
              {`0 / ${plannedScans} scans completed`}
            </div>
          )}
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
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
            {lastChecked && <span>Last checked {lastChecked}</span>}
            {scannedMarkets.length > 0 && (
              <span>{`Scanned ${scannedMarkets.length} markets`}</span>
            )}
            {meta?.poolingApplied && <span>Pooled execution enabled</span>}
            {marketProgress && <span>{marketProgress}</span>}
            {plannedScans > 0 && executedScans > 0 && (
              <span>{`Completed ${executedScans} / ${plannedScans} scans`}</span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm text-white/70">
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="text-xs text-white/50">Total listings</div>
              <div className="text-base font-semibold text-white">
                {totalResults}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="text-xs text-white/50">Scans completed</div>
              <div className="text-base font-semibold text-white">
                {plannedScans > 0
                  ? `${executedScans} / ${plannedScans}`
                  : results.length}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="text-xs text-white/50">Avg duration</div>
              <div className="text-base font-semibold text-white">
                {avgDuration ? `${avgDuration} ms` : "n/a"}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="text-xs text-white/50">Effective location</div>
              <div className="text-base font-semibold text-white">
                {effectiveDetails.locationLabel || "n/a"}
              </div>
              <div className="mt-1 text-xs text-white/50">
                Effective radius:{" "}
                {typeof effectiveDetails.radiusKm === "number"
                  ? `${effectiveDetails.radiusKm.toFixed(1)} km`
                  : "n/a"}
              </div>
            </div>
          </div>

          {!dealScoreEnabled && policy && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
              Upgrade to unlock Deal Score for each listing.
            </div>
          )}
          {dealScoreEnabled && !dealScoreExplainEnabled && policy && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
              Upgrade to see why a listing scores well.
            </div>
          )}

          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={`${result.market}-${result.query}-${index}`}
                className="rounded-lg border border-white/10 bg-black/40 p-4"
              >
                {(() => {
                  const marketLabel =
                    MARKETPLACES[result.market as MarketplaceId]?.label ??
                    result.market;
                  const quality = getResultQuality(result.count, result.items);
                  const fetchSeconds = (
                    (result.durationMs ?? 0) / 1000
                  ).toFixed(2);
                  return (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-white/70">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[11px] uppercase tracking-wide text-white/70">
                          {marketLabel}
                        </span>
                        <span className="text-white font-semibold">
                          {result.query}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-1 text-[11px] ${quality.className}`}
                        >
                          {quality.label}
                        </span>
                      </div>
                      <div className="text-xs text-white/60">
                        {`Fetched in ${fetchSeconds}s · ${result.count} results`}
                      </div>
                    </div>
                  );
                })()}
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
                        ]) || "n/a";
                      const locationLabel =
                        pickField(item, [
                          "location.city",
                          "city",
                          "location.name",
                          "location.address",
                        ]) || "n/a";
                      const link =
                        pickField(item, [
                          "url",
                          "listingUrl",
                          "itemUrl",
                          "link",
                          "productUrl",
                          "permalink",
                        ]) || "";
                      const dealScore = (item as any)?.dealScore;
                      const showDealScore =
                        dealScoreEnabled &&
                        dealScore &&
                        typeof dealScore.score === "number";
                      const showExplanation =
                        showDealScore &&
                        dealScoreExplainEnabled &&
                        Array.isArray(dealScore.explanation) &&
                        dealScore.explanation.length > 0;
                      const confidenceLabel = showDealScore
                        ? formatConfidence(dealScore.confidence)
                        : null;
                      const marketMedian =
                        dealScoreContextEnabled &&
                        typeof dealScore?.context?.marketMedian === "number"
                          ? dealScore.context.marketMedian
                          : null;
                      const listingCount =
                        dealScoreContextEnabled &&
                        typeof dealScore?.context?.listingCount === "number"
                          ? dealScore.context.listingCount
                          : null;
                      const itemLatLng = getItemLatLng(item);
                      const distanceMiles =
                        result.locationUsed &&
                        typeof result.locationUsed.lat === "number" &&
                        typeof result.locationUsed.lng === "number" &&
                        itemLatLng
                          ? haversineMiles(
                              {
                                lat: result.locationUsed.lat,
                                lng: result.locationUsed.lng,
                              },
                              itemLatLng
                            )
                          : null;
                      const distanceLabel =
                        distanceMiles && Number.isFinite(distanceMiles)
                          ? `~${Math.round(distanceMiles)} miles away`
                          : null;

                      return (
                        <div
                          key={`${result.market}-${itemIndex}`}
                          className="rounded-lg border border-white/10 bg-[#0f0f0f] p-3 text-xs text-white/70 transition hover:border-[#00E5FF]/40"
                        >
                          <div className="flex items-start justify-between gap-2">
                            {link ? (
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-white hover:text-cyan-300"
                              >
                                {title}
                              </a>
                            ) : (
                              <div className="text-sm font-semibold text-white">
                                {title}
                              </div>
                            )}
                            {showDealScore && (
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[11px] ${getDealScoreTone(
                                  dealScore.score
                                )}`}
                              >
                                {`Deal Score ${dealScore.score}`}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-emerald-300 font-semibold">
                              {price}
                            </span>
                            <span>{locationLabel}</span>
                          </div>
                          {distanceLabel && (
                            <div className="mt-2 text-[11px] text-white/60">
                              {distanceLabel}
                            </div>
                          )}
                          {showDealScore && (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/70">
                              <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5">
                                {`Confidence: ${confidenceLabel}`}
                              </span>
                              {marketMedian !== null && (
                                <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5">
                                  {`Median: ${marketMedian.toFixed(0)}`}
                                </span>
                              )}
                              {listingCount !== null && (
                                <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5">
                                  {`Listings: ${listingCount}`}
                                </span>
                              )}
                            </div>
                          )}
                          {showExplanation && (
                            <details className="mt-2 text-[11px] text-white/60">
                              <summary className="cursor-pointer text-white/70">
                                Why this is interesting
                              </summary>
                              <ul className="mt-2 space-y-1 list-disc list-inside">
                                {dealScore.explanation.map(
                                  (line: string, idx: number) => (
                                    <li key={`${result.market}-${itemIndex}-${idx}`}>
                                      {line}
                                    </li>
                                  )
                                )}
                              </ul>
                            </details>
                          )}
                        </div>
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
