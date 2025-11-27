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
  title: "Flip Couches & Furniture | Magnus Flipper",
  description: "Local pickup alerts, condition filters, and price comps for furniture flips.",
  openGraph: {
    title: "Flip Couches & Furniture | Magnus Flipper",
    description: "Local pickup alerts, condition filters, and price comps for furniture flips.",
    url: "https://magnusflipper.ai/flip/couches",
  },
  alternates: {
    canonical: "https://magnusflipper.ai/flip/couches",
  },
};

export default function CouchesPage() {
  return (
    <div className="bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:py-16">
        <MarketingHero
          eyebrow="Furniture Flips"
          title="Snipe profitable couches before they vanish."
          subtitle="Magnus prioritizes clean couches, sectionals, and designer pieces with pickup-ready alerts and price history context."
          highlights={[
            "Local pickup tuned",
            "Condition + material tags",
            "Photo-first spam filtering",
          ]}
          actions={
            <>
              <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                <Link href="/pricing">Start free trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10">
                <Link href="/marketplace">See marketplaces</Link>
              </Button>
            </>
          }
        />

        <MarketingFeatureBlock
          title="Filters built for furniture flippers"
          description="Focus on clean inventory with fast pickup potential — not junk on the curb."
          features={[
            { title: "Condition & material", body: "Tag leather, fabric, and sectional layouts with condition cues." },
            { title: "Pickup fit", body: "Filter by distance, stairs likelihood, and vehicle size guidance." },
            { title: "Photo-first scanning", body: "Magnus surfaces real photos and suppresses stock-image spam." },
            { title: "Designer alerts", body: "Prioritize named brands and high-demand silhouettes automatically." },
            { title: "Price anchors", body: "See historical lows and suggested offers to keep margin healthy." },
            { title: "Instant mobile alerts", body: "Get notified within minutes while keeping noise out." },
          ]}
        />

        <MarketingScreenshots
          title="Real-time couch alerts with pickup notes"
          description="See condition tags, pickup fit, and quick-message links — all ranked by resale potential."
          items={[
            { title: "Alert tiles", caption: "Condition, material, and pickup notes in one glance." },
            { title: "Margin view", caption: "Suggested offers and expected resale based on comps." },
            { title: "Route ready", caption: "Distance and vehicle fit hints before you reach out." },
          ]}
        />

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg sm:p-10">
          <div className="space-y-4 sm:flex sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-200/80">Trusted Signals</p>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                Only listings you can actually pick up and profit from.
              </h2>
              <p className="mt-2 max-w-2xl text-slate-300">
                Magnus filters out moldy, broken, or “free, you haul” junk, so your alerts focus on clean inventory worth
                the drive.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-slate-200 sm:text-base">
              <div className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3">
                <p className="text-xs uppercase text-cyan-200/80">Quality filter</p>
                <p className="text-lg font-semibold text-white">90% junk suppressed</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3">
                <p className="text-xs uppercase text-cyan-200/80">Alert speed</p>
                <p className="text-lg font-semibold text-white">Under 5 minutes</p>
              </div>
            </div>
          </div>
        </section>

        <MarketingPricingCTA
          title="Flip couches with cleaner signals and faster alerts."
          description="Run local pickup playbooks with confidence — Magnus keeps your inbox free of junk."
          primaryAction={
            <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
              <Link href="/pricing">Get started</Link>
            </Button>
          }
          secondaryAction={
            <Button asChild size="lg" variant="outline" className="border-white/60 text-white hover:bg-white/10">
              <Link href="/marketplace">See coverage</Link>
            </Button>
          }
        />

        <MarketingSEO
          name="Magnus Flipper — Couch Flipping Alerts"
          description="Local pickup-ready couch flipping alerts with condition filters and price comps."
          url="https://magnusflipper.ai/flip/couches"
        />
      </div>
    </div>
  );
}
