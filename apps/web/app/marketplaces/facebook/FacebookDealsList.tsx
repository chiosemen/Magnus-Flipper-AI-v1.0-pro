"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, MapPin } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Card, CardContent } from "../../../marketing-swoopa/components/ui/card";
import { Button } from "../../../marketing-swoopa/components/ui/button";
import { getMockDeals } from "@/lib/utils/mockData";
import { sanitizeImageUrl } from "@/lib/utils/imageResolver";
import { fadeRiseVariants, prefersReducedMotion } from "@/lib/motion";

interface Deal {
  id: string;
  title: string;
  marketplace: string;
  buyPrice: number;
  location?: string;
  buyUrl?: string;
  imageUrl?: string;
  createdAt: string;
}

// DEV OVERRIDE: Force show Car Flipper section even with no data
const forceShow =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_SHOW_CAR_FLIPPER === "true";

export default function FacebookDealsList() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPooledDeals() {
      const startedAt = Date.now();
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/deals?marketplace=facebook&limit=50");
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = await res.json();
        const fetchedDeals = data.deals || [];
        
        // DEV MODE: Use mock data if forceShow is enabled and no real deals
        if (fetchedDeals.length === 0 && forceShow) {
          const mockDeals = getMockDeals(6).map((mock) => ({
            id: mock.id,
            title: mock.title,
            marketplace: mock.marketplace,
            buyPrice: mock.currentPrice,
            location: mock.location,
            buyUrl: mock.url,
            imageUrl: mock.imageUrl,
            createdAt: new Date().toISOString(),
          }));
          setDeals(mockDeals);
        } else {
          setDeals(fetchedDeals);
        }
      } catch (err: any) {
        console.error("Error fetching pooled deals:", err);
        setError(err.message || "Failed to load deals");
        
        // DEV MODE: Use mock data even on error if forceShow is enabled
        if (forceShow) {
          const mockDeals = getMockDeals(6).map((mock) => ({
            id: mock.id,
            title: mock.title,
            marketplace: mock.marketplace,
            buyPrice: mock.currentPrice,
            location: mock.location,
            buyUrl: mock.url,
            imageUrl: mock.imageUrl,
            createdAt: new Date().toISOString(),
          }));
          setDeals(mockDeals);
          setError(null); // Clear error in dev mode
        }
      } finally {
        const elapsed = Date.now() - startedAt;
        const delay = Math.max(0, 3000 - elapsed);
        setTimeout(() => {
          setLoading(false);
        }, delay);
      }
    }

    fetchPooledDeals();

    // Refresh every 30 seconds for fresh pooled deals
    const interval = setInterval(fetchPooledDeals, 30000);
    return () => clearInterval(interval);
  }, []);

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
        <p className="text-white/70 font-medium mb-2">Unable to load deals</p>
        <p className="text-white/50 text-sm">{error}</p>
      </div>
    );
  }

  // DEV OVERRIDE: Don't hide section when forceShow is enabled
  if (deals.length === 0 && !forceShow) {
    return (
      <div className="text-center py-12">
        <p className="text-white/70 font-medium mb-2">No live deals yet</p>
        <p className="text-white/50 text-sm">
          Live deals from Facebook Marketplace will appear here as they are discovered.
        </p>
      </div>
    );
  }

  // DEV MODE: Show placeholder message when using mock data
  const usingMockData = forceShow && deals.length > 0 && deals[0]?.id?.startsWith("mock-");

  return (
    <>
      {usingMockData && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-400 font-medium">
            🔧 DEV MODE: Showing mock data. Real deals will appear when worker-scheduler dispatches jobs.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {deals.map((deal, index) => (
        <motion.div
          key={deal.id}
          initial={prefersReducedMotion() ? false : "hidden"}
          animate={prefersReducedMotion() ? false : "visible"}
          variants={fadeRiseVariants}
          transition={{ delay: index * 0.05 }}
        >
          <Card
            className="group relative flex h-full flex-col border border-white/10 bg-gradient-to-br from-[#121212] via-[#0A0A0A] to-[#121212] shadow-[0_0_25px_rgba(0,0,0,0.9)] transition hover:-translate-y-1 hover:border-[#00E5FF]/80 hover:shadow-[0_0_40px_rgba(0,229,255,0.8)]"
          >
          <CardContent className="flex flex-1 flex-col justify-between gap-3 p-4">
            {deal.imageUrl && (
              <div className="w-full h-32 mb-2 rounded overflow-hidden relative">
                <SafeImage
                  src={sanitizeImageUrl(deal.imageUrl)}
                  alt={deal.title || "Deal"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            )}

            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-extrabold text-white tracking-tight line-clamp-2 flex-1">
                  {deal.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-white/70 font-medium mb-2">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF]" />
                  Facebook
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
                  ${deal.buyPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {deal.buyUrl && (
              <Button
                asChild
                size="sm"
                className="w-full bg-[#121212] text-white hover:bg-[#121212]/80 border border-white/10 hover:border-[#00E5FF]/50 transition-all text-xs font-extrabold"
              >
                <a
                  href={deal.buyUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center justify-center gap-2"
                >
                  View listing
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
        </motion.div>
        ))}
      </div>
    </>
  );
}
