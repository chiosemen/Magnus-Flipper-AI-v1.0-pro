"use client";

import { useState, useEffect } from "react";
import { useIngestionRun } from "../../src/hooks/useIngestionRun";
import { BlurImage } from "../../src/components/BlurImage";

type MMListing = {
  id: string;
  title: string;
  url: string;
  priceText?: string;
  currency?: string;
  priceValue?: number;
  imageUrl?: string;
  locationText?: string;
  sellerName?: string;
  scrapedAt: string;
  source: "facebook";
  confidence: number;
};

const CRON_PRESETS = [
  { label: "Every 5 min", value: "*/5 * * * *" },
  { label: "Every 15 min", value: "*/15 * * * *" },
  { label: "Hourly", value: "0 * * * *" },
  { label: "Daily 9am", value: "0 9 * * *" },
];

export default function MMAgent() {
  const [query, setQuery] = useState("");
  const [geo, setGeo] = useState<"US" | "UK">("US");
  const [selectedCron, setSelectedCron] = useState("*/15 * * * *");
  const [savedSearchId, setSavedSearchId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { runIngestion, status, message, progress, results } = useIngestionRun();

  // Poll for notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications?userId=anonymous");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.notifications?.length || 0);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const requestId = crypto.randomUUID();
    await runIngestion({
      requestId,
      initiatedBy: "mm-agent",
      mode: "db-lite",
      marketplaces: ["facebook"],
      geo,
      searches: [
        {
          searchId: `fb_${geo}_${Date.now()}`,
          marketplace: "facebook",
          query: query.trim(),
          location: geo === "US" ? "United States" : "United Kingdom",
          filters: {},
        },
      ],
    });
  };

  const handleSaveSearch = async () => {
    if (!query.trim() || saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "anonymous", // TODO: use actual user ID when auth is available
          query: query.trim(),
          region: geo,
          cron: selectedCron,
          priceDropPct: 10, // Default 10% price drop threshold
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setSavedSearchId(data.id);
      }
    } catch (error) {
      console.error("Error saving search:", error);
    } finally {
      setSaving(false);
    }
  };

  // Extract listings from results
  const listings: MMListing[] = results
    ? results.flatMap((result: any) => {
        if (result.items && Array.isArray(result.items)) {
          return result.items.map((item: any) => {
            const listing: MMListing = {
              id: item.listingId || item.id || item.url || `listing_${Math.random()}`,
              title: item.title || "Unknown",
              url: item.url || `https://facebook.com/marketplace/item/${item.listingId || item.id || Math.random()}`,
              priceText: item.priceText,
              currency: item.currency,
              priceValue: item.priceValue,
              imageUrl: item.imageUrl,
              locationText: item.locationText || item.location || geo,
              sellerName: item.sellerName,
              scrapedAt: item.scrapedAt || item.postedAt || new Date().toISOString(),
              source: "facebook",
              confidence: item.confidence ?? 0.5,
            };
            
            // Store listingId for React key
            (listing as any).listingId = item.listingId || listing.id;
            
            return listing;
          });
        }
        return [];
      })
    : [];

  // Use all listings - image rendering is best-effort, not mandatory

  const totalListings = results?.reduce(
    (sum: number, result: any) => sum + (result.listingsFound || 0),
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Marketplace Monitor Agent
            </h1>
            {unreadCount > 0 && (
              <div className="relative">
                <button
                  onClick={() => {
                    // TODO: Open notification panel
                    alert(`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`);
                  }}
                  className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700"
                >
                  Notifications
                  <span className="ml-2 rounded-full bg-white text-red-600 px-2 py-0.5 text-xs font-bold">
                    {unreadCount}
                  </span>
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Facebook Marketplace (Tier A)
            </span>
            {geo && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {geo}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                Search Query
              </label>
              <input
                id="query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., iphone 14, macbook pro"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="geo" className="block text-sm font-medium text-gray-700 mb-2">
                Region
              </label>
              <select
                id="geo"
                value={geo}
                onChange={(e) => setGeo(e.target.value as "US" | "UK")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={status === "running" || status === "queued"}
            className="mt-4 w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {status === "running" || status === "queued" ? "Searching..." : "Search Marketplace"}
          </button>
        </form>

        {status === "completed" && listings.length > 0 && !savedSearchId && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save This Search</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label htmlFor="cron" className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule
                </label>
                <select
                  id="cron"
                  value={selectedCron}
                  onChange={(e) => setSelectedCron(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {CRON_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSaveSearch}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Search"}
              </button>
            </div>
          </div>
        )}

        {savedSearchId && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-8">
            <p className="text-green-800 font-medium">Saved ✓</p>
            <p className="text-green-600 text-sm mt-1">
              Will re-scan {CRON_PRESETS.find((p) => p.value === selectedCron)?.label.toLowerCase() || "on schedule"}
            </p>
          </div>
        )}

        {status && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Status</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                status === "completed" ? "bg-green-100 text-green-800" :
                status === "running" ? "bg-blue-100 text-blue-800" :
                status === "failed" ? "bg-red-100 text-red-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {status}
              </span>
            </div>
            {message && (
              <div className="mb-4 text-sm text-gray-600">
                {message}
              </div>
            )}
            {progress && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{progress.completed} / {progress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
            {totalListings > 0 && (
              <div className="text-sm text-gray-600">
                Found {totalListings} listing{totalListings !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}

        {listings.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Results ({listings.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <div
                  key={(listing as any).listingId || listing.id}
                  className="bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {listing.imageUrl ? (
                    <BlurImage
                      src={listing.imageUrl}
                      alt={listing.title}
                      className="mb-3"
                    />
                  ) : (
                    <div className="w-full h-44 rounded-lg bg-gray-100 mb-3 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No image</span>
                    </div>
                  )}

                  <div className="mt-3 font-semibold text-gray-900 line-clamp-2 mb-2">
                    {listing.title}
                  </div>

                  <div className="text-sm mb-2">
                    {listing.priceText ? (
                      <span className="text-lg font-bold text-green-600">
                        {listing.priceText}
                      </span>
                    ) : (
                      <span className="text-gray-500">Price not found</span>
                    )}
                  </div>

                  {listing.locationText && (
                    <div className="text-xs text-gray-600 mb-2">
                      {listing.locationText}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        listing.confidence >= 0.7
                          ? "bg-green-100 text-green-800"
                          : listing.confidence >= 0.4
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {listing.confidence >= 0.7
                        ? "High"
                        : listing.confidence >= 0.4
                        ? "Medium"
                        : "Low"}
                    </span>
                    <a
                      href={listing.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 underline hover:text-blue-800"
                    >
                      View on Facebook
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {status === "completed" && listings.length === 0 && (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <p className="text-gray-600">No listings found for this search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
