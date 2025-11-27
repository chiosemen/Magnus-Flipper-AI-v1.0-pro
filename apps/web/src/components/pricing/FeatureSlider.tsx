"use client";

type FeatureSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
};

export function FeatureSlider({ label, value, min, max, onChange }: FeatureSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <p className="text-slate-200">{label}</p>
        <span className="text-xs text-cyan-200">{value} min</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-cyan-400"
      />
      <p className="text-[11px] text-slate-500">Set how often we scan and how long alerts stay fresh.</p>
    </div>
  );
}
