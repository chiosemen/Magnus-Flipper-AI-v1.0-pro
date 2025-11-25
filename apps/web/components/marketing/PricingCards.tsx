import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$19",
    period: "mo",
    highlight: "Best for testing flips",
    features: ["3 saved searches", "Email alerts", "Daily refresh"],
    cta: "Start Starter",
    featured: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "mo",
    highlight: "Most popular",
    features: ["15 saved searches", "Push + SMS alerts", "Live scoring", "API access"],
    cta: "Choose Pro",
    featured: true,
  },
  {
    name: "Ultra",
    price: "$99",
    period: "mo",
    highlight: "For full-time resellers",
    features: ["Unlimited searches", "Instant alerts", "Priority crawler", "Team seats"],
    cta: "Go Ultra",
    featured: false,
  },
];

export function PricingCards() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-cyan-200/80">Pricing</p>
        <h2 className="text-3xl font-bold text-white">Choose your flip velocity</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`border-border/40 bg-slate-950/70 ${plan.featured ? "border-cyan-500/50 shadow-xl shadow-cyan-500/20" : ""}`}
          >
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                {plan.featured && (
                  <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-100">
                    Popular
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{plan.highlight}</p>
              <div className="flex items-baseline gap-1 text-3xl font-bold text-white">
                <span>{plan.price}</span>
                <span className="text-base font-normal text-muted-foreground">/{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-cyan-300" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Button variant={plan.featured ? "default" : "outline"} className="w-full">
                {plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
