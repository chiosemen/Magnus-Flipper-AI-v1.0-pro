"use client";

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
  const fallbackSrc = "/placeholders/marketplace.png";

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const imageSize = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-9 h-9",
  };

  const logos: Record<string, { src: string; alt: string }> = {
    facebook: {
      src: "/marketplaces/facebook.svg",
      alt: "Facebook Marketplace",
    },
    "facebook marketplace": {
      src: "/marketplaces/facebook.svg",
      alt: "Facebook Marketplace",
    },
    ebay: {
      src: "/marketplaces/ebay.svg",
      alt: "eBay",
    },
    gumtree: {
      src: "/marketplaces/gumtree.svg",
      alt: "Gumtree",
    },
    vinted: {
      src: "/marketplaces/vinted.svg",
      alt: "Vinted",
    },
  };

  const logo = logos[normalized];
  const logoSrc = logo?.src || fallbackSrc;
  const logoAlt = logo?.alt || marketplace;

  return (
    <div
      className={`
        ${sizeClasses[size]}
        bg-white/5
        ring-1 ring-white/10
        rounded-lg
        flex items-center justify-center
        shadow-lg
        ${className}
      `}
      title={marketplace}
    >
      <img
        src={logoSrc}
        alt={logoAlt}
        className={`${imageSize[size]} object-contain`}
        onError={(e) => {
          if (e.currentTarget.src !== fallbackSrc) {
            e.currentTarget.src = fallbackSrc;
          }
        }}
      />
    </div>
  );
}
