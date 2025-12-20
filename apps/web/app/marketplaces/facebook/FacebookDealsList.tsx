"use client";

import { useEffect, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { Card, CardContent } from "../../../marketing-swoopa/components/ui/card";
import { Button } from "../../../marketing-swoopa/components/ui/button";
import type { DealRow } from "../../../lib/supabase/types";
import { useHydratedNow } from "@/lib/hydratedTime";
import { useRegion } from "@/providers/RegionProvider";

type DealImage = {
  url: string;
  width?: number | null;
  height?: number | null;
};

interface Deal {
  id: string;
  title: string;
  marketplace: string;
  price: number | null;
  currency: string;
  location?: string;
  buyUrl?: string;
  images?: DealImage[] | null;
  primaryImage?: string | null;
  thumbnail?: string | null;
  createdAt: string | null;
}

function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeImages(value: unknown): DealImage[] {
  if (!Array.isArray(value)) return [];
  const images: DealImage[] = [];
  for (const entry of value) {
    if (typeof entry === "string") {
      const url = safeUrl(entry);
      if (url) images.push({ url });
      continue;
    }
    if (entry && typeof entry === "object") {
      const url = safeUrl((entry as any).url);
      if (!url) continue;
      const width =
        typeof (entry as any).width === "number" && Number.isFinite((entry as any).width)
          ? (entry as any).width
          : null;
      const height =
        typeof (entry as any).height === "number" && Number.isFinite((entry as any).height)
          ? (entry as any).height
          : null;
      images.push({ url, width, height });
    }
  }
  return images;
}

function getDealImages(row: DealRow, data: any): DealImage[] {
  const fromColumn = normalizeImages((row as any).images);
  if (fromColumn.length > 0) return fromColumn;

  const fromData = normalizeImages(data?.images);
  if (fromData.length > 0) return fromData;

  const fromImageUrls = normalizeImages(data?.imageUrls);
  if (fromImageUrls.length > 0) return fromImageUrls;

  return [];
}

function getDealImageSrc(deal: Pick<Deal, "primaryImage" | "images">): string {
  return deal.primaryImage || deal.images?.[0]?.url || "/placeholder.png";
}

export default function FacebookDealsList() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = useHydratedNow();
  const { region } = useRegion();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Pooled-only: UI reads from /api/deals (deals.search_id IS NULL), never from per-search scrape APIs.
        const params = new URLSearchParams();
        params.set("region", region);
        params.set("marketplace", "facebook");
        params.set("limit", "20");
        const res = await fetch(`/api/deals?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          const message =
            (payload as any)?.error || "Failed to load live deals";
          throw new Error(message);
        }

        const payload = await res.json();
        const rows = Array.isArray(payload?.deals)
          ? (payload.deals as DealRow[])
          : [];

        const mapped: Deal[] = rows.map((row) => {
          const data = row.data || row.raw || {};
          const title = row.title || data?.title || data?.name || "Untitled";

          const priceValue = row.price as unknown;
          const price =
            typeof priceValue === "number"
              ? priceValue
              : typeof priceValue === "string" &&
                priceValue.trim() !== "" &&
                Number.isFinite(Number(priceValue))
              ? Number(priceValue)
              : null;

          const location = row.location || data?.location || data?.city;
          const buyUrl = row.url || data?.url || data?.link;
          const images = getDealImages(row, data);
          const primaryImage = safeUrl((row as any).primary_image) ?? safeUrl(data?.primary_image);
          const thumbnail = safeUrl((row as any).thumbnail) ?? safeUrl(data?.thumbnail);

          return {
            id: row.id,
            title,
            marketplace: row.marketplace || data?.marketplace || "facebook",
            price,
            currency: row.currency || data?.currency || "$",
            location: location || undefined,
            buyUrl: buyUrl || undefined,
            images: images.length > 0 ? images : null,
            primaryImage,
            thumbnail,
            createdAt: (row as any).posted_at || (row as any).fetched_at || row.created_at || null,
          };
        });

        setDeals(mapped);
      } catch (err: any) {
        console.warn("Failed to load pooled deals", err);
        setDeals([]);
        setError(err?.message || "Failed to load live deals");
      } finally {
        setLoading(false);
      }
    })();
  }, [region]);

  const postedAgo = (createdAt: string | null) => {
    if (!createdAt) return null;
    const ts = new Date(createdAt).getTime();
    if (!Number.isFinite(ts)) return null;

    if (typeof now !== "number" || !Number.isFinite(now)) return "posted just now";
    const diffMs = Math.max(0, now - ts);
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "posted just now";
    if (mins < 60) return `posted ${mins} minute${mins === 1 ? "" : "s"} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `posted ${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `posted ${days} day${days === 1 ? "" : "s"} ago`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <p className="text-white/70 font-medium">
          Monitoring Facebook Marketplace. New deals appear automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {deals.map((deal) => {
        const posted = postedAgo(deal.createdAt);
        const imageSrc = getDealImageSrc(deal);

        return (
          <Card
            key={deal.id}
            className="group relative flex h-full flex-col border border-white/10 bg-gradient-to-br from-[#121212] via-[#0A0A0A] to-[#121212] shadow-[0_0_25px_rgba(0,0,0,0.9)] transition hover:-translate-y-1 hover:border-[#00E5FF]/80 hover:shadow-[0_0_40px_rgba(0,229,255,0.8)]"
          >
            <CardContent className="flex flex-1 flex-col justify-between gap-3 p-4">
              <div>
                <div className="mb-3">
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white/5 border border-white/10">
                    <img
                      src={imageSrc}
                      alt={deal.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-extrabold text-white tracking-tight line-clamp-2 flex-1">
                    {deal.title}
                  </h3>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] text-white/70 font-medium mb-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF]" />
                    Facebook
                  </span>
                  <span className="inline-flex items-center gap-2">
                    {deal.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {deal.location}
                      </span>
                    )}
                    {posted && (
                      <span className="text-white/50 whitespace-nowrap">
                        {posted}
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-base font-extrabold text-white">
                    {deal.price !== null
                      ? `${deal.currency}${deal.price.toLocaleString()}`
                      : "—"}
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
        );
      })}
    </div>
  );
}
