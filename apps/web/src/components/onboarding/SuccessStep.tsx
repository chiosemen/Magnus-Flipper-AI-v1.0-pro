"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SuccessStepProps {
  onGoDashboard?: () => void;
}

export function SuccessStep({ onGoDashboard }: SuccessStepProps) {
  return (
    <Card className="border-slate-800 bg-slate-950/80 text-center">
      <CardHeader>
        <CardTitle className="text-2xl text-white">You are onboarded!</CardTitle>
        <p className="text-sm text-slate-300">Your first saved search is live. Alerts will send as soon as matches appear.</p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <Button className="rounded-full px-6" onClick={onGoDashboard} asChild>
          <a href="/dashboard">Go to dashboard</a>
        </Button>
        <Button variant="outline" className="rounded-full px-6" asChild>
          <a href="/searches/new">Create another search</a>
        </Button>
      </CardContent>
    </Card>
  );
}
