import type { Metadata } from "next";
import { FlipHero } from "@/components/marketing/FlipHero";
import { FeatureCards } from "@/components/marketing/FeatureCards";
import { PricingCalculator } from "@/components/marketing/PricingCalculator";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { TrialCTA } from "@/components/marketing/TrialCTA";
export const metadata: Metadata = {
  title: "Flip Couches | Magnus Flipper",
  description: "Turn couches into quick flips with instant alerts across top marketplaces.",
  openGraph: {
    title: "Flip Couches | Magnus Flipper",
    description: "Turn couches into quick flips with instant alerts across top marketplaces.",
    url: "https://magnusflipper.ai/flip/couches",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flip Couches | Magnus Flipper",
    description: "Turn couches into quick flips with instant alerts across top marketplaces.",
  },
  alternates: {
    canonical: "https://magnusflipper.ai/flip/couches",
  },
};

export default function FlipCouchesPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 space-y-12">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Flip Couches</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Turn couches into quick flips with instant alerts across top marketplaces.
          </p>
        </div>

        <FlipHero
          eyebrow="Couches"
          title="Turn couches into quick flips with real-time alerts."
          subtitle="Magnus watches the marketplaces nonstop, filters spam, and pings you when quality sofas appear nearby."
        />

        <FeatureCards
          heading="Why flip couches with Magnus?"
          copy="Less scrolling, more profitable pickups."
          items={[
            { title: "Condition targeting", body: "Keywords for ‘like new’, ‘no pets’, ‘smoke free’ keep quality high." },
            { title: "Radius controls", body: "Focus on drivable pickups with tight distance filters." },
            { title: "Fast alerts", body: "Message sellers first and secure pickup windows.", tag: "Speed" },
          ]}
        />

        <PricingCalculator />

        <FeatureCards
          heading="Marketplace coverage"
          copy="Unified feed across Facebook Marketplace, OfferUp, Craigslist, Gumtree."
          items={[
            { title: "Brand filters", body: "Search for West Elm, Article, IKEA, and more." },
            { title: "Photo-first browsing", body: "Preview quickly, skip obvious spam." },
            { title: "Cadence tuning", body: "Increase scan speed for hot metro areas." },
          ]}
        />

        <ComparisonTable
          heading="Manual searching vs Magnus"
          copy="Stop refreshing; let alerts bring the best sofas to you."
          rows={[
            { label: "Scan speed", magnus: "2–5 min (plan-based)", competitor: "Manual refresh every 20–40 min" },
            { label: "Noise", magnus: "Spam + duplicates filtered", competitor: "Reposts, bait pricing, rentals" },
            { label: "Pickups", magnus: "Secure slots before others see it", competitor: "Late to message sellers" },
          ]}
        />

        <TrialCTA />

        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: "Magnus Flipper Couches",
              description: "Marketplace scanning and alerting for couch flippers.",
              brand: "Magnus Flipper",
              offers: [{ "@type": "Offer", availability: "https://schema.org/InStock" }],
            }),
          }}
        />
      </div>
    </main>
  );
}
