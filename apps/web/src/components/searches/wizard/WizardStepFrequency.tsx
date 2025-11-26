"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const OPTIONS = [
  { id: "5", label: "Every 5 minutes" },
  { id: "3", label: "Every 3 minutes" },
  { id: "2", label: "Every 2 minutes" },
  { id: "instant", label: "Instant scanning (Ultra)" },
];

interface WizardStepFrequencyProps {
  value: string;
  onChange: (next: string) => void;
  onNext: () => void;
}

export function WizardStepFrequency({ value, onChange, onNext }: WizardStepFrequencyProps) {
  return (
    <Card className="border-slate-800 bg-slate-950/80">
      <CardHeader>
        <CardTitle>Scan frequency</CardTitle>
        <p className="text-sm text-slate-300">Choose how fast you want Magnus to scan.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`rounded-lg border px-4 py-3 text-left ${
                value === opt.id
                  ? "border-cyan-400 bg-cyan-500/10 text-cyan-100"
                  : "border-slate-800 bg-slate-900/70 text-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Button className="rounded-full" onClick={onNext} disabled={!value}>
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}
