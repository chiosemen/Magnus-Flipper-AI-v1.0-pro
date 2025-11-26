"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CATEGORIES = ["Phones", "Cars", "Couches", "Consoles", "Laptops"];

interface OnboardingStepCategoryProps {
  value: string | null;
  onChange: (next: string) => void;
  onNext: () => void;
}

export function OnboardingStepCategory({ value, onChange, onNext }: OnboardingStepCategoryProps) {
  return (
    <Card className="border-slate-800 bg-slate-950/80">
      <CardHeader>
        <CardTitle>Pick your first category</CardTitle>
        <p className="text-sm text-slate-300">We’ll suggest filters tailored to it.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onChange(cat)}
              className={`rounded-lg border px-4 py-3 text-left transition ${
                value === cat
                  ? "border-cyan-400 bg-cyan-500/10 text-cyan-100"
                  : "border-slate-800 bg-slate-900/70 text-slate-200"
              }`}
            >
              {cat}
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
