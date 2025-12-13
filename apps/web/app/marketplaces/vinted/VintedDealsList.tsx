"use client";

import { useEffect, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { Card, CardContent } from "../../../marketing-swoopa/components/ui/card";
import { Button } from "../../../marketing-swoopa/components/ui/button";

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

export default function VintedDealsList() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDeals() {
      try {
        const response = await fetch("/api/deals?marketplace=vinted&limit=50");
        
        if (!response.ok) {
          throw new Error("Failed to fetch deals");
        }

        const data = await response.json();
        setDeals(data.deals || []);
      } catch (err: any) {
        setError(err.message || "Failed to load deals");
      } finally {
        setLoading(false);
      }
    }

    fetchDeals();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDeals, 30000);
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

  if (deals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/70 font-medium mb-2">No live deals yet</p>
        <p className="text-white/50 text-sm">
          Create a search above to start finding deals. The worker will scan Vinted every 10 minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {deals.map((deal) => (
        <Card
          key={deal.id}
          className="group relative flex h-full flex-col border border-white/10 bg-gradient-to-br from-[#121212] via-[#0A0A0A] to-[#121212] shadow-[0_0_25px_rgba(0,0,0,0.9)] transition hover:-translate-y-1 hover:border-[#00E5FF]/80 hover:shadow-[0_0_40px_rgba(0,229,255,0.8)]"
        >
          <CardContent className="flex flex-1 flex-col justify-between gap-3 p-4">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-extrabold text-white tracking-tight line-clamp-2 flex-1">
                  {deal.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-white/70 font-medium mb-2">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF]" />
                  Vinted
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
      ))}
    </div>
  );
}
