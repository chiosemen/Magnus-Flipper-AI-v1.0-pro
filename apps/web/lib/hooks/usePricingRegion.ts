"use client";

import { useState, useEffect } from "react";

export type PricingRegion = "uk" | "us";
export type Currency = "GBP" | "USD";

const REGION_CONFIG: Record<PricingRegion, { currency: Currency; symbol: string }> = {
  uk: { currency: "GBP", symbol: "£" },
  us: { currency: "USD", symbol: "$" },
};

/**
 * Detects user's pricing region based on locale.
 * UK users see £, US users see $.
 */
export function usePricingRegion(): {
  region: PricingRegion;
  currency: Currency;
  symbol: string;
  formatPrice: (amount: number) => string;
  isLoading: boolean;
} {
  const [region, setRegion] = useState<PricingRegion>("uk");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectRegion = (): PricingRegion => {
      // Check navigator.language first
      if (typeof navigator !== "undefined") {
        const lang = navigator.language.toLowerCase();
        
        // US locales
        if (lang.startsWith("en-us") || lang === "en") {
          // Check timezone as secondary signal for US
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (tz.startsWith("America/")) {
            return "us";
          }
        }
        
        // UK locales
        if (lang.startsWith("en-gb") || lang.includes("gb")) {
          return "uk";
        }
      }

      // Default to UK for European/other regions
      return "uk";
    };

    setRegion(detectRegion());
    setIsLoading(false);
  }, []);

  const config = REGION_CONFIG[region];

  const formatPrice = (amount: number): string => {
    return `${config.symbol}${amount}`;
  };

  return {
    region,
    currency: config.currency,
    symbol: config.symbol,
    formatPrice,
    isLoading,
  };
}

/**
 * Format a price for display with proper currency symbol.
 */
export function formatCurrency(amount: number, region: PricingRegion): string {
  const config = REGION_CONFIG[region];
  return `${config.symbol}${amount}`;
}

/**
 * Get regional price from a price object.
 */
export function getRegionalPrice(
  prices: { uk: number; us: number },
  region: PricingRegion
): number {
  return region === "uk" ? prices.uk : prices.us;
}
