import type { Metadata } from "next";
import { FlipHero } from "@/components/marketing/FlipHero";
import { FeatureCards } from "@/components/marketing/FeatureCards";
import { PricingCalculator } from "@/components/marketing/PricingCalculator";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { TrialCTA } from "@/components/marketing/TrialCTA";

export const metadata: Metadata = {
  title: "Marketplace Coverage | Magnus Flipper",
  description: "Scan 6+ marketplaces with unified alerts and price discovery.",
  openGraph: {
    title: "Marketplace Coverage | Magnus Flipper",
    description: "Scan 6+ marketplaces with unified alerts and price discovery.",
    url: "https://magnusflipper.ai/marketplace",
  },
  twitter: {
    card: "summary_large_image",
    title: "Marketplace Coverage | Magnus Flipper",
    description: "Scan 6+ marketplaces with unified alerts and price discovery.",
  },
  alternates: {
    canonical: "https://magnusflipper.ai/marketplace",
  },
};

export default function MarketplaceMarketingPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 space-y-12">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Marketplace Coverage</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Scan 6+ marketplaces with unified alerts and price discovery. One feed, every marketplace,
            with real-time spam filtering and deal intelligence.
          </p>
        </div>

        <FlipHero
          eyebrow="Multi-Marketplace Coverage"
          title="One feed. Every marketplace."
          subtitle="Magnus scans across all major platforms and delivers verified alerts instantly."
        />

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground">Covered Marketplaces</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 md:grid-cols-6">
            {["Facebook Marketplace", "OfferUp", "Craigslist", "Gumtree", "Kijiji", "eBay Local"].map(
              (name) => (
                <div
                  key={name}
                  className="rounded-lg border bg-background px-3 py-2 text-center text-sm font-medium text-foreground"
                >
                  {name}
                </div>
              )
            )}
          </div>
        </div>

        <FeatureCards
          heading="Why unify marketplaces with Magnus?"
          copy="Faster alerts, cleaner signals, and one inbox for every platform."
          items={[
            { title: "Unified inbox", body: "One feed for all marketplaces — stop juggling apps." },
            { title: "Instant alerts", body: "Be the first to message sellers when deals appear." },
            { title: "Spam filtering", body: "No rentals, dealers, or bait pricing cluttering your feed." },
            { title: "Deal insights", body: "Auto-detect good vs bad deals based on your preferences." },
          ]}
        />

        <PricingCalculator />

        <FeatureCards
          heading="Advanced tools for power users"
          copy="Dial in your search with richer signals and controls."
          items={[
            { title: "Photo-first scanning", body: "Preview listings fast and skip obvious spam." },
            { title: "Distance & radius controls", body: "Balance metro sweeps with local pickups." },
            { title: "Brand + model filters", body: "Lock onto the exact SKUs and trims you want." },
            { title: "Condition targeting", body: "Set rules for like-new, open-box, or project flips." },
            { title: "Historical pricing context", body: "See whether a listing is priced to move." },
          ]}
        />

        <ComparisonTable
          heading="Manual hunting vs Magnus"
          copy="Upgrade to unified scanning and win deals before the crowd."
          rows={[
            { label: "Scan speed", magnus: "2–5 min (plan-based)", competitor: "Manual refresh every 10–40 min" },
            { label: "Noise", magnus: "Spam + duplicates filtered", competitor: "Bait posts, rentals, dealers" },
            { label: "Coverage", magnus: "6 marketplaces", competitor: "1–2 maximum" },
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
              name: "Magnus Marketplace Scanner",
              description: "Unified marketplace scanning for flipping and reselling.",
              brand: "Magnus Flipper",
              offers: [{ "@type": "Offer", availability: "https://schema.org/InStock" }],
            }),
          }}
        />
      </div>
    </main>
  );
}
