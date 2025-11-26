"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface RadiusSelectorProps {
  value?: number;
  onChange: (val: number | null) => void;
  localOnly?: boolean;
  onLocalToggle?: () => void;
}

export function RadiusSelector({ value, onChange, localOnly, onLocalToggle }: RadiusSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Radius (miles)</div>
        {onLocalToggle && (
          <Button variant={localOnly ? "default" : "outline"} size="sm" onClick={onLocalToggle}>
            {localOnly ? "Local only" : "All areas"}
          </Button>
        )}
      </div>
      <Input
        type="number"
        placeholder="e.g. 25"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      />
    </div>
  );
}
