export type DealImage = {
  url: string;
  width?: number | null;
  height?: number | null;
};

export type DealHeat = "HOT" | "WARM" | "NORMAL";

import { getAlertThresholds } from "@magnus-flipper-ai/alerts";

export type DealCardModel = {
  id: string;
  title: string;
  marketplace: string;
  url: string;
  price: number | null;
  currency: string;
  location?: string;
  createdAt?: string | null;
  score?: number | null;
  images?: DealImage[] | null;
  primary_image?: string | null;
  thumbnail?: string | null;
  sellerType?: string | null;
  descriptionText?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  mileage?: number | null;
};

export function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function safeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeImages(value: unknown): DealImage[] {
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

export function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function parsePrice(value: unknown): number | null {
  return parseNumber(value);
}

export function postedAgo(createdAt?: string | null, nowMs?: number | null): string | null {
  if (!createdAt) return null;
  const ts = Date.parse(createdAt);
  if (!Number.isFinite(ts)) return null;

  // Hydration-safe: callers should pass `nowMs` from a hydrated-only hook.
  // If `nowMs` is unavailable (SSR/hydration), render a stable placeholder.
  if (typeof nowMs !== "number" || !Number.isFinite(nowMs)) return "posted just now";

  const diffMs = Math.max(0, nowMs - ts);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "posted just now";
  if (mins < 60) return `posted ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `posted ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `posted ${days}d ago`;
}

export function minutesSince(createdAt?: string | null, nowMs?: number | null): number | null {
  if (!createdAt) return null;
  const ts = Date.parse(createdAt);
  if (!Number.isFinite(ts)) return null;
  if (typeof nowMs !== "number" || !Number.isFinite(nowMs)) return null;
  const diffMs = Math.max(0, nowMs - ts);
  return diffMs / 60000;
}

export function getDealImageSrc(deal: Pick<DealCardModel, "primary_image" | "images">): string {
  const primary = safeUrl(deal.primary_image);
  if (primary) return primary;

  const first = safeUrl(deal.images?.[0]?.url);
  if (first) return first;

  return "/placeholder.png";
}

export function getDealHeat(
  deal: Pick<DealCardModel, "score" | "createdAt" | "mileage" | "marketplace">,
  region: unknown,
  nowMs?: number | null
): DealHeat {
  const score = typeof deal.score === "number" && Number.isFinite(deal.score) ? deal.score : null;
  const mins = minutesSince(deal.createdAt, nowMs);
  if (score === null || mins === null) return "NORMAL";

  const category =
    safeText(deal.marketplace)?.toLowerCase() === "cars" ||
    (typeof deal.mileage === "number" && Number.isFinite(deal.mileage))
      ? "car"
      : "general";
  const thresholds = getAlertThresholds(region, "FREE_BASIC", category).heat;

  // Alignment note:
  // Car alert eligibility applies a mileage modifier to score. We mirror the same modifier here so that
  // any deal eligible for a car alert will still surface a visible heat indicator in the UI for that tier.
  const mileage = typeof deal.mileage === "number" && Number.isFinite(deal.mileage) ? deal.mileage : null;
  const adjustedScore =
    mileage === null ? score : mileage < 100_000 ? score + 5 : mileage > 180_000 ? score - 5 : score;

  if (adjustedScore >= thresholds.hot.minScore && mins < thresholds.hot.maxAgeMinutes) return "HOT";
  if (adjustedScore >= thresholds.warm.minScore && mins < thresholds.warm.maxAgeMinutes) return "WARM";
  return "NORMAL";
}

export function getFreshnessClass(
  deal: Pick<DealCardModel, "createdAt">,
  region: unknown,
  nowMs?: number | null
): {
  timestampClass: string;
  imageClass: string;
} {
  const mins = minutesSince(deal.createdAt, nowMs);
  if (mins === null) {
    return { timestampClass: "text-white/50", imageClass: "" };
  }

  const thresholds = getAlertThresholds(region, "FREE_BASIC", "general").freshness;

  if (mins < thresholds.emphasizedMinutes) {
    return {
      timestampClass: "text-white/80 drop-shadow-[0_0_10px_rgba(0,229,255,0.35)]",
      imageClass: "",
    };
  }

  if (mins < thresholds.neutralMinutes) {
    return { timestampClass: "text-white/50", imageClass: "" };
  }

  return { timestampClass: "text-white/35", imageClass: "opacity-90" };
}

export function extractCarFields(input: {
  title?: string | null;
  data?: any;
}): {
  year: number | null;
  make: string | null;
  model: string | null;
  mileage: number | null;
} {
  const title = typeof input.title === "string" ? input.title : "";
  const data = input.data ?? {};

  const year =
    parseNumber(data?.year) ??
    parseNumber(data?.vehicle?.year) ??
    (() => {
      const match = title.match(/\b(19|20)\d{2}\b/);
      return match ? parseNumber(match[0]) : null;
    })();

  const make = safeText(data?.make) ?? safeText(data?.vehicle?.make);
  const model = safeText(data?.model) ?? safeText(data?.vehicle?.model);

  const mileage =
    parseNumber(data?.mileage) ??
    parseNumber(data?.miles) ??
    parseNumber(data?.odometer) ??
    parseNumber(data?.vehicle?.mileage);

  return { year, make, model, mileage };
}

export function isDealerDeal(deal: Pick<DealCardModel, "sellerType" | "descriptionText" | "title">): boolean {
  const sellerType = safeText(deal.sellerType)?.toLowerCase();
  if (sellerType === "dealer") return true;

  const text = `${deal.title || ""} ${deal.descriptionText || ""}`.toLowerCase();
  return text.includes("finance available") || text.includes("warranty") || text.includes("px welcome");
}

export function isLikelySpamDeal(
  deal: Pick<DealCardModel, "title" | "descriptionText" | "price">
): boolean {
  const text = `${deal.title || ""} ${deal.descriptionText || ""}`.toLowerCase();

  // Scammy contact/payment signals.
  if (text.includes("whatsapp") || text.includes("telegram") || text.includes("cashapp")) return true;
  if (text.includes("western union") || text.includes("wire transfer")) return true;

  // Phone-number bait (very rough, but user-controlled via toggle).
  if (/\b\d{10,}\b/.test(text)) return true;

  // Suspicious pricing patterns (free/£0 “deals” are frequently spam).
  if (typeof deal.price === "number" && Number.isFinite(deal.price) && deal.price <= 0) return true;

  return false;
}
