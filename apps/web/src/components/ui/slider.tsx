import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value?: number[];
  min?: number;
  max?: number;
  className?: string;
  onValueChange?: (value: number[]) => void;
}

export function Slider({ value, min = 0, max = 100, className, onValueChange }: SliderProps) {
  const current = value?.[0] ?? min;
  return (
    <input
      type="range"
      className={cn("w-full accent-[--accent-blue]", className)}
      min={min}
      max={max}
      value={current}
      onChange={(e) => onValueChange?.([Number(e.target.value)])}
    />
  );
}
