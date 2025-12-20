"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Layers } from "lucide-react";
import Header from "../../marketing-swoopa/components/Header";
import Footer from "../../marketing-swoopa/components/Footer";
import LiveDealsGrid from "../../marketing-swoopa/components/LiveDealsGrid";
import { DealsFilterModal, type DealsFilterState } from "../../marketing-swoopa/components/deals/DealsFilterModal";
import { useAuth } from "@/providers/AuthProvider";
import { useRegion } from "@/providers/RegionProvider";

type SavedSearchOption = { id: string; name: string; marketplace: string };

export default function LiveRollupPage() {
  const { user, loading: authLoading } = useAuth();
  const { region } = useRegion();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<DealsFilterState>({
    searchIds: [],
    minPrice: null,
    maxPrice: null,
    radius: null,
    hideDealers: false,
    hideSpam: false,
    marketplaces: ["facebook", "cars"],
  });
  const [searches, setSearches] = useState<SavedSearchOption[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setSearches([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/searches?region=${encodeURIComponent(region)}`, { cache: "no-store" });
        if (!res.ok) return;
        const payload = await res.json();
        const rows = Array.isArray(payload?.searches) ? payload.searches : [];
        const mapped = rows
          .map((s: any) => ({
            id: s.id,
            name: s.name || "Saved search",
            marketplace: typeof s.marketplace === "string" ? s.marketplace : "facebook",
          }))
          .filter((s: any) => typeof s.id === "string");
        if (!cancelled) setSearches(mapped);
      } catch {
        if (!cancelled) setSearches([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id, region]);

  const marketplaces = Array.isArray(filters.marketplaces) && filters.marketplaces.length > 0
    ? filters.marketplaces
    : ["facebook", "cars"];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <main>
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
                  <Layers className="w-8 h-8 text-[#00E5FF]" />
                </div>
                <div>
                  <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-2 tracking-tight">
                    Live Deal Rollup
                  </h1>
                  <p className="text-white/80 text-lg font-medium">
                    A unified feed across marketplaces — powered by pooled market state.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-white/60 text-sm font-medium">
                  Showing: {marketplaces.join(", ")}
                </div>
                <button
                  type="button"
                  className="md:hidden inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-extrabold bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-white/20"
                  onClick={() => setFiltersOpen(true)}
                >
                  Filters
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 bg-[#0A0A0A]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <DealsFilterModal
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                marketplaceSlug="all"
                searches={searches}
                value={filters}
                onChange={setFilters}
              />

              <LiveDealsGrid
                marketplaces={marketplaces}
                limit={24}
                searchIds={filters.searchIds}
                minPrice={filters.minPrice}
                maxPrice={filters.maxPrice}
                hideDealers={filters.hideDealers}
                hideSpam={filters.hideSpam}
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
