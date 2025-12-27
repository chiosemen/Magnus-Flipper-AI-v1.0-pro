"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Zap } from "lucide-react";
import Header from "../../../marketing-swoopa/components/Header";
import Footer from "../../../marketing-swoopa/components/Footer";
import MarketplaceStatus from "../[slug]/MarketplaceStatus";
import MarketplaceSearchBox from "../../../components/marketplace/MarketplaceSearchBox";
import FacebookDealsList from "./FacebookDealsList";
import SavedSearchesList from "../../../components/SavedSearchesList";
import LiveDealsGrid from "../../../marketing-swoopa/components/LiveDealsGrid";
import { LiveResults } from "../../../components/LiveResults";
import { supabaseBrowser } from "../../../lib/supabase/client";

type SavedSearch = {
  id: string;
  name: string;
  marketplace: "facebook";
  datasetIds: string[];
  createdAt: number;
};

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Live signal";
  if (mins < 60) return "≈ 60 seconds";
  return "Live feed active";
}

export default function FacebookMarketplacePage() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from("saved_searches")
          .select("*")
          .contains("marketplaces", ["facebook"])
          .order("created_at", { ascending: false })
          .limit(10);
        if (error || !data) return;
        const mapped: SavedSearch[] = data.map((row: any) => ({
          id: row.id,
          name: row.name || "Saved search",
          marketplace: "facebook",
          datasetIds: Array.isArray(row.dataset_ids) ? row.dataset_ids : [],
          createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        }));
        setSavedSearches(mapped);
      } catch {
        // optional persistence; ignore failures
      }
    })();
  }, []);

  const handleSearchCreated = (search: { query: string }, jobId?: string | null) => {
    if (savedSearches.length >= 10) return;
    const newSearch: SavedSearch = {
      id: jobId || `saved_${Date.now()}`,
      name: search.query || "New search",
      marketplace: "facebook",
      datasetIds: [],
      createdAt: Date.now(),
    };
    setSavedSearches((prev) => [newSearch, ...prev].slice(0, 10));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden bg-[#0A0A0A]">
          <div className="absolute inset-0 gradient-hero" />
          <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#00E5FF]/40 to-[#7B2FFF]/40 blur-3xl opacity-30 -translate-y-1/2" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto">
              <Link
                href="/marketplaces"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to all marketplaces
              </Link>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00E5FF]/20 to-[#7B2FFF]/20 rounded-2xl flex items-center justify-center border border-[#00E5FF]/30">
                  <Zap className="w-8 h-8 text-[#00E5FF]" />
                </div>
                <div>
                  <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-2 tracking-tight">
                    Facebook Marketplace
                  </h1>
                  <p className="text-white/80 text-lg font-medium">
                    Real-time deal intelligence for Facebook Marketplace
                  </p>
                </div>
              </div>

              <MarketplaceStatus marketplace="facebook" />
            </div>
          </div>
        </section>

        {/* Create Search Section */}
        <section className="py-12 bg-[#0A0A0A]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                  Create Search
                </h2>
                <p className="text-white/70 text-sm font-medium">
                  Set up a search to automatically find matching deals
                </p>
              </div>
              <div className="bg-[#121212] border border-white/10 rounded-xl p-6">
                <MarketplaceSearchBox
                  defaultMarketplace="facebook"
                  onSearchCreated={handleSearchCreated}
                  disabled={savedSearches.length >= 10}
                />
                {savedSearches.length >= 10 && (
                  <p className="text-xs text-white/60 mt-2">
                    Max 10 saved searches reached.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Saved Searches Section */}
        <section className="py-12 bg-[#0A0A0A]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                  Your Searches
                </h2>
                <p className="text-white/70 text-sm font-medium">
                  Monitor performance and see what's working
                </p>
              </div>
              <SavedSearchesList marketplace="facebook" />
              {savedSearches.length > 0 && (
                <div className="space-y-4 mt-6">
                  {savedSearches.map((search) => (
                    <div
                      key={search.id}
                      className="bg-[#121212] border border-white/10 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between text-sm text-white/70">
                        <span className="font-semibold text-white">
                          {search.name || "Saved search"}
                        </span>
                        <span className="text-xs text-white/50">
                          {timeAgo(search.createdAt)}
                        </span>
                      </div>
                      <div className="text-xs text-white/60 mt-1">
                        {search.datasetIds.length > 0 ? "Live" : "Fetching fresh listings…"}
                      </div>
                      {search.datasetIds.length > 0 ? (
                        <div className="mt-3">
                          <LiveResults datasetIds={search.datasetIds} />
                        </div>
                      ) : (
                        <div className="text-xs text-white/50 mt-3">
                          No deals yet
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* TODO: persist saved searches to Supabase */}
              {/* TODO: add delete / pause search controls */}
            </div>
          </div>
        </section>

        {/* Live Deals Section */}
        <section className="py-12 bg-[#0A0A0A]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                Live Deals
              </h2>
              <p className="text-white/70 text-sm font-medium">
                Real-time opportunities from Facebook Marketplace
              </p>
            </div>

            <FacebookDealsList />
            <LiveDealsGrid marketplaceSlug="facebook" limit={18} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
