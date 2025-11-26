import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface OnboardingCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function OnboardingCard({ title, description, children }: OnboardingCardProps) {
  return (
    <Card className="border-slate-800 bg-slate-950/80">
      <CardHeader>
        <CardTitle className="text-lg text-white">{title}</CardTitle>
        {description && <p className="text-sm text-slate-300">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
