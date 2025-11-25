import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PlanId = "STARTER" | "BASIC" | "PREMIUM" | "ULTRA";

interface Plan {
  id: PlanId;
  name: string;
  price: string;
  tagline: string;
  searches: string;
  findTime: string;
  bestFor: string;
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "STARTER",
    name: "Starter",
    price: "£9.99",
    tagline: "Kickstart your flipping journey.",
    searches: "1 saved search",
    findTime: "Every 5 minutes",
    bestFor: "New flippers learning the game.",
  },
  {
    id: "BASIC",
    name: "Basic",
    price: "£19.99",
    tagline: "Beat casual competition.",
    searches: "3 saved searches",
    findTime: "Every 3 minutes",
    bestFor: "Side-hustlers doing regular flips.",
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: "£39.99",
    tagline: "Operate like a small flipping shop.",
    searches: "5 saved searches",
    findTime: "Every 2 minutes",
    bestFor: "Serious part-time resellers.",
    highlight: true,
  },
  {
    id: "ULTRA",
    name: "Ultra",
    price: "£69.99",
    tagline: "Full-time, multi-category domination.",
    searches: "10 saved searches",
    findTime: "Instant scanning",
    bestFor: "Full-time operators & teams.",
  },
];

export function PricingSection() {
  return (
    <section className="space-y-8">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Powerful alerts at half the usual price</h2>
        <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
          Marketplace Monitor-level power without the heavy subscription. Pick a plan that matches your flipping
          ambition — every plan includes spam filtering, unified feed and real-time alerts.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col border-slate-800 bg-slate-950/80 ${
              plan.highlight ? "ring-2 ring-cyan-400/80 shadow-xl shadow-cyan-900/40" : "shadow-md shadow-black/40"
            }`}
          >
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{plan.name}</h3>
                {plan.highlight && (
                  <Badge className="bg-cyan-500 text-[10px] font-semibold uppercase tracking-wide text-slate-950">
                    Most popular
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-300">{plan.tagline}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{plan.price}</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 text-xs text-slate-300">
              <div className="rounded-md bg-slate-900/70 p-3">
                <div className="flex justify-between">
                  <span>No. of searches</span>
                  <span className="font-semibold text-slate-50">{plan.searches}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span>Find time*</span>
                  <span className="font-semibold text-slate-50">{plan.findTime}</span>
                </div>
              </div>
              <ul className="space-y-1">
                <li>✓ Smart spam filtering</li>
                <li>✓ Multi-market monitoring</li>
                <li>✓ Unified results feed</li>
                <li>✓ Alert history & stats</li>
              </ul>
              <p className="text-[10px] text-slate-500">
                *Average alert time. Actual speed depends on marketplace limits.
              </p>
            </CardContent>
            <CardFooter className="mt-2 flex flex-col gap-2">
              <Button className="w-full rounded-full text-sm font-semibold">Start 7-day free trial</Button>
              <p className="text-center text-[10px] text-slate-500">Upgrade or cancel anytime. No hidden fees.</p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
