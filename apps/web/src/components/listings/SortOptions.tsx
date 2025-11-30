"use client";

import { Select } from "@/components/ui/select";

const SORT_OPTIONS = [
  { id: "relevance", label: "Relevance" },
  { id: "price_asc", label: "Price: Low → High" },
  { id: "price_desc", label: "Price: High → Low" },
  { id: "newest", label: "Newest" },
];

interface SortOptionsProps {
  value?: string;
  onChange: (value: string) => void;
}

export function SortOptions({ value = "relevance", onChange }: SortOptionsProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Sort By</label>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
