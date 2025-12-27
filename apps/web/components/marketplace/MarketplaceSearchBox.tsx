"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Marketplace = "facebook" | "ebay" | "vinted" | "gumtree";

type SearchRequest = {
  query: string;
  marketplace: Marketplace;
  user_id: string;
  scan_window: {
    requested_at: string;
    status: "requested";
    source: "user_search";
  };
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

const FALLBACK_LISTINGS = [
  {
    title: "MacBook Pro 13\" • M1",
    price: "$899",
    location: "London",
  },
  {
    title: "MacBook Pro 14\" • 16GB",
    price: "$1,299",
    location: "Manchester",
  },
  {
    title: "MacBook Pro 16\" • 1TB",
    price: "$1,799",
    location: "Birmingham",
  },
];

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
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const placeholderListings = useMemo(() => {
    if (!query.trim()) return FALLBACK_LISTINGS;
    return FALLBACK_LISTINGS.map((listing) => ({
      ...listing,
      title: `${query.trim()} • ${listing.title.split("•")[1]?.trim() || "Deal"}`,
    }));
  }, [query]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (disabled) {
      return;
    }
    setError(null);
    setLoading(true);
    setShowResults(false);
    setStatusLabel(null);
    setProgress(null);
    setShowSkeleton(false);
    setShowExpired(false);

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError("Please enter a search term.");
      setLoading(false);
      return;
    }

    let supabase;
    try {
      supabase = supabaseBrowser();
    } catch (err) {
      setError("Login required to start a scan.");
      setLoading(false);
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setError("Login required to start a scan.");
        setLoading(false);
        return;
      }

      const searchRequest: SearchRequest = {
        query: trimmedQuery,
        marketplace,
        user_id: userData.user.id,
        scan_window: {
          requested_at: new Date().toISOString(),
          status: "requested",
          source: "user_search",
        },
      };

      const entitlementRes = await fetch("/api/entitlements/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: searchRequest.user_id,
          marketplace: searchRequest.marketplace,
        }),
      });

      const entitlementJson: { ok?: boolean; reason?: string } =
        await entitlementRes.json().catch(() => ({}));

      if (!entitlementRes.ok || entitlementJson.ok !== true) {
        setError(
          entitlementJson.reason === "execution_not_allowed"
            ? "Execution is currently paused."
            : entitlementJson.reason === "execution_emergency_off"
            ? "Execution is temporarily paused for safety."
            : "You need scan credits to start a search."
        );
        setLoading(false);
        return;
      }

      const keywords = trimmedQuery
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const { error: saveError } = await supabase.from("saved_searches").insert({
        user_id: searchRequest.user_id,
        name: trimmedQuery,
        keywords,
        marketplaces: [marketplace],
        min_price: null,
        max_price: null,
        location: null,
        condition: null,
        active: true,
      });

      if (saveError) {
        console.warn("saved_searches insert failed", saveError);
      }

      const ingestRes = await fetch("/api/ingest/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchRequest.query,
          marketplaces: [searchRequest.marketplace],
          user_id: searchRequest.user_id,
          scan_window: searchRequest.scan_window,
          source: "user-search",
        }),
      });

      const ingestJson = await ingestRes.json().catch(() => ({}));
      if (!ingestRes.ok) {
        throw new Error(ingestJson?.error || "Failed to start scan.");
      }

      setJobId(ingestJson?.jobId ?? null);
      setStatusLabel("Live signal");
      setProgress(ingestJson?.disabled ? 20 : 35);
      setShowResults(true);
      onSearchCreated?.(searchRequest, ingestJson?.jobId ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start scan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showResults) return;
    setShowSkeleton(true);
    setShowExpired(false);

    const skeletonTimer = setTimeout(() => {
      setShowSkeleton(false);
    }, 3000);

    const expiredTimer = setTimeout(() => {
      if (!progress) {
        setShowExpired(true);
      }
    }, 15000);

    return () => {
      clearTimeout(skeletonTimer);
      clearTimeout(expiredTimer);
    };
  }, [showResults, progress]);

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
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., MacBook Pro"
              className="w-full rounded-lg bg-[#0f0f0f] border border-white/10 px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-[#00E5FF]/60 disabled:opacity-60"
              required
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Marketplace
            </label>
            <select
              value={marketplace}
              onChange={(e) => setMarketplace(e.target.value as Marketplace)}
              className="w-full rounded-lg bg-[#0f0f0f] border border-white/10 px-4 py-2 text-white focus:outline-none focus:border-[#00E5FF]/60 disabled:opacity-60"
              disabled={disabled}
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
              {loading ? "Scanning now..." : "Instant scan"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {showResults && (
        <div className="rounded-xl border border-white/10 bg-[#0f0f0f] p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {statusLabel || "Live signal"}
            </span>
            {jobId && (
              <span className="text-white/50 text-xs">Job: {jobId}</span>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-white/60 mb-2">
              <span>Results updating</span>
              <span>{progress ?? 0}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF]"
                style={{ width: `${progress ?? 0}%` }}
              />
            </div>
          </div>

          {showSkeleton ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="rounded-lg border border-white/10 bg-black/40 overflow-hidden animate-pulse"
                >
                  <div className="h-28 w-full bg-white/5" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-3/4 bg-white/10 rounded" />
                    <div className="h-3 w-1/2 bg-white/10 rounded" />
                    <div className="h-3 w-2/3 bg-white/10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : showExpired ? (
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
              Scan expired · Live feed active when you refresh
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {placeholderListings.map((listing, idx) => (
                <div
                  key={`${listing.title}-${idx}`}
                  className="rounded-lg border border-white/10 bg-black/40 overflow-hidden"
                >
                  <img
                    src="/placeholders/listing.png"
                    alt={listing.title}
                    className="h-28 w-full object-cover"
                  />
                  <div className="p-3 space-y-1 text-xs text-white/70">
                    <div className="font-semibold text-white text-sm">
                      {listing.title}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-300 font-semibold">
                        {listing.price}
                      </span>
                      <span>{listing.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
