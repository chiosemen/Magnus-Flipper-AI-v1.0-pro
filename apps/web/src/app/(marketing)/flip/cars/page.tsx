import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MarketingFeatureBlock,
  MarketingHero,
  MarketingPricingCTA,
  MarketingScreenshots,
  MarketingSEO,
} from "@/components/marketing/shared";

export const metadata: Metadata = {
  title: "Flip Cars with Confidence | Magnus Flipper",
  description: "VIN-aware alerts, radius controls, and price comps for fast car flips.",
  openGraph: {
    title: "Flip Cars with Confidence | Magnus Flipper",
    description: "VIN-aware alerts, radius controls, and price comps for fast car flips.",
    url: "https://magnusflipper.ai/flip/cars",
  },
  alternates: {
    canonical: "https://magnusflipper.ai/flip/cars",
  },
};

export default function CarsPage() {
  return (
    <div className="bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:py-16">
        <MarketingHero
          eyebrow="Car Flips"
          title="VIN-aware alerts for profitable car flips."
          subtitle="Magnus scans marketplaces for your exact trims, surfaces clean VIN data, and alerts you with price comps and local pickup fit."
          highlights={[
            "Trim + drivetrain filters",
            "Radius + metro targeting",
            "Title + condition tagging",
          ]}
          actions={
            <>
              <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                <Link href="/pricing">Start free trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10">
                <Link href="/marketplace">See coverage</Link>
              </Button>
            </>
          }
        />

        <MarketingFeatureBlock
          title="Know the deal before you drive"
          description="VIN-backed intel plus local pickup filters keep you from wasting weekends on dead leads."
          features={[
            { title: "VIN & trim awareness", body: "Surface exact trims, mileage, and drivetrain details instantly." },
            { title: "Radius + metro sweeps", body: "Blend local pickups with metro searches to widen your deal flow." },
            { title: "Title & history cues", body: "Flag salvage, rebuilt, and missing title issues before you DM." },
            { title: "Dealer noise removed", body: "Strip out buy-here-pay-here spam and broker reposts." },
            { title: "Offer guidance", body: "Price comps and target offers so you negotiate faster." },
            { title: "Mobile alerts", body: "Get notified within minutes of a viable listing hitting the feed." },
          ]}
        />

        <MarketingScreenshots
          title="Real-time car alerts with context"
          description="Listings scored by profit potential, with VIN decoded insights, location fit, and contact shortcuts."
          items={[
            { title: "Alert stream", caption: "Fresh cars ranked with mileage, trim, and title notes inline." },
            { title: "Geo fit", caption: "See drive time, radius, and pickup suggestions instantly." },
            { title: "Offer prep", caption: "Suggested offers and resale projections for quick decisions." },
          ]}
        />

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg sm:p-10">
          <div className="space-y-4 sm:flex sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-200/80">Trust the signals</p>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                Speed + accuracy built for car flippers.
              </h2>
              <p className="mt-2 max-w-2xl text-slate-300">
                Magnus ranks each car on margin potential, factoring mileage, trim scarcity, and title status so you
                move on the right vehicles first.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-slate-200 sm:text-base">
              <div className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3">
                <p className="text-xs uppercase text-cyan-200/80">Spam removed</p>
                <p className="text-lg font-semibold text-white">Dealer/broker noise filtered</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3">
                <p className="text-xs uppercase text-cyan-200/80">Alert window</p>
                <p className="text-lg font-semibold text-white">Under 5 minutes</p>
              </div>
            </div>
          </div>
        </section>

        <MarketingPricingCTA
          title="Source your next profitable flip with VIN-aware alerts."
          description="Get marketplace-wide car alerts with price comps and location fit in minutes."
          primaryAction={
            <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
              <Link href="/pricing">Choose a plan</Link>
            </Button>
          }
          secondaryAction={
            <Button asChild size="lg" variant="outline" className="border-white/60 text-white hover:bg-white/10">
              <Link href="/marketplace">View coverage</Link>
            </Button>
          }
        />

        <MarketingSEO
          name="Magnus Flipper — Car Flipping Alerts"
          description="VIN-aware, radius-tuned car flipping alerts with spam filtering and price comps."
          url="https://magnusflipper.ai/flip/cars"
        />
      </div>
    </div>
  );
}
