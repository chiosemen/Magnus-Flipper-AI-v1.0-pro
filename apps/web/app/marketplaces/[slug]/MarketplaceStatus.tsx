"use client";

type MarketplaceStatusProps = {
  marketplace: string;
};

export default function MarketplaceStatus(_props: MarketplaceStatusProps) {
  return (
    <div className="flex items-center gap-4 text-sm text-white/70 font-medium">
      <span className="inline-flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#00E5FF] animate-pulse" />
        Live scanning
      </span>
    </div>
  );
}
