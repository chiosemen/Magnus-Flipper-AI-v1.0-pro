"use client";

import { SubscriptionTier } from "@/types/subscription";
import { useState } from "react";

export default function DevTierPage() {
  const [currentTier, setCurrentTier] = useState<string>("FREE");

  const setTier = (tier: SubscriptionTier) => {
    document.cookie = `x-tier=${tier}; path=/; max-age=86400`;
    setCurrentTier(tier);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Developer Tier Switcher</h1>
          <p className="text-[#a0a0a0]">
            Switch between subscription tiers for testing
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6">
          <div className="text-sm text-[#a0a0a0] mb-2">Current Tier</div>
          <div className="text-3xl font-bold">{currentTier}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setTier("free")}
            className="bg-[#1a1a1a] border border-gray-500/30 hover:border-gray-500 p-6 rounded-lg text-left transition-colors"
          >
            <div className="text-2xl font-bold mb-2">FREE</div>
            <div className="text-sm text-[#a0a0a0]">
              Basic access, limited searches
            </div>
          </button>

          <button
            onClick={() => setTier("pro")}
            className="bg-[#1a1a1a] border border-blue-500/30 hover:border-blue-500 p-6 rounded-lg text-left transition-colors"
          >
            <div className="text-2xl font-bold mb-2">PRO</div>
            <div className="text-sm text-[#a0a0a0]">
              Unlimited searches, live feed, analytics
            </div>
          </button>

          <button
            onClick={() => setTier("elite")}
            className="bg-[#1a1a1a] border border-purple-500/30 hover:border-purple-500 p-6 rounded-lg text-left transition-colors"
          >
            <div className="text-2xl font-bold mb-2">AGENCY</div>
            <div className="text-sm text-[#a0a0a0]">
              Team collaboration, multi-user access
            </div>
          </button>

          <button
            onClick={() => setTier("ADMIN")}
            className="bg-[#1a1a1a] border border-red-500/30 hover:border-red-500 p-6 rounded-lg text-left transition-colors"
          >
            <div className="text-2xl font-bold mb-2">ADMIN</div>
            <div className="text-sm text-[#a0a0a0]">
              Full platform access, system controls
            </div>
          </button>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="text-sm text-yellow-500">
            <strong>Note:</strong> This is a development-only page. Remove
            before production deployment.
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Test Links</h2>
          <div className="space-y-2">
            <a
              href="/free"
              className="block bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] p-3 rounded-lg transition-colors"
            >
              /free - Free Dashboard
            </a>
            <a
              href="/pro"
              className="block bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] p-3 rounded-lg transition-colors"
            >
              /pro - Pro Dashboard
            </a>
            <a
              href="/agency"
              className="block bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] p-3 rounded-lg transition-colors"
            >
              /agency - Agency Dashboard
            </a>
            <a
              href="/admin"
              className="block bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] p-3 rounded-lg transition-colors"
            >
              /admin - Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
