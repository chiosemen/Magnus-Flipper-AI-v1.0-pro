import type { Metadata } from "next";
import { FlipHero } from "@/components/marketing/FlipHero";
import { FeatureCards } from "@/components/marketing/FeatureCards";
import { PricingCalculator } from "@/components/marketing/PricingCalculator";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { TrialCTA } from "@/components/marketing/TrialCTA";

export const metadata: Metadata = {
  title: "Flip Phones | Magnus Flipper",
  description: "Catch undervalued phones with instant alerts and spam filtering across top marketplaces.",
  openGraph: {
    title: "Flip Phones | Magnus Flipper",
    description: "Catch undervalued phones with instant alerts and spam filtering across top marketplaces.",
    url: "https://magnusflipper.ai/flip/phones",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flip Phones | Magnus Flipper",
    description: "Catch undervalued phones with instant alerts and spam filtering across top marketplaces.",
  },
  alternates: {
    canonical: "https://magnusflipper.ai/flip/phones",
  },
};

export default function FlipPhonesPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 space-y-12">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Flip Phones</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Catch undervalued phones before anyone else with instant alerts and smart spam filtering.
          </p>
        </div>

        <FlipHero
          eyebrow="Phones"
          title="Catch undervalued phones before anyone else."
          subtitle="Magnus scans marketplaces every few minutes, filters spam, and fires instant alerts so you message first and flip faster."
        />

        <FeatureCards
          heading="Why flip phones with Magnus?"
          copy="Speed, clean signals, and multi-market coverage built for serious phone flippers."
          items={[
            { title: "Instant alerts", body: "Premium scans every ~2 minutes; Ultra is near-instant.", tag: "Speed" },
            { title: "Spam filtering", body: "Hide fakes, duplicates, and bait posts automatically.", tag: "Signal" },
            { title: "Coverage", body: "Facebook Marketplace, Craigslist, Gumtree, OfferUp in one feed.", tag: "Multi-site" },
          ]}
        />

        <PricingCalculator />

        <FeatureCards
          heading="Marketplace coverage"
          copy="Unified feed across the marketplaces that matter for phones."
          items={[
            { title: "Facebook Marketplace", body: "Fastest refresh with geo radius controls." },
            { title: "OfferUp / Gumtree", body: "Regional scans with keyword and price bands." },
            { title: "Craigslist", body: "City-level sweeps with spam filtering baked in." },
          ]}
        />

        <ComparisonTable
          heading="Manual refreshing vs Magnus"
          copy="Stop tab refreshing; let alerts come to you."
          rows={[
            { label: "Scan speed", magnus: "2–3 min (Premium), instant (Ultra)", competitor: "Manual refresh every 10–30 min" },
            { label: "Noise", magnus: "Spam + duplicates filtered", competitor: "Mixed spam, bait posts, repeats" },
            { label: "Response time", magnus: "Message first with instant alerts", competitor: "Sellers see others first" },
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
              name: "Magnus Flipper Phones",
              description: "Marketplace scanning and alerting for phone flippers.",
              brand: "Magnus Flipper",
              offers: [{ "@type": "Offer", availability: "https://schema.org/InStock" }],
            }),
          }}
        />
      </div>
    </main>
  );
}
