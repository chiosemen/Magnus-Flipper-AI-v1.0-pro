"use client";

import { motion } from "framer-motion";
import { MarketplaceLogo } from "./MarketplaceLogo";
import { Badge } from "./badge";
import { TrendingUp, Minus, TrendingDown } from "lucide-react";
import { prefersReducedMotion } from "@/lib/motion";

interface MarketplaceCardProps {
  marketplace: string;
  count: number;
  avgHeat: number;
}

export function MarketplaceCard({
  marketplace,
  count,
  avgHeat,
}: MarketplaceCardProps) {
  const reducedMotion = prefersReducedMotion();

  const getHeatBadge = () => {
    if (avgHeat >= 80)
      return {
        badge: (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            🔥 Hot
          </Badge>
        ),
        color: "red",
      };
    if (avgHeat >= 60)
      return {
        badge: (
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            ⚡ Warm
          </Badge>
        ),
        color: "orange",
      };
    return {
      badge: (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          ❄️ Cool
        </Badge>
      ),
      color: "blue",
    };
  };

  const getVelocityHint = () => {
    if (avgHeat >= 85) {
      return {
        text: "Spike detected",
        icon: TrendingUp,
        color: "text-red-400",
      };
    }
    if (avgHeat >= 70) {
      return {
        text: "Heating up",
        icon: TrendingUp,
        color: "text-orange-400",
      };
    }
    if (avgHeat >= 40) {
      return {
        text: "Steady",
        icon: Minus,
        color: "text-blue-400",
      };
    }
    return {
      text: "Dormant",
      icon: TrendingDown,
      color: "text-[#6E7681]",
    };
  };

  const heatInfo = getHeatBadge();
  const velocity = getVelocityHint();
  const VelocityIcon = velocity.icon;

  const getHeatGradient = () => {
    if (avgHeat >= 80) return "from-red-500/20 to-transparent";
    if (avgHeat >= 60) return "from-orange-500/20 to-transparent";
    return "from-blue-500/20 to-transparent";
  };

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={reducedMotion ? false : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={
        reducedMotion
          ? {}
          : {
              y: -4,
              transition: { duration: 0.2 },
            }
      }
      className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 overflow-hidden group hover:border-[#4FF0E6]/30 transition-all duration-300"
    >
      {/* Heat glow background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${getHeatGradient()} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header with logo and badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MarketplaceLogo marketplace={marketplace} size="md" />
            <h3 className="text-base font-semibold text-[#ededed] capitalize">
              {marketplace}
            </h3>
          </div>
          {heatInfo.badge}
        </div>

        {/* Count */}
        <div className="text-3xl font-bold text-[#4FF0E6] mb-3">
          {count.toLocaleString()}
        </div>

        {/* Heat bar visualization */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-[#6E7681] mb-1.5">
            <span>Heat Index</span>
            <span className="font-medium">{avgHeat}/100</span>
          </div>
          <div className="h-1.5 bg-[#0a0a0a] rounded-full overflow-hidden">
            <motion.div
              initial={reducedMotion ? { width: `${avgHeat}%` } : { width: 0 }}
              animate={{ width: `${avgHeat}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className={`h-full rounded-full ${
                avgHeat >= 80
                  ? "bg-gradient-to-r from-red-500 to-orange-500"
                  : avgHeat >= 60
                  ? "bg-gradient-to-r from-orange-500 to-yellow-500"
                  : "bg-gradient-to-r from-blue-500 to-cyan-500"
              }`}
              style={{
                boxShadow:
                  avgHeat >= 70
                    ? "0 0 10px rgba(255, 100, 100, 0.5)"
                    : "none",
              }}
            />
          </div>
        </div>

        {/* Velocity hint */}
        <div className={`flex items-center gap-1.5 text-xs font-medium ${velocity.color}`}>
          <VelocityIcon className="w-3.5 h-3.5" />
          <span>{velocity.text}</span>
        </div>
      </div>
    </motion.div>
  );
}
