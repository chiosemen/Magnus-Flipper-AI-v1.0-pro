"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface WizardStepKeywordsProps {
  value: string[];
  onChange: (next: string[]) => void;
  onNext: () => void;
}

export function WizardStepKeywords({ value, onChange, onNext }: WizardStepKeywordsProps) {
  const [draft, setDraft] = useState("");

  const add = () => {
    if (!draft.trim()) return;
    onChange([...value, draft.trim()]);
    setDraft("");
  };

  return (
    <Card className="border-slate-800 bg-slate-950/80">
      <CardHeader>
        <CardTitle>Keywords</CardTitle>
        <p className="text-sm text-slate-300">Models, trims, or brand terms to include.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="e.g. iPhone 14 Pro, Civic LX"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button type="button" onClick={add}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {value.map((kw) => (
            <span
              key={kw}
              className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-sm text-slate-200"
            >
              {kw}
            </span>
          ))}
          {value.length === 0 && <p className="text-sm text-slate-400">No keywords yet.</p>}
        </div>
        <Button className="rounded-full" onClick={onNext} disabled={value.length === 0}>
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}
