"use client";

import { useEffect, useState } from "react";
import { Trash2, Eye, EyeOff } from "lucide-react";
import SearchStatsPanel from "./SearchStatsPanel";

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  marketplace: string;
  filters: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalMatchesFound: number;
    totalListingsScanned: number;
    lastRunAt: string | null;
  };
}

interface SavedSearchesListProps {
  marketplace: "facebook" | "vinted";
}

export default function SavedSearchesList({ marketplace }: SavedSearchesListProps) {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSearches();
  }, [marketplace]);

  const fetchSearches = async () => {
    try {
      const response = await fetch(`/api/searches?marketplace=${marketplace}`);
      if (response.ok) {
        const data = await response.json();
        setSearches(data);
      }
    } catch (error) {
      console.error("Failed to fetch searches:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="bg-[#121212] border border-white/10 rounded-xl p-4 animate-pulse"
          >
            <div className="h-4 bg-white/10 rounded mb-3 w-3/4" />
            <div className="h-3 bg-white/10 rounded mb-2 w-1/2" />
            <div className="h-3 bg-white/10 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (searches.length === 0) {
    return (
      <div className="text-center py-8 bg-[#121212] border border-white/10 rounded-xl">
        <p className="text-white/70 font-medium mb-2">No saved searches yet</p>
        <p className="text-white/50 text-sm">
          Create your first search above to start finding deals automatically
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searches.map((search) => (
        <div
          key={search.id}
          className="bg-[#121212] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-white">{search.name}</h3>
                {search.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-green-400 bg-green-400/10 rounded-full border border-green-400/30">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-400 bg-gray-400/10 rounded-full border border-gray-400/30">
                    <EyeOff className="w-3 h-3" />
                    Paused
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                <span>Keywords: {search.filters?.keywords?.join(", ") || search.query}</span>
                {search.filters?.minPrice && (
                  <>
                    <span>•</span>
                    <span>Min: ${search.filters.minPrice}</span>
                  </>
                )}
                {search.filters?.maxPrice && (
                  <>
                    <span>•</span>
                    <span>Max: ${search.filters.maxPrice}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 mb-3 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-white/50">Matches:</span>
              <span className="font-semibold text-blue-400">
                {search.stats.totalMatchesFound}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-white/50">Scanned:</span>
              <span className="font-semibold text-white/70">
                {search.stats.totalListingsScanned}
              </span>
            </div>
            {search.stats.lastRunAt && (
              <div className="flex items-center gap-1.5">
                <span className="text-white/50">Last run:</span>
                <span className="font-semibold text-white/70">
                  {formatDate(search.stats.lastRunAt)}
                </span>
              </div>
            )}
          </div>

          {/* Stats Panel */}
          <SearchStatsPanel searchId={search.id} searchName={search.name} />
        </div>
      ))}
    </div>
  );
}
