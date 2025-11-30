"use client";

import { MarketplaceToggle } from "./MarketplaceToggle";
import { PriceSlider } from "./PriceSlider";
import { RadiusSelector } from "./RadiusSelector";
import { ConditionSelector } from "./ConditionSelector";
import { ModelQuickSelect } from "./ModelQuickSelect";
import { SortOptions } from "./SortOptions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CATEGORIES, MANUFACTURERS_BY_CATEGORY } from "@magnus-flipper-ai/ui-config";

export function ListingFilters({ filters, onChange }: any) {
  return (
    <div className="space-y-6 rounded-xl border border-slate-800 bg-slate-950/70 p-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Keywords</label>
        <Input
          placeholder="Keyword override"
          value={filters.q || ""}
          onChange={(e) => onChange({ q: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <Select
          className="w-full"
          value={filters.category || "all"}
          onChange={(e) => {
            const category = e.target.value === "all" ? undefined : e.target.value;
            onChange({ category, manufacturer: undefined, models: undefined });
          }}
        >
          <option value="all">All</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </Select>
      </div>

      {filters.category && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Manufacturer</label>
          <Select
            className="w-full"
            value={filters.manufacturer || "all"}
            onChange={(e) =>
              onChange({
                manufacturer: e.target.value === "all" ? undefined : e.target.value,
                models: undefined,
              })
            }
          >
            <option value="all">All</option>
            {(MANUFACTURERS_BY_CATEGORY[filters.category] || []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      <MarketplaceToggle
        value={filters.marketplace}
        onChange={(m: string | null) => onChange({ marketplace: m })}
      />

      <PriceSlider
        minValue={filters.minPrice}
        maxValue={filters.maxPrice}
        onChange={(min: number | null, max: number | null) =>
          onChange({ minPrice: min ?? undefined, maxPrice: max ?? undefined })
        }
      />

      <RadiusSelector
        value={filters.radiusMiles}
        onChange={(v: number | null) => onChange({ radiusMiles: v ?? undefined })}
        localOnly={filters.local}
        onLocalToggle={() => onChange({ local: !filters.local })}
      />

      <ConditionSelector
        value={filters.condition}
        onChange={(v: string | null) => onChange({ condition: v || undefined })}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium">Location</label>
        <Input
          placeholder="City or ZIP code"
          value={filters.location || ""}
          onChange={(e) => onChange({ location: e.target.value })}
        />
      </div>

      <SortOptions
        value={filters.sortBy}
        onChange={(sortBy: string) => onChange({ sortBy })}
      />

      <ModelQuickSelect
        category={filters.category}
        manufacturer={filters.manufacturer}
        onSelect={(model: string) => onChange({ models: [model] })}
      />
    </div>
  );
}
