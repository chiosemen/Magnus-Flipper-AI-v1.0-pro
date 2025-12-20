"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type SavedSearch = {
  id: string;
  query: string;
  region: string;
  marketplace: string;
  cron: string;
  cronLabel?: string;
  priceDropPct?: number;
  paused: boolean;
  lastRun?: string;
  trend?: "up" | "down" | "flat";
  createdAt: string;
};

export default function SavedSearchesPage() {
  const isDev = process.env.NODE_ENV === "development";
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isDev) {
      setLoading(false);
      return;
    }

    fetchSearches();
  }, [isDev]);

  const fetchSearches = async () => {
    try {
      const res = await fetch("/api/saved-searches?userId=anonymous");
      if (res.ok) {
        const data = await res.json();
        setSearches(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching saved searches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (id: string) => {
    try {
      const res = await fetch(`/api/saved-searches/${id}/pause?userId=anonymous`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchSearches();
      }
    } catch (error) {
      console.error("Error toggling pause:", error);
    }
  };

  const handleRunNow = async (id: string) => {
    try {
      const res = await fetch(`/api/saved-searches/${id}/run?userId=anonymous`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        // Redirect to mm-agent with jobId to show status
        window.location.href = `/tech-trade?jobId=${data.jobId}`;
      }
    } catch (error) {
      console.error("Error running search:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this saved search?")) return;

    try {
      const res = await fetch(`/api/saved-searches?id=${id}&userId=anonymous`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchSearches();
      }
    } catch (error) {
      console.error("Error deleting search:", error);
    }
  };

  const getTrendBadge = (trend?: string) => {
    if (!trend) return null;
    const map = {
      up: { text: "⬆️ Prices rising", className: "bg-red-100 text-red-800" },
      down: { text: "⬇️ Price drop", className: "bg-green-100 text-green-800" },
      flat: { text: "→ Stable", className: "bg-gray-100 text-gray-800" },
    };
    const config = map[trend as keyof typeof map] || map.flat;
    return (
      <span className={`text-xs px-2 py-1 rounded ${config.className}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Loading saved searches...</p>
        </div>
      </div>
    );
  }

  if (!isDev) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Saved Searches</h1>
          <p className="text-gray-600">
            This legacy page is disabled. Use the marketplace pages backed by pooled data instead.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Saved Searches</h1>
            <Link
              href="/tech-trade"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              New Search
            </Link>
          </div>
        </div>

        {searches.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <p className="text-gray-600 mb-4">No saved searches yet.</p>
            <Link
              href="/tech-trade"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Create your first saved search
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searches.map((search) => (
              <div
                key={search.id}
                className="bg-white rounded-xl border p-4 shadow-sm space-y-3"
              >
                <div className="font-semibold text-gray-900">{search.query}</div>
                <div className="text-sm text-gray-600">
                  {search.marketplace} • {search.region}
                </div>

                <div className="text-sm text-gray-600">
                  Schedule: {search.cronLabel || search.cron}
                </div>

                {getTrendBadge(search.trend)}

                {search.lastRun && (
                  <div className="text-xs text-gray-500">
                    Last run: {new Date(search.lastRun).toLocaleString()}
                  </div>
                )}

                {search.priceDropPct && (
                  <div className="text-xs text-gray-500">
                    Alert threshold: {search.priceDropPct}% drop
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <button
                    onClick={() => handleRunNow(search.id)}
                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Run now
                  </button>
                  <button
                    onClick={() => handlePause(search.id)}
                    className={`flex-1 px-3 py-1.5 text-sm rounded ${
                      search.paused
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {search.paused ? "Resume" : "Pause"}
                  </button>
                  <button
                    onClick={() => handleDelete(search.id)}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
