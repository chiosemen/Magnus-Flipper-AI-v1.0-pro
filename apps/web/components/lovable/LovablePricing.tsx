"use client";

import { Button } from "../flipbomb/ui/button";
import { Check, Zap } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "9",
    description: "Perfect for casual flippers getting started",
    features: [
      "5 active search alerts",
      "3 marketplace integrations",
      "Daily email digest",
      "Basic spam filtering",
      "7-day search history",
    ],
    popular: false,
  },
  {
    name: "Pro",
    price: "29",
    description: "For serious flippers who want an edge",
    features: [
      "25 active search alerts",
      "All marketplace integrations",
      "Instant push notifications",
      "Advanced AI spam filtering",
      "30-day search history",
      "Priority support",
      "Price tracking & alerts",
    ],
    popular: true,
  },
  {
    name: "Business",
    price: "79",
    description: "For teams and power users",
    features: [
      "Unlimited search alerts",
      "All marketplace integrations",
      "Instant push notifications",
      "Enterprise AI filtering",
      "Unlimited search history",
      "24/7 priority support",
      "Price tracking & analytics",
      "Team collaboration tools",
      "API access",
    ],
    popular: false,
  },
];

const LovablePricing = () => {
  return (
    <section id="pricing" className="py-20 lg:py-32 gradient-hero relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-4">
            <span className="text-sm font-medium text-accent">Simple Pricing</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Choose Your{" "}
            <span className="text-gradient">Perfect Plan</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Start with a 7-day free trial. No credit card required.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-card rounded-2xl p-6 lg:p-8 shadow-card border transition-all duration-300 hover:shadow-elevated ${
                plan.popular
                  ? "border-accent ring-2 ring-accent/20 scale-[1.02] lg:scale-105"
                  : "border-border/50"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="inline-flex items-center gap-1 px-4 py-1.5 gradient-accent rounded-full text-sm font-semibold text-accent-foreground shadow-glow">
                    <Zap className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-4xl lg:text-5xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-accent" />
                    </div>
                    <span className="text-muted-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href="/register">
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full"
                  size="lg"
                >
                  Start Free Trial
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LovablePricing;

