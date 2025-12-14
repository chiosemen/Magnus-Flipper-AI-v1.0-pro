"use client";

import { useState } from "react";
import { useIngestionRun } from "../../src/hooks/useIngestionRun";
type MMListing = {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  location: string;
  marketplace: "facebook";
};

export default function MMAgent() {
  const [query, setQuery] = useState("");
  const [geo, setGeo] = useState<"US" | "UK">("US");
  const { runIngestion, status, progress, results } = useIngestionRun();

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

  // Extract listings from results
  const listings: MMListing[] = results
    ? results.flatMap((result: any) => {
        if (result.items && Array.isArray(result.items)) {
          return result.items.map((item: any) => ({
            id: item.url || `listing_${Math.random()}`,
            title: item.title,
            price: item.price || null,
            currency: item.currency || "USD",
            location: item.location || geo,
            marketplace: "facebook" as const,
            url: item.url,
            imageUrl: item.images?.[0],
            sellerName: item.sellerName,
            scrapedAt: item.postedAt || new Date().toISOString(),
          }));
        }
        return [];
      })
    : [];

  const totalListings = results?.reduce(
    (sum: number, result: any) => sum + (result.listingsFound || 0),
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Marketplace Monitor Agent
          </h1>
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
                <a
                  key={listing.id}
                  href={listing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {listing.imageUrl && (
                    <img
                      src={listing.imageUrl}
                      alt={listing.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {listing.title}
                    </h3>
                    <div className="flex items-center justify-between mb-2">
                      {listing.price !== null ? (
                        <span className="text-lg font-bold text-blue-600">
                          {listing.currency} {listing.price.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Price not available</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {listing.location}
                    </div>
                    {listing.sellerName && (
                      <div className="text-xs text-gray-500 mt-1">
                        Seller: {listing.sellerName}
                      </div>
                    )}
                  </div>
                </a>
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
