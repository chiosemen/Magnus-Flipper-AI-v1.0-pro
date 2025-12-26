"use client";

import { useState, useEffect } from "react";

interface SearchStats {
  searchId: string;
  searchName: string;
  marketplace: string;
  totalListingsScanned: number;
  totalMatchesFound: number;
  totalRuns: number;
  lastRunAt: string | null;
  avgMatchesPerDay: number;
  avgMatchesPerRun: number;
  createdAt: string;
  daysSinceCreation: number;
}

interface ActivityItem {
  date: string;
  title: string;
  price: number;
  marketplace: string;
  url: string;
  imageUrl?: string;
}

interface SearchStatsData {
  stats: SearchStats;
  activity: ActivityItem[];
}

interface SearchStatsPanelProps {
  searchId: string;
  searchName: string;
}

export default function SearchStatsPanel({ searchId, searchName }: SearchStatsPanelProps) {
  const [data, setData] = useState<SearchStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const fallbackImage = "/placeholders/listing.png";

  useEffect(() => {
    setLoading(false);
  }, [searchId, expanded]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  if (!expanded) {
    return (
      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <button
          onClick={() => setExpanded(true)}
          className="w-full text-left text-sm text-gray-600 hover:text-gray-900 flex items-center justify-between"
        >
          <span>📊 View Performance Stats</span>
          <span className="text-xs">▼</span>
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900">Performance Stats</h4>
          <button
            onClick={() => setExpanded(false)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ▲ Collapse
          </button>
        </div>
        <div className="text-sm text-gray-500">Loading stats...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900">Performance Stats</h4>
          <button
            onClick={() => setExpanded(false)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ▲ Collapse
          </button>
        </div>
        <div className="text-sm text-gray-500">No stats available yet</div>
      </div>
    );
  }

  const { stats, activity } = data;

  return (
    <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-900">📊 Performance Stats</h4>
        <button
          onClick={() => setExpanded(false)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ▲ Collapse
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3 rounded border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Total Matches</div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalMatchesFound}</div>
        </div>

        <div className="bg-white p-3 rounded border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Listings Scanned</div>
          <div className="text-2xl font-bold text-gray-700">{stats.totalListingsScanned}</div>
        </div>

        <div className="bg-white p-3 rounded border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Avg/Day</div>
          <div className="text-2xl font-bold text-green-600">{stats.avgMatchesPerDay}</div>
        </div>

        <div className="bg-white p-3 rounded border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Total Runs</div>
          <div className="text-2xl font-bold text-purple-600">{stats.totalRuns}</div>
        </div>
      </div>

      {/* Last Run Info */}
      <div className="mb-4 p-3 bg-white rounded border border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            <strong>Last Run:</strong>{" "}
            {stats.lastRunAt ? formatDate(stats.lastRunAt) : "Never"}
          </span>
          <span className="text-gray-600">
            <strong>Active:</strong> {stats.daysSinceCreation} days
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Average {stats.avgMatchesPerRun} matches per run • {stats.marketplace}
        </div>
      </div>

      {/* Activity Timeline */}
      {activity.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Recent Matches ({activity.length})
          </h5>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activity.map((item, index) => (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-2 bg-white rounded border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <img
                  src={item.imageUrl || fallbackImage}
                  alt={item.title}
                  className="w-12 h-12 object-cover rounded flex-shrink-0"
                  onError={(e) => {
                    if (e.currentTarget.src !== fallbackImage) {
                      e.currentTarget.src = fallbackImage;
                    }
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-semibold text-green-600">
                      {formatPrice(item.price)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {activity.length === 0 && (
        <div className="text-center py-6 text-gray-400 text-sm">
          No matches yet. Keep this search active and we'll notify you when we find deals!
        </div>
      )}
    </div>
  );
}
