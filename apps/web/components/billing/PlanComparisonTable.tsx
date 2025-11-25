import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { MostPopularBadge } from "./MostPopularBadge";
import { UpgradeButton } from "./UpgradeButton";

const plans = [
  {
    name: "Starter",
    price: "$19/mo",
    features: ["3 saved searches", "Email alerts", "Daily refresh"],
  },
  {
    name: "Pro",
    price: "$49/mo",
    features: ["15 saved searches", "Push + SMS", "Live scoring", "API access"],
    popular: true,
  },
  {
    name: "Ultra",
    price: "$99/mo",
    features: ["Unlimited searches", "Instant alerts", "Priority crawler", "Team seats"],
  },
];

export function PlanComparisonTable() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((plan) => (
        <Card
          key={plan.name}
          className={`border-border/40 bg-slate-950/70 ${plan.popular ? "border-cyan-500/50 shadow-xl shadow-cyan-500/20" : ""}`}
        >
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle>{plan.name}</CardTitle>
              {plan.popular && <MostPopularBadge />}
            </div>
            <p className="text-sm text-muted-foreground">{plan.price}</p>
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
            <UpgradeButton plan={plan.name} href="/billing" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
