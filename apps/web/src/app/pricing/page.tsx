import type { Metadata } from "next";
import { PricingContent } from "@/components/pricing/PricingContent";
import { isDemoMode } from "@/lib/config/demo-mode";

export const metadata: Metadata = {
  title: "Pricing — Magnus Flipper/Findr",
  description: "Choose the perfect plan for your flipping business.",
};

export default function PricingPage() {
  const demo = isDemoMode();
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6 lg:px-8 sm:py-16">
        <PricingContent demo={demo} />

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
