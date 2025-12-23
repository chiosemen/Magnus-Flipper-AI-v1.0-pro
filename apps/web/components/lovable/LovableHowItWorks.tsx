"use client";

import { UserPlus, Search, Bell, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Your Account",
    description: "Sign up for a free trial and set up your profile in under a minute. No credit card required.",
  },
  {
    icon: Search,
    step: "02",
    title: "Set Up Your Searches",
    description: "Define what you're looking for, choose your marketplaces, and set your price range and location.",
  },
  {
    icon: Bell,
    step: "03",
    title: "Get Instant Alerts",
    description: "Receive push notifications the moment a matching listing appears. Be the first to respond.",
  },
  {
    icon: TrendingUp,
    step: "04",
    title: "Flip & Profit",
    description: "Find undervalued items, secure the deal, and maximize your profit potential.",
  },
];

const LovableHowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 lg:py-32 gradient-hero relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <span className="text-sm font-medium text-primary">How It Works</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Start Flipping in{" "}
            <span className="text-gradient">Minutes</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Getting started with Magnus Flipper AI is quick and easy. Here's how it works.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {steps.map((step, index) => (
            <div key={step.step} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-14 left-[60%] w-full h-0.5 bg-gradient-to-r from-accent/50 to-accent/10" />
              )}

              <div className="text-center">
                {/* Step number */}
                <div className="relative inline-block mb-6">
                  <div className="w-28 h-28 rounded-2xl bg-card shadow-card border border-border/50 flex items-center justify-center mx-auto">
                    <step.icon className="w-12 h-12 text-accent" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-sm font-bold text-accent-foreground shadow-glow">
                    {step.step}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LovableHowItWorks;

