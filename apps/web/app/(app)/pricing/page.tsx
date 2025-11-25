"use client";

import { AppShell } from "@/components/AppShell";
import { PricingCards } from "@/components/marketing/PricingCards";
import { Calculator } from "@/components/pricing/Calculator";
import { UpsellCarousel } from "@/components/pricing/UpsellCarousel";
import { TrialBanner } from "@/components/pricing/TrialBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PricingPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Pricing</p>
          <h1 className="text-3xl font-bold text-white">Pick your velocity</h1>
        </div>

        <TrialBanner />

        <PricingCards />

        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <Card className="border-border/40 bg-slate-950/70">
            <CardHeader>
              <CardTitle>Usage estimator</CardTitle>
            </CardHeader>
            <CardContent>
              <Calculator />
            </CardContent>
          </Card>
          <UpsellCarousel />
        </div>
      </div>
    </AppShell>
  );
}
