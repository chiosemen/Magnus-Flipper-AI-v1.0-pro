"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface OnboardingStepSearchProps {
  keywords: string[];
  setKeywords: (next: string[]) => void;
  onNext: () => void;
}

export function OnboardingStepSearch({ keywords, setKeywords, onNext }: OnboardingStepSearchProps) {
  const [draft, setDraft] = useState("");

  const addKeyword = () => {
    if (!draft.trim()) return;
    setKeywords([...keywords, draft.trim()]);
    setDraft("");
  };

  return (
    <Card className="border-slate-800 bg-slate-950/80">
      <CardHeader>
        <CardTitle>Keywords to track</CardTitle>
        <p className="text-sm text-slate-300">Add a few models or trims you want to monitor.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="e.g. iPhone 14 Pro, Civic LX"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button onClick={addKeyword} type="button">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {keywords.map((k) => (
            <span
              key={k}
              className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-sm text-slate-200"
            >
              {k}
            </span>
          ))}
          {keywords.length === 0 && (
            <p className="text-sm text-slate-400">No keywords yet. Add one to continue.</p>
          )}
        </div>
        <Button className="rounded-full" onClick={onNext} disabled={keywords.length === 0}>
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}
