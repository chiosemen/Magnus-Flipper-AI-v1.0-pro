import type { Metadata } from "next";
import { FlipHero } from "@/components/marketing/FlipHero";
import { FeatureCards } from "@/components/marketing/FeatureCards";
import { PricingCalculator } from "@/components/marketing/PricingCalculator";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { TrialCTA } from "@/components/marketing/TrialCTA";
export const metadata: Metadata = {
  title: "Flip Cars | Magnus Flipper",
  description: "Snipe undervalued cars with instant alerts and spam filtering across key marketplaces.",
  openGraph: {
    title: "Flip Cars | Magnus Flipper",
    description: "Snipe undervalued cars with instant alerts and spam filtering across key marketplaces.",
    url: "https://magnusflipper.ai/flip/cars",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flip Cars | Magnus Flipper",
    description: "Snipe undervalued cars with instant alerts and spam filtering across key marketplaces.",
  },
  alternates: {
    canonical: "https://magnusflipper.ai/flip/cars",
  },
};

export default function FlipCarsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 space-y-12">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Flip Cars</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Snipe undervalued cars with instant alerts and spam filtering across key marketplaces.
          </p>
        </div>

        <FlipHero
          eyebrow="Cars"
          title="Snipe undervalued cars before the crowd."
          subtitle="Magnus monitors auto listings continuously, filters spam, and pings you the second a profitable car appears."
        />

        <FeatureCards
          heading="Why flip cars with Magnus?"
          copy="Fast scans, vehicle-friendly filters, and multi-market coverage."
          items={[
            { title: "VIN + trim targeting", body: "Dial in year, mileage, trims, and exclusions." },
            { title: "Spam cleanup", body: "Hide auctions, rentals, and obvious scams automatically." },
            { title: "Instant alerts", body: "Move first on test drives with near-instant alerts.", tag: "Speed" },
          ]}
        />

        <PricingCalculator />

        <FeatureCards
          heading="Marketplace coverage"
          copy="One feed across Facebook Marketplace, Craigslist, Gumtree, OfferUp."
          items={[
            { title: "Local + regional sweeps", body: "Balance radius to avoid wasted drives." },
            { title: "Condition keywords", body: "Target ‘clean title’, ‘one owner’, ‘no accidents’." },
            { title: "Cadence control", body: "Set faster scans for hot metro areas." },
          ]}
        />

        <ComparisonTable
          heading="Manual searching vs Magnus"
          copy="Stop losing to faster buyers; let alerts do the refresh work."
          rows={[
            { label: "Scan speed", magnus: "2–5 min (plan-based)", competitor: "Manual 15–30 min refresh" },
            { label: "Noise", magnus: "Spam + duplicates filtered", competitor: "Bait posts, repeats, rentals" },
            { label: "Outreach", magnus: "Message first with instant alerts", competitor: "Arrive late to sellers" },
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
              name: "Magnus Flipper Cars",
              description: "Marketplace scanning and alerting for car flippers.",
              brand: "Magnus Flipper",
              offers: [{ "@type": "Offer", availability: "https://schema.org/InStock" }],
            }),
          }}
        />
      </div>
    </main>
  );
}
