"use client";

import Link from "next/link";
import { Button } from "../flipbomb/ui/button";

const LovableFeatureShowcase = () => {
  return (
    <section className="relative gradient-hero py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Feature Highlights */}
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Instant Alerts",
                desc: "Get notified the second profitable listings appear — before anyone else.",
              },
              {
                title: "10+ Marketplaces",
                desc: "Monitor Facebook, Gumtree, Vinted, eBay, Craigslist and more from one place.",
              },
              {
                title: "Smart Matching",
                desc: "Our system filters noise and surfaces only deals worth acting on.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur p-8 shadow-soft transition hover:border-accent/30 hover:shadow-card"
              >
                <h3 className="text-xl font-semibold text-foreground">{f.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Marketplace Logos */}
          <div className="mt-20">
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Supported marketplaces
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {[
                "Facebook Marketplace",
                "Gumtree",
                "Vinted",
                "eBay",
                "Craigslist",
                "OfferUp",
                "Depop",
                "Mercari",
                "Nextdoor",
              ].map((name) => (
                <div
                  key={name}
                  className="rounded-lg border border-border/50 bg-card/50 px-5 py-3 text-sm text-foreground/80 hover:border-accent/30 transition-colors"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-24 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Stop searching. Start reacting faster.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Magnus Flipper AI scans marketplaces 24/7 so you never miss the next deal.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register">
                <Button variant="default" size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LovableFeatureShowcase;

