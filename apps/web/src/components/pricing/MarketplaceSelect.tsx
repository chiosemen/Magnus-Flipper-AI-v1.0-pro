"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";

const OPTIONS = ["Facebook Marketplace", "Craigslist", "OfferUp", "Kijiji"];

type MarketplaceSelectProps = {
  value: string[];
  onChange: (val: string[]) => void;
};

export function MarketplaceSelect({ value, onChange }: MarketplaceSelectProps) {
  const selectionText = useMemo(
    () => (value.length ? `${value.length} selected` : "Select marketplaces"),
    [value.length]
  );

  const toggle = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter((v) => v !== item));
    } else {
      onChange([...value, item]);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-slate-400">Marketplaces</p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((item) => {
          const active = value.includes(item);
          return (
            <Button
              key={item}
              type="button"
              variant={active ? "default" : "outline"}
              className={`rounded-full px-3 py-1 text-xs ${active ? "bg-cyan-500 text-slate-900" : "border-slate-700"}`}
              onClick={() => toggle(item)}
            >
              {item}
            </Button>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500">Add coverage across platforms. {selectionText}.</p>
    </div>
  );
}
