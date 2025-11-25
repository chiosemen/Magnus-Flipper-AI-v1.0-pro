import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { MarketplaceSite } from "@magnus-flipper-ai/core";
import { CATEGORIES, getManufacturersForCategory } from "@magnus-flipper-ai/ui-config";

export interface ListingFilterState {
  category: string;
  manufacturer: string;
  minPrice?: number | "";
  maxPrice?: number | "";
  site?: MarketplaceSite | "";
  query?: string;
}

interface ListingFiltersProps {
  value: ListingFilterState;
  onChange: (next: ListingFilterState) => void;
  onReset?: () => void;
}

export function ListingFilters({ value, onChange, onReset }: ListingFiltersProps) {
  const manufacturers = useMemo(
    () => (value.category ? getManufacturersForCategory(value.category) : []),
    [value.category]
  );

  return (
    <div className="grid gap-4 rounded-2xl border border-border/40 bg-slate-950/70 p-4 md:grid-cols-4">
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Category</Label>
        <select
          className="h-10 w-full rounded-md border border-border/50 bg-slate-900/80 px-3 text-sm text-foreground outline-none focus:border-cyan-500"
          value={value.category}
          onChange={(e) => onChange({ ...value, category: e.target.value, manufacturer: "" })}
        >
          <option value="">Any</option>
          {CATEGORIES.map((cat: { id: string; label: string }) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Manufacturer</Label>
        <select
          className="h-10 w-full rounded-md border border-border/50 bg-slate-900/80 px-3 text-sm text-foreground outline-none focus:border-cyan-500"
          value={value.manufacturer}
          onChange={(e) => onChange({ ...value, manufacturer: e.target.value })}
        >
          <option value="">Any</option>
          {manufacturers.map((m: { id: string; label: string }) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Price (min)</Label>
        <Input
          type="number"
          value={value.minPrice ?? ""}
          onChange={(e) => onChange({ ...value, minPrice: e.target.value ? Number(e.target.value) : "" })}
          placeholder="0"
          className="bg-slate-900/80"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Price (max)</Label>
        <Input
          type="number"
          value={value.maxPrice ?? ""}
          onChange={(e) => onChange({ ...value, maxPrice: e.target.value ? Number(e.target.value) : "" })}
          placeholder="2000"
          className="bg-slate-900/80"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label className="text-sm text-muted-foreground">Keyword</Label>
        <Input
          value={value.query ?? ""}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          placeholder="Search titles or locations..."
          className="bg-slate-900/80"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Site</Label>
        <select
          className="h-10 w-full rounded-md border border-border/50 bg-slate-900/80 px-3 text-sm text-foreground outline-none focus:border-cyan-500"
          value={value.site ?? ""}
          onChange={(e) => onChange({ ...value, site: (e.target.value as MarketplaceSite) || "" })}
        >
          <option value="">Any</option>
          {["FB_MARKETPLACE", "CRAIGSLIST", "OFFERUP", "VINTED"].map((site) => (
            <option key={site} value={site}>
              {site.toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end justify-end gap-2 md:col-span-1">
        <Button type="button" variant="outline" onClick={onReset} className="w-full">
          Reset
        </Button>
      </div>
    </div>
  );
}
