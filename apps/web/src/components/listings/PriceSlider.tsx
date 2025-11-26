"use client";

import { Input } from "@/components/ui/input";

interface PriceSliderProps {
  minValue?: number;
  maxValue?: number;
  onChange: (min: number | null, max: number | null) => void;
}

export function PriceSlider({ minValue, maxValue, onChange }: PriceSliderProps) {
  return (
    <div className="space-y-3">
      <div className="font-medium">Price Range</div>
      <div className="flex gap-3">
        <Input
          type="number"
          placeholder="Min"
          value={minValue ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null, maxValue ?? null)}
        />
        <Input
          type="number"
          placeholder="Max"
          value={maxValue ?? ""}
          onChange={(e) => onChange(minValue ?? null, e.target.value ? Number(e.target.value) : null)}
        />
      </div>
      <div className="text-sm text-muted-foreground">
        {minValue ? `$${minValue}` : "Any"} – {maxValue ? `$${maxValue}` : "Any"}
      </div>
    </div>
  );
}
