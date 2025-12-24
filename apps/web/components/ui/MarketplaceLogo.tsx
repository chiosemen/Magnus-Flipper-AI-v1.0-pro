"use client";

import { ShoppingBag, Package, Store, Tag } from "lucide-react";

interface MarketplaceLogoProps {
  marketplace: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MarketplaceLogo({
  marketplace,
  size = "md",
  className = "",
}: MarketplaceLogoProps) {
  const normalized = marketplace.toLowerCase().trim();

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const iconSize = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-6 h-6",
  };

  // Marketplace-specific styling
  const getMarketplaceStyle = () => {
    switch (normalized) {
      case "facebook":
      case "facebook marketplace":
        return {
          bg: "from-[#1877F2] to-[#0d5dbf]",
          icon: Store,
          label: "FB",
        };
      case "ebay":
        return {
          bg: "from-[#E53238] to-[#b52328]",
          icon: ShoppingBag,
          label: "EB",
        };
      case "gumtree":
        return {
          bg: "from-[#72EF36] to-[#5bc129]",
          icon: Tag,
          label: "GT",
        };
      case "vinted":
        return {
          bg: "from-[#09B1BA] to-[#078a91]",
          icon: Package,
          label: "VT",
        };
      case "craigslist":
        return {
          bg: "from-[#6B21A8] to-[#4c1579]",
          icon: Store,
          label: "CL",
        };
      case "offerup":
        return {
          bg: "from-[#00A87E] to-[#008563]",
          icon: ShoppingBag,
          label: "OU",
        };
      case "letgo":
        return {
          bg: "from-[#FF6F3C] to-[#e65a2b]",
          icon: Tag,
          label: "LG",
        };
      default:
        return {
          bg: "from-[#4FF0E6] to-[#3bc4bc]",
          icon: Store,
          label: normalized.substring(0, 2).toUpperCase(),
        };
    }
  };

  const style = getMarketplaceStyle();
  const Icon = style.icon;

  return (
    <div
      className={`
        ${sizeClasses[size]}
        bg-gradient-to-br ${style.bg}
        rounded-lg
        flex items-center justify-center
        font-bold text-white
        shadow-lg
        ${className}
      `}
      title={marketplace}
    >
      {size === "lg" ? (
        <div className="flex flex-col items-center gap-0.5">
          <Icon className={iconSize[size]} />
          <span className="text-[10px] font-semibold">{style.label}</span>
        </div>
      ) : (
        <Icon className={iconSize[size]} />
      )}
    </div>
  );
}
