import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface StepIntroProps {
  onNext: () => void;
}

export function StepIntro({ onNext }: StepIntroProps) {
  return (
    <Card className="border-border/40 bg-slate-950/70">
      <CardHeader className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-cyan-300" />
        <CardTitle>Welcome to your first flip</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>We will connect marketplaces, set up your first saved search, and enable alerts.</p>
        <Button onClick={onNext}>Start</Button>
      </CardContent>
    </Card>
  );
}
