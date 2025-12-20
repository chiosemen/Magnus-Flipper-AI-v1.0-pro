"use client";

import { ExternalLink, MapPin } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import type { DealCardModel } from "./dealUtils";
import {
  getDealHeat,
  getDealImageSrc,
  getFreshnessClass,
  postedAgo,
} from "./dealUtils";
import { DealCardImage } from "./DealCardImage";
import { HeatBadge, type HeatBadgeMotion } from "./HeatBadge";
import type { PricingTier } from "./pricingTier";
import { getHeatVisibility } from "./heatVisibility";
import { useRegion } from "@/providers/RegionProvider";
import { useHydratedNow } from "@/lib/hydratedTime";

function formatPrice(deal: Pick<DealCardModel, "price" | "currency">): string {
  return typeof deal.price === "number"
    ? `${deal.currency}${deal.price.toLocaleString()}`
    : "—";
}

function formatMileage(mileage?: number | null): string | null {
  if (typeof mileage !== "number" || !Number.isFinite(mileage) || mileage <= 0) return null;
  return `${Math.round(mileage).toLocaleString()} mi`;
}

function vehicleLabel(deal: Pick<DealCardModel, "year" | "make" | "model" | "title">): string {
  const parts: string[] = [];
  if (typeof deal.year === "number" && Number.isFinite(deal.year)) parts.push(String(Math.round(deal.year)));
  if (typeof deal.make === "string" && deal.make.trim() !== "") parts.push(deal.make.trim());
  if (typeof deal.model === "string" && deal.model.trim() !== "") parts.push(deal.model.trim());

  if (parts.length > 0) return parts.join(" ");
  return deal.title;
}

export function CarDealCard({
  deal,
  tier,
  motion,
}: {
  deal: DealCardModel;
  tier: PricingTier;
  motion: HeatBadgeMotion;
}) {
  const { region } = useRegion();
  const now = useHydratedNow();
  const imageSrc = getDealImageSrc(deal);
  const posted = postedAgo(deal.createdAt, now);
  const heat = getDealHeat(deal, region, now);
  const heatVisibility = getHeatVisibility(tier, heat);
  const freshness = getFreshnessClass(deal, region, now);

  const mileageText = formatMileage(deal.mileage);

  return (
    <Card className="group relative flex flex-col border border-white/10 bg-gradient-to-br from-[#121212] via-[#0A0A0A] to-[#121212] shadow-[0_0_25px_rgba(0,0,0,0.9)] transition hover:-translate-y-0.5 hover:border-[#00E5FF]/80 hover:shadow-[0_0_40px_rgba(0,229,255,0.8)]">
      <CardContent className="flex flex-1 flex-col justify-between gap-3 p-3">
        <div className="space-y-3">
          <DealCardImage
            src={imageSrc}
            alt={deal.title}
            aspectClassName="aspect-[16/10]"
            imgClassName={freshness.imageClass}
            className={heatVisibility.emphasize ? "ring-1 ring-red-400/40 shadow-[0_0_24px_rgba(239,68,68,0.18)]" : ""}
          >
            <div className="absolute left-2 top-2">
              <HeatBadge
                heat={heat}
                tier={tier}
                motion={motion}
                debugLabel="CarDealCard:HeatBadge"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-2">
              <div className="rounded-lg bg-black/55 backdrop-blur-sm px-2 py-1 text-xs font-extrabold text-white border border-white/10">
                {vehicleLabel(deal)}
              </div>
            </div>
          </DealCardImage>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-lg font-extrabold text-white">
                {formatPrice(deal)}
              </div>
              {posted && (
                <div className={`text-[11px] whitespace-nowrap transition-colors duration-300 ${freshness.timestampClass}`}>
                  {posted}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/70 font-medium">
              {mileageText && <span>{mileageText}</span>}
              {deal.location && (
                <span className="inline-flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{deal.location}</span>
                </span>
              )}
            </div>
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
  );
}
