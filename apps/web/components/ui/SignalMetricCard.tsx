"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Activity } from "lucide-react";
import { prefersReducedMotion } from "@/lib/motion";

interface SignalMetricCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  isLive?: boolean;
  glow?: boolean;
  lastUpdate?: string;
}

export function SignalMetricCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  isLive = false,
  glow = false,
  lastUpdate,
}: SignalMetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const reducedMotion = prefersReducedMotion();

  // Animated counter effect
  useEffect(() => {
    if (typeof value === "number" && !reducedMotion) {
      const duration = 1500;
      const steps = 60;
      const stepValue = value / steps;
      const stepDuration = duration / steps;

      let current = 0;
      const interval = setInterval(() => {
        current += stepValue;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, stepDuration);

      return () => clearInterval(interval);
    } else {
      setDisplayValue(typeof value === "number" ? value : 0);
    }
  }, [value, reducedMotion]);

  const getTrendColor = () => {
    if (trend === "up") return "text-green-400";
    if (trend === "down") return "text-red-400";
    return "text-[#6E7681]";
  };

  const getTrendIcon = () => {
    if (trend === "up") return <ArrowUp className="w-3 h-3" />;
    if (trend === "down") return <ArrowDown className="w-3 h-3" />;
    return null;
  };

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      animate={reducedMotion ? false : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={
        reducedMotion
          ? {}
          : {
              y: -4,
              transition: { duration: 0.2 },
            }
      }
      className={`
        relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5
        transition-all duration-300
        hover:border-[#4FF0E6]/40 hover:shadow-lg hover:shadow-[#4FF0E6]/5
        ${glow ? "shadow-lg shadow-[#4FF0E6]/10" : ""}
      `}
    >
      {/* Glow effect overlay */}
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#4FF0E6]/5 to-transparent rounded-lg pointer-events-none" />
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[#a0a0a0] uppercase tracking-wide font-medium">
            {label}
          </span>
          <div className="flex items-center gap-2">
            {isLive && (
              <motion.div
                animate={
                  reducedMotion
                    ? {}
                    : {
                        opacity: [0.5, 1, 0.5],
                        scale: [0.95, 1.05, 0.95],
                      }
                }
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="flex items-center gap-1 text-[10px] text-[#4FF0E6] font-medium"
              >
                <Activity className="w-3 h-3" />
                LIVE
              </motion.div>
            )}
            {icon && <span className="text-xl opacity-80">{icon}</span>}
          </div>
        </div>

        {/* Value */}
        <div className="text-3xl font-bold text-[#ededed] mb-2">
          {typeof value === "number"
            ? displayValue.toLocaleString()
            : value}
        </div>

        {/* Trend and Last Update */}
        <div className="flex items-center justify-between">
          {trend && trendValue && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${getTrendColor()}`}
            >
              {getTrendIcon()}
              <span>{trendValue}</span>
            </div>
          )}

          {lastUpdate && (
            <div className="text-xs text-[#6E7681]">{lastUpdate}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
