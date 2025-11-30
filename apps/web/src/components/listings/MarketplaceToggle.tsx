"use client";

import { Button } from "@/components/ui/button";

const MARKETPLACES = [
  { id: "FB_MARKETPLACE", label: "Facebook" },
  { id: "OFFERUP", label: "OfferUp" },
  { id: "CRAIGSLIST", label: "Craigslist" },
  { id: "VINTED", label: "Vinted" },
  { id: "EBAY", label: "eBay" },
  { id: "GUMTREE", label: "Gumtree" },
];

export function MarketplaceToggle({ value, onChange }: { value?: string; onChange: (val: string | null) => void }) {
  return (
    <div>
      <div className="mb-3 font-medium">Marketplace</div>
      <div className="flex flex-wrap gap-3">
        {MARKETPLACES.map((mkt) => (
          <Button
            key={mkt.id}
            variant={value === mkt.id ? "default" : "outline"}
            onClick={() => onChange(value === mkt.id ? null : mkt.id)}
          >
            {mkt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
