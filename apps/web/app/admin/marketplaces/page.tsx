"use client";

// Force dynamic rendering - admin routes use cookies/auth
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { AdminHeader } from "../components/AdminHeader";
import { useState, useEffect } from "react";

interface MarketplaceSetting {
  id: string;
  marketplace: string;
  enabled: boolean;
  last_sync: string | null;
  api_health: "healthy" | "degraded" | "down";
  updated_at: string;
}

export default function MarketplacesPage() {
  const [marketplaces, setMarketplaces] = useState<MarketplaceSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketplaces();
  }, []);

  const fetchMarketplaces = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(`${apiBase}/api/admin/marketplaces`);
      const data = await response.json();
      setMarketplaces(data);
    } catch (error) {
      console.error("Error fetching marketplaces:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (marketplace: string, enabled: boolean) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      await fetch(`${apiBase}/api/admin/marketplaces/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketplace, enabled }),
      });

      setMarketplaces((prev) =>
        prev.map((m) =>
          m.marketplace === marketplace ? { ...m, enabled } : m
        )
      );
    } catch (error) {
      console.error("Error toggling marketplace:", error);
    }
  };

  const getHealthColor = (health: string) => {
    if (health === "healthy") return "text-green-500";
    if (health === "degraded") return "text-yellow-500";
    return "text-red-500";
  };

  const getHealthIcon = (health: string) => {
    if (health === "healthy") return "✓";
    if (health === "degraded") return "⚠";
    return "✗";
  };

  if (loading) {
    return (
      <div>
        <AdminHeader
          title="Marketplace Management"
          subtitle="Control crawler modules and API health"
        />
        <div className="text-center text-[#666] py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title="Marketplace Management"
        subtitle="Control crawler modules and API health"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {marketplaces.map((marketplace) => (
          <div
            key={marketplace.id}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#ededed] capitalize">
                  {marketplace.marketplace}
                </h3>
                <div
                  className={`text-sm ${getHealthColor(
                    marketplace.api_health
                  )} mt-1`}
                >
                  {getHealthIcon(marketplace.api_health)} {marketplace.api_health}
                </div>
              </div>
              <button
                onClick={() =>
                  handleToggle(marketplace.marketplace, !marketplace.enabled)
                }
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  marketplace.enabled
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#a0a0a0]"
                }`}
              >
                {marketplace.enabled ? "ON" : "OFF"}
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#a0a0a0]">Last Sync:</span>
                <span className="text-[#ededed]">
                  {marketplace.last_sync
                    ? new Date(marketplace.last_sync).toLocaleString()
                    : "Never"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#a0a0a0]">Updated:</span>
                <span className="text-[#ededed]">
                  {new Date(marketplace.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
