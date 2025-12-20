"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import type { DealCardModel } from "./dealUtils";
import { getDealImageSrc, postedAgo } from "./dealUtils";
import { DealCardImage } from "./DealCardImage";
import { useAuth } from "@/providers/AuthProvider";
import { useViewerTier } from "./useViewerTier";
import { useHydratedNow } from "@/lib/hydratedTime";

function formatPrice(deal: Pick<DealCardModel, "price" | "currency">): string {
  return typeof deal.price === "number"
    ? `${deal.currency}${deal.price.toLocaleString()}`
    : "—";
}

function scoreLabel(score: number | null): string {
  if (score === null) return "Unscored";
  if (score >= 85) return "Strong";
  if (score >= 70) return "Promising";
  if (score >= 55) return "Speculative";
  return "Low confidence";
}

function extractImages(deal: DealCardModel): string[] {
  const images = Array.isArray(deal.images)
    ? deal.images
        .map((img) => (typeof img?.url === "string" ? img.url.trim() : ""))
        .filter((url) => url.length > 0)
    : [];

  const primary = deal.primary_image?.trim?.() || "";
  const fallback = getDealImageSrc(deal);

  const merged = [primary, ...images, fallback].filter((u) => typeof u === "string" && u.length > 0);
  return Array.from(new Set(merged)).slice(0, 12);
}

export function DealDetailDrawer({
  deal,
  onClose,
}: {
  deal: DealCardModel;
  onClose: () => void;
}) {
  const { user, openAuthModal } = useAuth();
  const { tier } = useViewerTier();
  const now = useHydratedNow();

  const images = useMemo(() => extractImages(deal), [deal]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [deal.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((v) => Math.max(0, v - 1));
      if (e.key === "ArrowRight") setIdx((v) => Math.min(images.length - 1, v + 1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [images.length, onClose]);

  const score = typeof deal.score === "number" && Number.isFinite(deal.score) ? deal.score : null;
  const posted = postedAgo(deal.createdAt, now);
  const isCar = deal.marketplace?.toLowerCase?.() === "cars";
  const sellerType =
    typeof deal.sellerType === "string" && deal.sellerType.trim().length > 0
      ? deal.sellerType.trim()
      : "unknown";

  const canSeeHot = tier === "PRO" || tier === "ELITE";

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-3xl bg-[#0F0F0F] border border-white/10 rounded-t-2xl md:rounded-2xl max-h-[92vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-4 py-3 bg-[#0F0F0F]/90 backdrop-blur border-b border-white/10">
          <div className="text-white font-extrabold text-sm tracking-tight truncate">
            Deal details
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-white/70 hover:text-white hover:bg-white/5"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-5">
          <div className="relative">
            <DealCardImage
              src={images[idx] || "/placeholder.png"}
              alt={deal.title}
              aspectClassName={isCar ? "aspect-[16/10]" : "aspect-square"}
              className="rounded-xl"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 border border-white/10 p-2 text-white/80 hover:text-white"
                  onClick={() => setIdx((v) => Math.max(0, v - 1))}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 border border-white/10 p-2 text-white/80 hover:text-white"
                  onClick={() => setIdx((v) => Math.min(images.length - 1, v + 1))}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute right-2 bottom-2 rounded-full bg-black/55 border border-white/10 px-2 py-1 text-[11px] text-white/80">
                  {idx + 1}/{images.length}
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-white font-extrabold tracking-tight text-xl">
              {deal.title}
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-white font-extrabold text-2xl">
                {formatPrice(deal)}
              </div>
              {posted && <div className="text-xs text-white/50">{posted}</div>}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/60">
              <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
                {deal.marketplace}
              </span>
              {deal.location && (
                <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
                  {deal.location}
                </span>
              )}
              <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
                Seller: {sellerType}
              </span>
              {typeof deal.mileage === "number" && Number.isFinite(deal.mileage) && (
                <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
                  Mileage: {Math.round(deal.mileage).toLocaleString()}
                </span>
              )}
              {typeof deal.year === "number" && Number.isFinite(deal.year) && (
                <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
                  Year: {Math.round(deal.year)}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-xs text-white/60 font-semibold">Score</div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="text-white font-extrabold text-xl">
                  {score !== null ? score : "—"}
                </div>
                <div className="text-xs text-white/60 font-semibold">
                  {scoreLabel(score)}
                </div>
              </div>
              <div className="mt-2 text-[11px] text-white/50">
                {score !== null
                  ? "Score summarizes value, demand, risk, and freshness."
                  : "Score not available for this listing yet."}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-xs text-white/60 font-semibold">
                Alerts (tier-gated)
              </div>
              <div className="mt-2 text-[11px] text-white/55">
                {tier === "FREE_BASIC"
                  ? "Upgrade to see hot deal alerts sooner."
                  : tier === "STARTER"
                  ? "Pro unlocks instant hot alerts."
                  : tier === "PRO"
                  ? "Elite surfaces edge-case opportunities."
                  : "Elite priority alerts enabled."}
              </div>
              <div className="mt-3">
                {user ? (
                  <Link
                    href="/settings/notifications"
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-extrabold bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-white"
                  >
                    <Bell className="h-4 w-4" />
                    Manage alerts
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-extrabold bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-white"
                    onClick={() => openAuthModal("login")}
                  >
                    <Bell className="h-4 w-4" />
                    Sign in for alerts
                  </button>
                )}
              </div>
              {!canSeeHot && (
                <div className="mt-2 text-[11px] text-white/45">
                  Badges may be hidden on lower tiers, but deals are never filtered.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-xs text-white/60 font-semibold mb-2">
              Why this could be a good deal
            </div>
            <ul className="text-[11px] text-white/70 space-y-1 list-disc pl-4">
              {score !== null && score >= 85 && <li>High score suggests strong upside potential.</li>}
              {score !== null && score >= 70 && score < 85 && <li>Solid score — worth inspecting the details.</li>}
              {score !== null && score < 70 && <li>Lower score — proceed carefully and verify comps.</li>}
              {isCar && typeof deal.mileage === "number" && deal.mileage < 100_000 && (
                <li>Lower mileage improves liquidity and resale confidence.</li>
              )}
              {sellerType === "dealer" && (
                <li>Dealer listings can be less liquid for flips — margin may be tighter.</li>
              )}
              <li>Always verify condition, ownership, and comps before buying.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={deal.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-extrabold bg-[#121212] text-white border border-white/10 hover:border-[#00E5FF]/50"
            >
              Open original listing
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
