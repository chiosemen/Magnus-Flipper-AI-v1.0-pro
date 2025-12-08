"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ExternalLink, TrendingUp, MapPin } from "lucide-react";
import type { LiveDeal } from "../lib/api";
import { fetchLiveDeals } from "../lib/api";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";

type LiveDealsGridProps = {
  marketplaceSlug?: string;
  limit?: number;
};

export default function LiveDealsGrid({
  marketplaceSlug,
  limit = 12,
}: LiveDealsGridProps) {
  const [deals, setDeals] = useState<LiveDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDeals() {
      setLoading(true);
      setError(null);

      try {
        const fetchedDeals = await fetchLiveDeals(marketplaceSlug);
        if (mounted) {
          setDeals(fetchedDeals.slice(0, limit));
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load deals");
          setDeals([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDeals();

    return () => {
      mounted = false;
    };
  }, [marketplaceSlug, limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card
            key={i}
            className="border border-white/10 bg-gradient-to-br from-[#121212] via-[#0A0A0A] to-[#121212] animate-pulse"
          >
            <CardContent className="p-4">
              <div className="h-4 bg-white/10 rounded mb-3 w-3/4" />
              <div className="h-3 bg-white/10 rounded mb-2 w-1/2" />
              <div className="h-3 bg-white/10 rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-white/70 font-medium mb-2">
          Unable to load live deals at this time.
        </p>
        <p className="text-white/50 text-sm">{error}</p>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/70 font-medium mb-2">
          No live deals found
          {marketplaceSlug ? ` for this marketplace` : " at this time"}.
        </p>
        <p className="text-white/50 text-sm">
          Check back soon for new opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {deals.map((deal, index) => (
        <motion.div
          key={deal.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          <Card className="group relative flex h-full flex-col border border-white/10 bg-gradient-to-br from-[#121212] via-[#0A0A0A] to-[#121212] shadow-[0_0_25px_rgba(0,0,0,0.9)] transition hover:-translate-y-1 hover:border-[#00E5FF]/80 hover:shadow-[0_0_40px_rgba(0,229,255,0.8)]">
            <CardContent className="flex flex-1 flex-col justify-between gap-3 p-4">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-extrabold text-white tracking-tight line-clamp-2 flex-1">
                    {deal.title}
                  </h3>
                  {deal.profitEstimate && deal.profitEstimate > 0 && (
                    <span className="flex-shrink-0 inline-flex items-center gap-1 bg-[#00E5FF]/20 text-[#00E5FF] text-[10px] font-extrabold px-2 py-1 rounded">
                      <TrendingUp className="w-3 h-3" />
                      +${deal.profitEstimate.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-white/70 font-medium mb-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF]" />
                    {deal.marketplace}
                  </span>
                  {deal.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {deal.location}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-base font-extrabold text-white">
                    {deal.currency || "$"}
                    {deal.currentPrice.toLocaleString()}
                  </span>
                  {deal.previousPrice && deal.previousPrice > deal.currentPrice && (
                    <span className="text-xs text-white/50 line-through">
                      {deal.currency || "$"}
                      {deal.previousPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <Button
                asChild
                size="sm"
                className="w-full bg-[#121212] text-white hover:bg-[#121212]/80 border border-white/10 hover:border-[#00E5FF]/50 transition-all text-xs font-extrabold"
              >
                <a
                  href={deal.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center justify-center gap-2"
                >
                  View listing
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
