"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { MARKETPLACES, type MarketplaceId } from "@/lib/marketplaceRegistry";
import { useAuth } from "@/app/providers/AuthProvider";

type SavedSearch = {
  id: string;
  name: string;
  queries: string[];
  markets: string[];
  geo: {
    country?: string | null;
    locationText?: string | null;
    postal?: string | null;
    lat?: number | null;
    lng?: number | null;
    radiusKm?: number | null;
    units?: "km" | "mi" | null;
  } | null;
  frequency: "daily" | "weekly";
  enabled: boolean;
  lastRun?: {
    started_at: string;
    matches_found: number;
    meta?: {
      newListings?: number;
      priceDrops?: number;
      suppressionReason?: string | null;
    };
  } | null;
};

const MARKET_OPTIONS = Object.values(MARKETPLACES).filter((market) => market.enabled);

export default function SavedSearchesPage() {
  const { isAuthenticated } = useAuth();
  const supabase = supabaseBrowser();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [queries, setQueries] = useState("");
  const [markets, setMarkets] = useState<MarketplaceId[]>([
    "facebook",
    "vinted",
  ]);
  const [locationText, setLocationText] = useState("");
  const [postal, setPostal] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radiusKm, setRadiusKm] = useState("25");
  const [country, setCountry] = useState("UK");
  const [units, setUnits] = useState<"km" | "mi">("km");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");

  const formatRelativeTime = (iso?: string | null) => {
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
  };

  const canSubmit = useMemo(() => name.trim() && queries.trim(), [name, queries]);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const loadSearches = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setSavedSearches([]);
        return;
      }
      const response = await fetch("/api/saved-searches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.error || "Unable to load watchlists right now.");
        return;
      }
      setSavedSearches(payload.savedSearches ?? []);
    } catch (err) {
      setError("Unable to load watchlists right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadSearches();
  }, [isAuthenticated]);

  const toggleMarket = (market: MarketplaceId) => {
    setMarkets((prev) =>
      prev.includes(market) ? prev.filter((m) => m !== market) : [...prev, market],
    );
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError("Sign in to save watchlists.");
        return;
      }

      const geo =
        locationText || postal || (lat && lng) || radiusKm
          ? {
              country,
              locationText: locationText || null,
              postal: postal || null,
              lat: lat ? Number(lat) : null,
              lng: lng ? Number(lng) : null,
              radiusKm: radiusKm ? Number(radiusKm) : null,
              units,
            }
          : {};

      const response = await fetch("/api/saved-searches", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          queries,
          markets,
          geo,
          frequency,
          enabled: true,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.error || "Unable to save watchlist right now.");
        return;
      }

      setName("");
      setQueries("");
      setLocationText("");
      setPostal("");
      setLat("");
      setLng("");
      setRadiusKm("25");
      setCountry("UK");
      setUnits("km");
      setFrequency("daily");
      setSavedSearches((prev) => [payload.savedSearch, ...prev]);
    } catch (err) {
      setError("Unable to save watchlist right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (search: SavedSearch) => {
    setError(null);
    const token = await getToken();
    if (!token) {
      setError("Sign in to update watchlists.");
      return;
    }
    const response = await fetch(`/api/saved-searches/${search.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ enabled: !search.enabled }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error || "Unable to update watchlist right now.");
      return;
    }
    setSavedSearches((prev) =>
      prev.map((item) => (item.id === search.id ? payload.savedSearch : item)),
    );
  };

  const handleFrequencyChange = async (
    search: SavedSearch,
    next: "daily" | "weekly",
  ) => {
    setError(null);
    const token = await getToken();
    if (!token) {
      setError("Sign in to update watchlists.");
      return;
    }
    const response = await fetch(`/api/saved-searches/${search.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ frequency: next }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error || "Unable to update watchlist right now.");
      return;
    }
    setSavedSearches((prev) =>
      prev.map((item) => (item.id === search.id ? payload.savedSearch : item)),
    );
  };

  const handleDelete = async (searchId: string) => {
    setError(null);
    const token = await getToken();
    if (!token) {
      setError("Sign in to remove watchlists.");
      return;
    }
    const response = await fetch(`/api/saved-searches/${searchId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error || "Unable to remove watchlist right now.");
      return;
    }
    setSavedSearches((prev) => prev.filter((item) => item.id !== searchId));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <h1 className="text-3xl font-semibold mb-3">Watchlists</h1>
        <p className="text-white/70 mb-6">
          Sign in to create watchlists and scheduled scans.
        </p>
        <Link
          href="/login"
          className="rounded-lg bg-white text-black px-4 py-2 font-semibold"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Watchlists</h1>
          <p className="text-white/70">
            Saved searches that run automatically on a schedule.
          </p>
        </header>

        <form
          id="create-watchlist"
          onSubmit={handleCreate}
          className="rounded-xl border border-white/10 bg-[#0f0f0f] p-6 space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-white/70 mb-1">
                Watchlist name
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                placeholder="iPhone deals near London"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Queries</label>
              <input
                value={queries}
                onChange={(event) => setQueries(event.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                placeholder="iphone 13, macbook pro, ps5"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">
              Markets scanned
            </label>
            <div className="flex flex-wrap gap-2">
              {MARKET_OPTIONS.map((market) => (
                <button
                  key={market.id}
                  type="button"
                  onClick={() => toggleMarket(market.id)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    markets.includes(market.id)
                      ? "border-cyan-300/60 bg-cyan-400/10 text-cyan-200"
                      : "border-white/10 text-white/70"
                  }`}
                >
                  {market.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">
                Location text
              </label>
              <input
                value={locationText}
                onChange={(event) => setLocationText(event.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                placeholder="London"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Postal</label>
              <input
                value={postal}
                onChange={(event) => setPostal(event.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                placeholder="SW1A 1AA"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Lat</label>
              <input
                value={lat}
                onChange={(event) => setLat(event.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                placeholder="51.5074"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Lng</label>
              <input
                value={lng}
                onChange={(event) => setLng(event.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                placeholder="-0.1278"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm text-white/70 mb-1">
                Radius
              </label>
              <input
                value={radiusKm}
                onChange={(event) => setRadiusKm(event.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                placeholder="25"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Units</label>
              <select
                value={units}
                onChange={(event) =>
                  setUnits(event.target.value as "km" | "mi")
                }
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
              >
                <option value="km">km</option>
                <option value="mi">mi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Country</label>
              <input
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                placeholder="UK"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 text-xs text-white/50">
              Some marketplaces approximate by region. Location accuracy is shown
              on each run.
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">
                Run frequency
              </label>
              <select
                value={frequency}
                onChange={(event) =>
                  setFrequency(event.target.value as "daily" | "weekly")
                }
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="rounded-lg bg-white text-black px-4 py-2 font-semibold disabled:opacity-60"
          >
            {loading ? "Saving watchlist..." : "Save watchlist"}
          </button>
        </form>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Watchlists</h2>
          {loading && (
            <div className="text-sm text-white/60">Loading watchlists...</div>
          )}
          {!loading && savedSearches.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-[#0f0f0f] p-4 text-sm text-white/70 space-y-3">
              <div>You don't have any watchlists yet.</div>
              <div>
                Create one to monitor specific markets, locations, and price
                ranges over time, automatically and within your plan limits.
              </div>
              <a
                href="#create-watchlist"
                className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white"
              >
                Create Watchlist
              </a>
            </div>
          )}
          {savedSearches.map((search) => (
            <div
              key={search.id}
              className="rounded-xl border border-white/10 bg-[#0f0f0f] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{search.name}</div>
                  <div className="text-xs text-white/50">
                    {search.queries.join(", ")}
                  </div>
                  {search.lastRun ? (
                    <div className="mt-1 text-xs text-white/60">
                      <div className="text-white/70">
                        {search.lastRun.meta?.suppressionReason
                          ? "Last run: Skipped to stay within your plan limits."
                          : "Last run: Completed successfully."}
                      </div>
                      <div className="mt-1">
                        {(() => {
                          const newListings =
                            typeof search.lastRun?.meta?.newListings === "number"
                              ? search.lastRun.meta.newListings
                              : search.lastRun.matches_found;
                          if (newListings === 0) {
                            return "Preview: no new listings on last run.";
                          }
                          return `Preview: last run would have found ${newListings} new listings.`;
                        })()}
                        {search.lastRun.meta?.priceDrops
                          ? ` · ${search.lastRun.meta.priceDrops} price drops`
                          : ""}
                        {search.lastRun.started_at
                          ? ` · last checked ${formatRelativeTime(
                              search.lastRun.started_at
                            )}`
                          : ""}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-white/50">
                      Preview: no runs yet.
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    title="This watchlist runs under your current plan limits."
                    className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-white/60"
                  >
                    Plan limits
                  </span>
                  <select
                    value={search.frequency}
                    onChange={(event) =>
                      handleFrequencyChange(
                        search,
                        event.target.value as "daily" | "weekly",
                      )
                    }
                    className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                  <button
                    onClick={() => handleToggle(search)}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs"
                    title={
                      search.enabled
                        ? "Paused watchlists won't run on schedule."
                        : undefined
                    }
                  >
                    {search.enabled ? "Pause watchlist" : "Resume watchlist"}
                  </button>
                  <button
                    onClick={() => handleDelete(search.id)}
                    className="rounded-full border border-red-500/40 px-3 py-1 text-xs text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
                <span>Run frequency: {search.frequency}</span>
                <span>Markets scanned: {search.markets.join(", ")}</span>
                {search.geo ? (
                  <span>
                    Search area:{" "}
                    {[
                      search.geo.country,
                      search.geo.locationText,
                      search.geo.postal,
                      search.geo.lat && search.geo.lng
                        ? `${search.geo.lat.toFixed(2)},${search.geo.lng.toFixed(2)}`
                        : null,
                      search.geo.radiusKm
                        ? `${search.geo.radiusKm} ${search.geo.units ?? "km"}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" - ")}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
