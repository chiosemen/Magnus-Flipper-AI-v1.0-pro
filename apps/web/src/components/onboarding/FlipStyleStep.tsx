"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const OPTIONS = [
  { id: "quick", title: "Quick flips", body: "Lower margin, higher velocity." },
  { id: "margin", title: "High margin", body: "Fewer deals, bigger spreads." },
];

interface FlipStyleStepProps {
  value: string | null;
  onChange: (val: string) => void;
  onNext: () => void;
}

export function FlipStyleStep({ value, onChange, onNext }: FlipStyleStepProps) {
  const [selected, setSelected] = useState(value);
  const apply = (val: string) => {
    setSelected(val);
    onChange(val);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => apply(opt.id)}
            className={`rounded-lg border px-4 py-3 text-left transition ${
              selected === opt.id
                ? "border-cyan-400 bg-cyan-500/10 text-cyan-100"
                : "border-slate-800 bg-slate-900/70 text-slate-200"
            }`}
          >
            <p className="text-base font-semibold text-white">{opt.title}</p>
            <p className="text-sm text-slate-300">{opt.body}</p>
          </button>
        ))}
      </div>
      <Button className="rounded-full" onClick={onNext} disabled={!selected}>
        Continue
      </Button>
    </div>
  );
}
