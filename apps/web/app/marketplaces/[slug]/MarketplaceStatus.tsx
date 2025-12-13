"use client";

import { useEffect, useState } from "react";

type MarketplaceStatusProps = {
  marketplace: string;
};

type HealthStatus = {
  status: 'live' | 'stale' | 'offline';
  lastSuccess?: string;
  lastSuccessAgo?: number;
  recentListings?: number;
};

export default function MarketplaceStatus({ marketplace }: MarketplaceStatusProps) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const res = await fetch(`${apiBase}/api/health/workers`, {
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();
          setHealth(data.marketplaces?.[marketplace.toLowerCase()] || null);
        }
      } catch (error) {
        console.error("Error fetching marketplace health:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [marketplace]);

  if (loading) {
    return (
      <div className="flex items-center gap-4 text-sm text-white/70 font-medium">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-white/30 animate-pulse" />
          Checking status...
        </span>
      </div>
    );
  }

  const isLive = health?.status === 'live';
  const isStale = health?.status === 'stale';
  const isOffline = health?.status === 'offline' || !health;

  return (
    <div className="flex items-center gap-4 text-sm text-white/70 font-medium">
      <span className="inline-flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            isLive
              ? "bg-[#00E5FF] animate-pulse"
              : isStale
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
        />
        {isLive
          ? "Live scanning"
          : isStale
          ? "Scanning paused"
          : "Pipeline offline"}
      </span>
      {health?.recentListings !== undefined && (
        <>
          <span>•</span>
          <span>{health.recentListings} listings (last 10 min)</span>
        </>
      )}
      {health?.lastSuccessAgo !== undefined && health.lastSuccessAgo > 0 && (
        <>
          <span>•</span>
          <span>
            Last update: {Math.floor(health.lastSuccessAgo / 60)}m ago
          </span>
        </>
      )}
    </div>
  );
}
