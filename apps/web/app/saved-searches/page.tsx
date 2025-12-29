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
        setError(payload?.error || "Failed to load saved searches.");
        return;
      }
      setSavedSearches(payload.savedSearches ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load saved searches.");
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
        setError("You must be logged in to save searches.");
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
        setError(payload?.error || "Failed to save search.");
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
      setError(err instanceof Error ? err.message : "Failed to save search.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (search: SavedSearch) => {
    setError(null);
    const token = await getToken();
    if (!token) {
      setError("You must be logged in to update searches.");
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
      setError(payload?.error || "Failed to update search.");
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
      setError("You must be logged in to update searches.");
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
      setError(payload?.error || "Failed to update search.");
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
      setError("You must be logged in to delete searches.");
      return;
    }
    const response = await fetch(`/api/saved-searches/${searchId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error || "Failed to delete search.");
      return;
    }
    setSavedSearches((prev) => prev.filter((item) => item.id !== searchId));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <h1 className="text-3xl font-semibold mb-3">Saved Searches</h1>
        <p className="text-white/70 mb-6">
          Log in to create alerts and scheduled searches.
        </p>
        <Link
          href="/login"
          className="rounded-lg bg-white text-black px-4 py-2 font-semibold"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Saved Searches</h1>
          <p className="text-white/70">
            Schedule pooled scans and receive email alerts (best effort).
          </p>
        </header>

        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-white/10 bg-[#0f0f0f] p-6 space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-white/70 mb-1">Search name</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                placeholder="UK iPhone deals"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Queries</label>
              <input
                value={queries}
                onChange={(event) => setQueries(event.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2"
                placeholder="iphone, macbook"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">Markets</label>
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
              Provide location text or postal, and optionally lat/lng with radius.
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Frequency</label>
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
            {loading ? "Saving..." : "Save search"}
          </button>
        </form>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Your saved searches</h2>
          {loading && (
            <div className="text-sm text-white/60">Loading saved searches...</div>
          )}
          {!loading && savedSearches.length === 0 && (
            <div className="text-sm text-white/60">
              No saved searches yet.
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
                </div>
                <div className="flex items-center gap-2">
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
                  >
                    {search.enabled ? "Disable" : "Enable"}
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
                <span>Frequency: {search.frequency}</span>
                <span>Markets: {search.markets.join(", ")}</span>
                {search.geo ? (
                  <span>
                    Geo:{" "}
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
