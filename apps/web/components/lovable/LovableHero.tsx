"use client";

import { Button } from "../flipbomb/ui/button";
import { Search, Bell, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

const LovableHero = () => {
  return (
    <section className="relative min-h-screen gradient-hero pt-20 lg:pt-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center pt-12 lg:pt-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-6 animate-fade-up">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse-slow" />
            <span className="text-sm font-medium text-accent">#1 Marketplace Monitoring Tool</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Instant Marketplace{" "}
            <span className="text-gradient">Alerts</span>.{" "}
            <br className="hidden sm:block" />
            Every Time.
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Magnus Flipper AI tracks listings across Gumtree, Facebook Marketplace, Vinted & more — get instant notifications on profitable items before anyone else.
          </p>

          {/* Search Demo */}
          <div className="max-w-xl mx-auto mb-8 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <div className="relative">
              <div className="flex items-center bg-card rounded-2xl shadow-card border border-border/50 p-2">
                <div className="flex-1 flex items-center gap-3 px-4">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="What are you looking for? e.g., iPhone 15, Nintendo Switch..."
                    className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground py-3"
                    readOnly
                  />
                </div>
                <Link href="/register">
                  <Button variant="default" size="lg" className="shrink-0">
                    Create Alert
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent" />
              <span>Real-time alerts</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <span>10+ marketplaces</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-muted border-2 border-card"
                    style={{ backgroundColor: `hsl(${200 + i * 20} 60% ${50 + i * 5}%)` }}
                  />
                ))}
              </div>
              <span>2,500+ active users</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LovableHero;

