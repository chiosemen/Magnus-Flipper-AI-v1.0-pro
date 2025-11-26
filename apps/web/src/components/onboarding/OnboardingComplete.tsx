"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OnboardingCompleteProps {
  onCreateSearch?: () => void;
}

export function OnboardingComplete({ onCreateSearch }: OnboardingCompleteProps) {
  return (
    <Card className="border-slate-800 bg-slate-950/80">
      <CardHeader>
        <CardTitle>All set!</CardTitle>
        <p className="text-sm text-slate-300">Your preferences are saved. Create your first saved search.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="rounded-full" onClick={onCreateSearch} asChild>
          <a href="/searches/new">Create saved search</a>
        </Button>
        <Button variant="outline" className="rounded-full" asChild>
          <a href="/pricing">View plans</a>
        </Button>
      </CardContent>
    </Card>
  );
}
