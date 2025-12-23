"use client";

import { SubscriptionTier, TIER_METADATA } from "@/types/subscription";
import { useState } from "react";

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<"PRO" | "AGENCY" | null>(null);

  const handleUpgrade = async (tier: "PRO" | "AGENCY") => {
    setLoading(true);
    setSelectedTier(tier);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(`${apiBase}/api/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned");
        setLoading(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(`${apiBase}/api/stripe/portal`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No portal URL returned");
        setLoading(false);
      }
    } catch (error) {
      console.error("Portal error:", error);
      setLoading(false);
    }
  };

  const proTier = TIER_METADATA["pro"];
  const agencyTier = TIER_METADATA["elite"];

  // helper: allow price from metadata without breaking TypeScript
  const proPrice =
    (proTier as any).price ??
    process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE ??
    "39";

  const agencyPrice =
    (agencyTier as any).price ??
    process.env.NEXT_PUBLIC_STRIPE_AGENCY_PRICE ??
    "89";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-[#a0a0a0] text-lg">
            Unlock premium features and scale your arbitrage business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* PRO Plan */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-lg p-8">
            <div className="mb-6">
              <div className="text-sm text-blue-400 mb-2">PRO</div>
              <div className="text-5xl font-bold mb-1">
                £{proPrice}
                <span className="text-lg text-[#a0a0a0] font-normal">/month</span>
              </div>
              <div className="text-sm text-[#a0a0a0]">
                Perfect for individual flippers
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {proTier.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-[#ededed]">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleUpgrade("PRO")}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              {loading && selectedTier === "PRO" ? "Loading..." : "Upgrade to Pro"}
            </button>
          </div>

          {/* AGENCY Plan */}
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-lg p-8 relative">
            <div className="absolute top-4 right-4">
              <span className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                POPULAR
              </span>
            </div>

            <div className="mb-6">
              <div className="text-sm text-purple-400 mb-2">AGENCY</div>
              <div className="text-5xl font-bold mb-1">
                £{agencyPrice}
                <span className="text-lg text-[#a0a0a0] font-normal">/month</span>
              </div>
              <div className="text-sm text-[#a0a0a0]">
                For teams and agencies
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {agencyTier.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-[#ededed]">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleUpgrade("AGENCY")}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              {loading && selectedTier === "AGENCY"
                ? "Loading..."
                : "Upgrade to Agency"}
            </button>
          </div>
        </div>

        {/* Manage Subscription */}
        <div className="text-center mb-8">
          <button
            onClick={handleManageSubscription}
            disabled={loading}
            className="text-[#a0a0a0] hover:text-[#ededed] transition-colors underline"
          >
            Already subscribed? Manage your subscription
          </button>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <a
            href="/free"
            className="text-[#a0a0a0] hover:text-[#ededed] transition-colors"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
