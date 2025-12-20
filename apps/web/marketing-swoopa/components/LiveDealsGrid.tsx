"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DealCard } from "./deals/DealCard";
import { SkeletonDealCard } from "./deals/SkeletonDealCard";
import { useDealCards } from "./deals/useDealCards";
import { useViewerTier } from "./deals/useViewerTier";
import { TierMessage } from "./deals/TierMessage";
import type { DealCardModel } from "./deals/dealUtils";
import { DealDetailDrawer } from "./deals/DealDetailDrawer";
import { MOTION_TRANSITION, useMotionPrefs } from "@/lib/motion";
import { useMotionSeverity } from "@/lib/motionSeverity";
import { useMotionDebug } from "@/lib/motionDebug";
import { useRegion } from "@/providers/RegionProvider";
import { useHydratedMotionProps } from "@/lib/hydratedMotion";
import { useIsHydrated } from "@/providers/HydrationProvider";

type LiveDealsGridProps = {
  marketplaceSlug?: string;
  marketplaces?: string[] | null;
  limit?: number;
  searchId?: string | null;
  searchIds?: string[] | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  hideDealers?: boolean;
  hideSpam?: boolean;
};

function LiveDealCardItem({
  deal,
  tier,
  motionSeverity,
  variants,
  onSelect,
}: {
  deal: DealCardModel;
  tier: ReturnType<typeof useViewerTier>["tier"];
  motionSeverity: ReturnType<typeof useMotionSeverity>;
  variants: any;
  onSelect: (deal: DealCardModel) => void;
}) {
  const debug = useMotionDebug({
    label: `LiveDealsGrid:DealCard`,
    type: "entry",
    durationMs: motionSeverity.baseDurationMs,
    tier: motionSeverity.tier,
  });

  return (
    <motion.div
      className="mb-4 break-inside-avoid"
      role="button"
      tabIndex={0}
      onClickCapture={(e) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest?.("a")) return;
        onSelect(deal);
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        onSelect(deal);
      }}
      variants={variants}
      {...debug}
    >
      <DealCard deal={deal} tier={tier} motion={motionSeverity} />
    </motion.div>
  );
}

export default function LiveDealsGrid({
  marketplaceSlug,
  marketplaces,
  limit = 12,
  searchId,
  searchIds,
  minPrice,
  maxPrice,
  hideDealers,
  hideSpam,
}: LiveDealsGridProps) {
  const { deals, loading, error } = useDealCards({
    marketplaceSlug,
    marketplaces,
    limit,
    searchId,
    searchIds,
    minPrice,
    maxPrice,
    hideDealers,
    hideSpam,
  });
  const { tier } = useViewerTier();
  const [detailDeal, setDetailDeal] = useState<DealCardModel | null>(null);
  const motionPrefs = useMotionPrefs();
  const motionSeverity = useMotionSeverity(tier);
  const { region } = useRegion();
  const hydrated = useIsHydrated();
  const hasAnimatedOnceRef = useRef(false);

  useEffect(() => {
    if (!hasAnimatedOnceRef.current && deals.length > 0) {
      hasAnimatedOnceRef.current = true;
    }
  }, [deals.length]);

  const skeletonCount = useMemo(() => {
    const base = Math.max(6, Math.min(12, Math.floor(limit)));
    return base;
  }, [limit]);

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

  const showSkeleton = deals.length === 0;
  const shouldAnimateCards =
    hydrated && !motionPrefs.reducedMotion && !hasAnimatedOnceRef.current && !showSkeleton;

  const debugSkeleton = useMotionDebug({
    label: "LiveDealsGrid:Skeleton",
    type: "transition",
    durationMs: motionSeverity.baseDurationMs,
    tier: motionSeverity.tier,
  });
  const debugDeals = useMotionDebug({
    label: "LiveDealsGrid:Deals",
    type: "transition",
    durationMs: motionSeverity.baseDurationMs,
    tier: motionSeverity.tier,
  });

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: motionSeverity.staggerSec,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { ...MOTION_TRANSITION.fadeUpFast, duration: motionSeverity.durationSec },
    },
  } as const;

  const fadeMotionProps = useHydratedMotionProps(
    motionPrefs.reducedMotion
      ? {}
      : {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { ...MOTION_TRANSITION.fade, duration: motionSeverity.durationSec },
        }
  );

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false} mode="wait">
        {showSkeleton ? (
          <motion.div
            key={`skeleton-${region}`}
            className="space-y-4"
            {...fadeMotionProps}
            {...debugSkeleton}
          >
            <div className="text-white/70 text-sm font-medium">
              Market is warming up — scanning for fresh opportunities.
            </div>
            <TierMessage tier={tier} />
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
              {Array.from({ length: skeletonCount }).map((_, idx) => (
                <SkeletonDealCard key={`skeleton-${idx}`} />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`deals-${region}`}
            className="space-y-3"
            {...fadeMotionProps}
            {...debugDeals}
          >
            <TierMessage tier={tier} />
            <motion.div
              className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:_balance]"
              variants={containerVariants}
              initial={shouldAnimateCards ? "hidden" : false}
              animate={shouldAnimateCards ? "show" : undefined}
            >
              {deals.map((deal) => (
                <LiveDealCardItem
                  key={deal.id}
                  deal={deal}
                  tier={tier}
                  motionSeverity={motionSeverity}
                  variants={itemVariants}
                  onSelect={setDetailDeal}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {detailDeal && (
        <DealDetailDrawer deal={detailDeal} onClose={() => setDetailDeal(null)} />
      )}
    </div>
  );
}
