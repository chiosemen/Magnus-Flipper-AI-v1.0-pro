"use client";

import { useEffect, useState } from "react";
import type { LiveDeal } from "../../lib/api";
import { fetchLiveDeals } from "../../lib/api";
import type { DealRow } from "../../../lib/supabase/types";
import type { DealCardModel } from "./dealUtils";
import { useRegion } from "@/providers/RegionProvider";
import {
  extractCarFields,
  isDealerDeal,
  isLikelySpamDeal,
  normalizeImages,
  parseNumber,
  parsePrice,
  safeText,
  safeUrl,
} from "./dealUtils";

function mapDealRowToCard(row: DealRow): DealCardModel | null {
  const rowAttributes = (row as any).attributes;
  const data = row.data || row.raw || {};
  const mergedData =
    rowAttributes && typeof rowAttributes === "object"
      ? { ...(rowAttributes as any), ...(data as any) }
      : data;
  const url = safeUrl(row.url) ?? safeUrl(data?.url) ?? safeUrl(data?.link);
  if (!url) return null;

  const imagesFromRow = normalizeImages((row as any).images);
  const imagesFromData = normalizeImages(data?.images);
  const imagesFromImageUrls = normalizeImages(data?.imageUrls);
  const images =
    imagesFromRow.length > 0
      ? imagesFromRow
      : imagesFromData.length > 0
      ? imagesFromData
      : imagesFromImageUrls;

  const primary_image =
    safeUrl((row as any).primary_image) ??
    safeUrl(data?.primary_image) ??
    safeUrl(data?.imageUrl) ??
    images[0]?.url ??
    null;

  const score =
    parseNumber((row as any).score) ??
    parseNumber(data?.score) ??
    parseNumber(data?.scoring?.dealScore) ??
    parseNumber(data?.scoring?.breakdown?.DealScore) ??
    parseNumber((mergedData as any)?.score) ??
    null;

  const title = row.title || mergedData?.title || mergedData?.name || "Untitled";
  const car = extractCarFields({ title, data: mergedData });
  const sellerType =
    safeText((row as any).seller_type) ??
    safeText((data as any)?.seller_type) ??
    safeText((mergedData as any)?.sellerType) ??
    safeText((mergedData as any)?.seller_type) ??
    null;

  const descriptionText =
    safeText((mergedData as any)?.description) ??
    safeText((mergedData as any)?.desc) ??
    safeText((mergedData as any)?.text) ??
    null;

  return {
    id: row.id,
    title,
    marketplace: (row.marketplace || data?.marketplace || "facebook") as string,
    url,
    price:
      parsePrice(row.price) ??
      parsePrice(data?.price?.amount) ??
      parsePrice(data?.priceValue) ??
      parsePrice(data?.price) ??
      null,
    currency: ((row as any).currency || data?.currency || "$") as string,
    score,
    location: (row.location || data?.location || data?.city || undefined) as
      | string
      | undefined,
    createdAt:
      row.created_at ?? (typeof data?.timestamp === "string" ? data.timestamp : null),
    images: images.length > 0 ? images : null,
    primary_image,
    thumbnail: safeUrl((row as any).thumbnail) ?? safeUrl(data?.thumbnail),
    sellerType,
    descriptionText,
    year: car.year,
    make: car.make,
    model: car.model,
    mileage: car.mileage,
  };
}

function mapLiveDealToCard(deal: LiveDeal): DealCardModel {
  const primary_image = safeUrl(deal.imageUrl);

  // Best-effort vehicle parsing from title for marketplace="cars" (degrades gracefully).
  const title = safeText(deal.title) ?? "Untitled";
  const car = extractCarFields({ title, data: null });

  return {
    id: deal.id,
    title,
    marketplace: deal.marketplace,
    url: deal.url,
    price:
      typeof deal.currentPrice === "number" && Number.isFinite(deal.currentPrice)
        ? deal.currentPrice
        : null,
    currency: deal.currency || "$",
    location: deal.location || undefined,
    createdAt: deal.listedAt || null,
    images: primary_image ? [{ url: primary_image }] : null,
    primary_image,
    thumbnail: null,
    score: null,
    sellerType: null,
    descriptionText: null,
    year: car.year,
    make: car.make,
    model: car.model,
    mileage: null,
  };
}

export function useDealCards({
  marketplaceSlug,
  marketplaces,
  limit,
  searchId,
  searchIds,
  minPrice,
  maxPrice,
  hideDealers,
  hideSpam,
}: {
  marketplaceSlug?: string;
  marketplaces?: string[] | null;
  limit: number;
  searchId?: string | null;
  searchIds?: string[] | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  hideDealers?: boolean;
  hideSpam?: boolean;
}): {
  deals: DealCardModel[];
  loading: boolean;
  error: string | null;
} {
  const { region } = useRegion();
  const [deals, setDeals] = useState<DealCardModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        let cards: DealCardModel[] = [];

        const normalizedMarketplace = marketplaceSlug?.toLowerCase();
        const markets = Array.isArray(marketplaces)
          ? marketplaces.map((m) => safeText(m)?.toLowerCase()).filter(Boolean)
          : [];
        const isPooled =
          markets.length > 0 ||
          normalizedMarketplace === "facebook" ||
          normalizedMarketplace === "cars";

        if (isPooled) {
          const params = new URLSearchParams();
          params.set("region", region);
          if (markets.length > 0) {
            params.set("marketplaces", Array.from(new Set(markets)).join(","));
          } else {
            params.set("marketplace", normalizedMarketplace || "facebook");
          }
          params.set("limit", String(limit));
          if (Array.isArray(searchIds) && searchIds.length > 0) {
            params.set("searchIds", searchIds.join(","));
          } else if (searchId) {
            params.set("searchId", searchId);
          }
          if (typeof minPrice === "number" && Number.isFinite(minPrice)) {
            params.set("minPrice", String(minPrice));
          }
          if (typeof maxPrice === "number" && Number.isFinite(maxPrice)) {
            params.set("maxPrice", String(maxPrice));
          }

          const res = await fetch(`/api/deals?${params.toString()}`, {
            cache: "no-store",
          });
          if (!res.ok) {
            const payload = await res.json().catch(() => ({}));
            throw new Error((payload as any)?.error || "Failed to load live deals");
          }
          const payload = await res.json();
          const rows = Array.isArray(payload?.deals) ? (payload.deals as DealRow[]) : [];
          cards = rows.map(mapDealRowToCard).filter(Boolean) as DealCardModel[];
        } else {
          const liveDeals = await fetchLiveDeals(marketplaceSlug);
          cards = liveDeals.map(mapLiveDealToCard);
        }

        if (hideDealers) {
          cards = cards.filter((deal) => !isDealerDeal(deal));
        }
        if (hideSpam) {
          cards = cards.filter((deal) => !isLikelySpamDeal(deal));
        }

        if (!cancelled) {
          setDeals(cards.slice(0, Math.max(1, Math.floor(limit))));
        }
      } catch (err: any) {
        if (!cancelled) {
          setDeals([]);
          setError(err?.message || "Unable to load live deals at this time.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    region,
    marketplaceSlug,
    JSON.stringify(marketplaces ?? []),
    limit,
    searchId,
    JSON.stringify(searchIds ?? []),
    minPrice,
    maxPrice,
    Boolean(hideDealers),
    Boolean(hideSpam),
  ]);

  return { deals, loading, error };
}
