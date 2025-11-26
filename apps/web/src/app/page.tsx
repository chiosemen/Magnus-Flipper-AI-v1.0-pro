import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Magnus Flipper — Instant Marketplace Search & Alerts",
  description: "Real-time alerts, spam filtering, and unified marketplace monitoring for profitable flips.",
  openGraph: {
    title: "Magnus Flipper — Instant Marketplace Search & Alerts",
    description: "Real-time alerts, spam filtering, and unified marketplace monitoring for profitable flips.",
    url: "https://magnusflipper.ai/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Magnus Flipper — Instant Marketplace Search & Alerts",
    description: "Real-time alerts, spam filtering, and unified marketplace monitoring for profitable flips.",
  },
  alternates: {
    canonical: "https://magnusflipper.ai/",
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 space-y-12">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Magnus Flipper</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Real-time alerts, spam filtering, and unified marketplace monitoring for profitable flips.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="w-full sm:w-auto">
              Start 7-day free trial
            </Button>
          </div>
        </div>

        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: "Magnus Flipper",
              description: "Marketplace scanning and alerts for flippers.",
              brand: "Magnus Flipper",
              offers: [{ "@type": "Offer", availability: "https://schema.org/InStock" }],
            }),
          }}
        />
      </div>
    </main>
  );
}
