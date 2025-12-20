"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "../lib/supabase/client";
import { saveDeal } from "../lib/supabase/saveDeal";
import { useApifyDataset } from "../src/hooks/useApifyDataset";
import type { DealRow } from "../lib/supabase/types";
import { useAuth } from "@/providers/AuthProvider";

export interface Deal {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  images?: Array<{ url: string; width?: number | null; height?: number | null }> | null;
  primary_image?: string | null;
  thumbnail?: string | null;
  location?: string;
  url: string;
  marketplace: string;
  createdAt?: string;
}

function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeImages(value: unknown): Array<{ url: string; width?: number | null; height?: number | null }> {
  if (!Array.isArray(value)) return [];
  const images: Array<{ url: string; width?: number | null; height?: number | null }> = [];
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

function getDealImageSrc(deal: Pick<Deal, "primary_image" | "images">): string {
  return deal.primary_image || deal.images?.[0]?.url || "/placeholder.png";
}

function mapApifyItemToDeal(item: any, marketplaceFallback?: string): Deal | null {
  const url = item?.url || item?.itemUrl;
  if (!url) return null;

  const rawPrice =
    typeof item?.price === "number"
      ? item.price
      : typeof item?.price?.amount === "number"
      ? item.price.amount
      : typeof item?.priceValue === "number"
      ? item.priceValue
      : typeof item?.priceText === "string"
      ? Number(item.priceText.replace(/[^0-9.]/g, ""))
      : null;

  const images = Array.isArray(item?.images)
    ? item.images
    : Array.isArray(item?.imageUrls)
    ? item.imageUrls
    : undefined;

  const normalizedImages = normalizeImages(images);
  const primary_image = safeUrl(item?.primary_image) ?? safeUrl(item?.imageUrl) ?? normalizedImages[0]?.url ?? null;

  return {
    id: String(item?.id || url),
    title: item?.title || item?.name || "Untitled",
    price: Number.isFinite(rawPrice) ? Number(rawPrice) : null,
    currency: item?.currency || item?.price?.currency || "$",
    images: normalizedImages.length > 0 ? normalizedImages : null,
    primary_image,
    location: item?.location || item?.locationText || item?.city,
    url,
    marketplace: item?.marketplace || marketplaceFallback || "unknown",
    createdAt: item?.createdAt || item?.scrapedAt || item?.timestamp,
  };
}

type Props = {
  datasetIds?: string[];
  searchId?: string;
};

function mapSupabaseDeal(row: DealRow): Deal {
  const raw = row.raw || {};
  const data = row.data || raw || {};
  const fromColumn = normalizeImages((row as any).images);
  const fromData = normalizeImages(data?.images);
  const fromImageUrls = normalizeImages(data?.imageUrls);
  const images = fromColumn.length > 0 ? fromColumn : fromData.length > 0 ? fromData : fromImageUrls;
  const primary_image =
    safeUrl((row as any).primary_image) ??
    safeUrl(data?.primary_image) ??
    safeUrl(data?.imageUrl) ??
    images[0]?.url ??
    null;

  const price =
    typeof row.price === "number"
      ? row.price
      : typeof row.price === "string" && Number.isFinite(Number(row.price))
      ? Number(row.price)
      : typeof raw?.price === "number"
      ? raw.price
      : typeof raw?.price === "string" && Number.isFinite(Number(raw.price))
      ? Number(raw.price)
      : null;

  return {
    id: row.id,
    title: row.title || raw?.title || "Untitled",
    price: price,
    currency: row.currency || raw?.currency || "$",
    images: images.length > 0 ? images : null,
    primary_image,
    thumbnail: safeUrl((row as any).thumbnail) ?? safeUrl(data?.thumbnail),
    location: row.location || raw?.location,
    url: row.url || raw?.link,
    marketplace: row.marketplace || raw?.marketplace || "unknown",
    createdAt: row.created_at || raw?.timestamp,
  };
}

export function LiveResults({ datasetIds = [], searchId }: Props) {
  const { user, openAuthModal } = useAuth();
  const [supabaseDeals, setSupabaseDeals] = useState<Deal[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const items = useApifyDataset(datasetIds);

  useEffect(() => {
    if (!searchId) return;

    let cancelled = false;
    let client: ReturnType<typeof supabaseBrowser> | null = null;

    try {
      client = supabaseBrowser();
    } catch (error) {
      console.warn("Supabase client unavailable for live results", error);
      setLoadError("Supabase unavailable");
      return;
    }

    const fetchDeals = async () => {
      try {
        setLoadingDeals(true);
        const { data, error } = await client!
          .from("deals")
          .select("*")
          .eq("search_id", searchId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          throw error;
        }

        if (data && !cancelled) {
          setSupabaseDeals(data.map((row) => mapSupabaseDeal(row as DealRow)));
          setLoadError(null);
        }
      } catch (error: any) {
        if (!cancelled) {
          console.warn("Failed to load deals", error);
          setLoadError("Failed to load deals");
        }
      } finally {
        if (!cancelled) {
          setLoadingDeals(false);
        }
      }
    };

    fetchDeals();

    return () => {
      cancelled = true;
    };
  }, [searchId]);

  let warned = false;
  const apifyDeals: Deal[] = items
    .map((item) => mapApifyItemToDeal(item, item?.marketplace))
    .filter((deal) => {
      if (!deal && !warned) {
        console.warn("Dropped malformed Apify item");
        warned = true;
      }
      return Boolean(deal);
    }) as Deal[];

  const deals = searchId ? supabaseDeals : apifyDeals;
  const isSupabaseMode = Boolean(searchId);

  const cards = deals.map((deal, idx) => ({
    id: deal.id || idx,
    title: deal.title,
    price: deal.price ?? "—",
    location: deal.location || "Unknown",
    image: getDealImageSrc(deal),
    marketplace: deal.marketplace,
    url: deal.url,
    deal,
  }));

  const DealCard = ({
    title,
    price,
    location,
    image,
    marketplace,
    url,
    deal,
  }: {
    title: string;
    price: string | number;
    location: string;
    image?: string;
    marketplace: string;
    url?: string;
    deal: Deal;
  }) => (
    <div className="border border-slate-800 rounded-md p-3 bg-slate-900 text-slate-100 shadow-sm space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span className="uppercase tracking-wide">{marketplace}</span>
        <span className="font-semibold text-emerald-400">{price}</span>
      </div>
      <div className="mb-3">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-800">
          <img
            src={image || "/placeholder.png"}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
            }}
          />
        </div>
      </div>
      <div className="text-sm font-semibold line-clamp-2">{title}</div>
      <div className="text-xs text-slate-400 mt-1">{location}</div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-sky-400 underline text-xs mt-2 inline-block"
        >
          View listing
        </a>
      )}
      <div className="flex gap-2 text-xs">
        <button
          type="button"
          className="text-slate-300 underline"
          onClick={async () => {
            const res = await saveDeal(deal);
            if (!res.success) {
              console.warn("Save failed");
            }
          }}
        >
          Save
        </button>
        <button
          type="button"
          className="text-slate-300 underline"
          onClick={() => {
            if (!user) {
              openAuthModal("login");
              return;
            }
            console.log("Watch clicked", deal.id);
          }}
        >
          Watch
        </button>
        <button
          type="button"
          className="text-slate-300 underline"
          onClick={() => {
            if (!user) {
              openAuthModal("login");
              return;
            }
            console.log("Notify clicked", deal.id);
          }}
        >
          Notify
        </button>
      </div>
      {/* TODO: Wire scoring + save later */}
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card) => (
          <DealCard key={card.id} {...card} />
        ))}
      </div>
      {loadingDeals && (
        <div className="text-slate-500 text-sm">Loading deals…</div>
      )}
      {loadError && (
        <div className="text-slate-500 text-sm">{loadError}</div>
      )}
      {!loadingDeals && !loadError && deals.length === 0 && (
        <div className="text-slate-500 text-sm">
          {isSupabaseMode ? "No deals yet" : "Waiting for results…"}
        </div>
      )}
    </div>
  );
}
