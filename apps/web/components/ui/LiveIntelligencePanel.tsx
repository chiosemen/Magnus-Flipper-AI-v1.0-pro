"use client";

import { motion } from "framer-motion";
import { Zap, Target, Bell, TrendingUp, Clock } from "lucide-react";
import { prefersReducedMotion } from "@/lib/motion";

interface LiveIntelligencePanelProps {
  newListings24h: number;
  newMatches?: number;
  activeAlerts: number;
  lastScanTime?: string;
}

export function LiveIntelligencePanel({
  newListings24h,
  newMatches = 0,
  activeAlerts,
  lastScanTime,
}: LiveIntelligencePanelProps) {
  const reducedMotion = prefersReducedMotion();

  const stats = [
    {
      icon: TrendingUp,
      label: "New Listings",
      value: newListings24h,
      color: "from-[#4FF0E6] to-[#4FF0E6]/60",
      glowColor: "#4FF0E6",
    },
    {
      icon: Target,
      label: "New Matches",
      value: newMatches,
      color: "from-[#8A4FFF] to-[#8A4FFF]/60",
      glowColor: "#8A4FFF",
    },
    {
      icon: Bell,
      label: "Active Alerts",
      value: activeAlerts,
      color: "from-[#FF6B6B] to-[#FF6B6B]/60",
      glowColor: "#FF6B6B",
    },
  ];

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={reducedMotion ? false : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-6 relative overflow-hidden"
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#4FF0E6]/5 via-transparent to-[#8A4FFF]/5 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#ededed] mb-1">
              Live Intelligence Feed
            </h3>
            <p className="text-xs text-[#a0a0a0]">
              Real-time marketplace signals • Updated continuously
            </p>
          </div>
          <motion.div
            animate={
              reducedMotion
                ? {}
                : {
                    rotate: [0, 360],
                  }
            }
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
            className="text-[#4FF0E6]"
          >
            <Zap className="w-6 h-6" />
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={reducedMotion ? false : { opacity: 0, x: -20 }}
              animate={reducedMotion ? false : { opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={
                reducedMotion
                  ? {}
                  : {
                      scale: 1.05,
                      transition: { duration: 0.2 },
                    }
              }
              className="bg-[#0a0a0a]/50 border border-[#2a2a2a] rounded-lg p-4 relative overflow-hidden group"
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${stat.glowColor}10, transparent)`,
                }}
              />

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${stat.color} mb-3`}
                >
                  <stat.icon className="w-4 h-4 text-white" />
                </div>

                {/* Value */}
                <div className="text-2xl font-bold text-[#ededed] mb-1">
                  {stat.value.toLocaleString()}
                </div>

                {/* Label */}
                <div className="text-xs text-[#a0a0a0] font-medium">
                  {stat.label}
                </div>

                {/* Pulse indicator for active stats */}
                {stat.value > 0 && (
                  <motion.div
                    animate={
                      reducedMotion
                        ? {}
                        : {
                            opacity: [0.3, 1, 0.3],
                          }
                    }
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute top-2 right-2 w-2 h-2 rounded-full"
                    style={{ backgroundColor: stat.glowColor }}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Last Scan Time */}
        {lastScanTime && (
          <div className="flex items-center justify-between pt-4 border-t border-[#2a2a2a]">
            <div className="flex items-center gap-2 text-xs text-[#a0a0a0]">
              <Clock className="w-3.5 h-3.5" />
              Live signal
            </div>
            <div className="text-xs font-medium text-[#4FF0E6]">
              {lastScanTime}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
