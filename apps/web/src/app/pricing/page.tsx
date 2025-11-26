import type { Metadata } from "next";
import { PricingPageClient } from "@/components/marketing/PricingPageClient";

export const metadata: Metadata = {
  title: "Pricing | Magnus Flipper/Findr",
  description:
    "Choose the right plan for phone, car, and couch flipping alerts. From Starter to Ultra, Magnus Flipper/Findr helps you find profitable marketplace deals fast.",
  openGraph: {
    title: "Pricing | Magnus Flipper/Findr",
    description:
      "Real-time marketplace monitoring for phone, car, and couch flippers. Choose a plan that matches your flipping volume.",
    url: "https://magnusflipper.ai/pricing",
  },
  twitter: {
    card: "summary_large_image",
    title: "Magnus Flipper/Findr Pricing",
    description: "Find flips faster with the right plan for your marketplace volume.",
  },
  alternates: {
    canonical: "https://magnusflipper.ai/pricing",
  },
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 space-y-12">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Pricing for Serious Flippers</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Start with a 7-day free trial. Upgrade only when your flipping volume demands it.
          </p>
        </div>

        <PricingPageClient />

        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: "Magnus Flipper/Findr Subscription Plans",
              description: "Marketplace scanning and alerting for phone, car, and couch flippers.",
              brand: "Magnus Flipper/Findr",
              offers: [
                { "@type": "Offer", name: "Starter", availability: "https://schema.org/InStock" },
                { "@type": "Offer", name: "Basic", availability: "https://schema.org/InStock" },
                { "@type": "Offer", name: "Premium", availability: "https://schema.org/InStock" },
                { "@type": "Offer", name: "Ultra", availability: "https://schema.org/InStock" },
              ],
            }),
          }}
        />
      </div>
    </main>
  );
}
