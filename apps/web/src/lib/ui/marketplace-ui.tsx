export function getMarketplaceColor(site: string): string {
  const normalized = site?.toUpperCase() || "";

  if (normalized.includes("VINTED")) return "bg-teal-500/10 text-teal-400 border-teal-500/30";
  if (normalized.includes("EBAY")) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
  if (normalized.includes("GUMTREE")) return "bg-green-500/10 text-green-400 border-green-500/30";
  if (normalized.includes("FB") || normalized.includes("FACEBOOK")) return "bg-blue-500/10 text-blue-400 border-blue-500/30";
  if (normalized.includes("CRAIGSLIST")) return "bg-purple-500/10 text-purple-400 border-purple-500/30";
  if (normalized.includes("OFFERUP")) return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";

  return "bg-slate-500/10 text-slate-400 border-slate-500/30";
}

export function getMarketplaceLogo(site: string): JSX.Element | null {
  const normalized = site?.toUpperCase() || "";

  if (normalized.includes("VINTED")) {
    return (
      <svg className="h-3 w-3 inline mr-1" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
  }

  if (normalized.includes("EBAY")) {
    return (
      <svg className="h-3 w-3 inline mr-1" viewBox="0 0 24 24" fill="currentColor">
        <rect x="4" y="10" width="16" height="4" rx="1" />
      </svg>
    );
  }

  if (normalized.includes("GUMTREE")) {
    return (
      <svg className="h-3 w-3 inline mr-1" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" />
      </svg>
    );
  }

  return null;
}
