import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { MARKETPLACE_PROFILES } from "../../../marketing-swoopa/data/marketplaces";
import LiveDealsGrid from "../../../marketing-swoopa/components/LiveDealsGrid";
import Header from "../../../marketing-swoopa/components/Header";
import Footer from "../../../marketing-swoopa/components/Footer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MarketplacePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: MarketplacePageProps) {
  const { slug } = await params;
  const marketplace = MARKETPLACE_PROFILES.find((m) => m.slug === slug);

  if (!marketplace) {
    return {
      title: "Marketplace Not Found – Magnus Flipper AI",
    };
  }

  return {
    title: `${marketplace.name} – Live Deals | Magnus Flipper AI`,
    description: `${marketplace.tagline}. Real-time deal intelligence for ${marketplace.name}.`,
  };
}

export default async function MarketplaceDetailPage({
  params,
}: MarketplacePageProps) {
  const { slug } = await params;
  const marketplace = MARKETPLACE_PROFILES.find((m) => m.slug === slug);

  if (!marketplace) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden bg-[#0A0A0A]">
          <div className="absolute inset-0 gradient-hero" />
          <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#00E5FF]/40 to-[#7B2FFF]/40 blur-3xl opacity-30 -translate-y-1/2" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto">
              <Link
                href="/marketplaces"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to all marketplaces
              </Link>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00E5FF]/20 to-[#7B2FFF]/20 rounded-2xl flex items-center justify-center border border-[#00E5FF]/30">
                  <Zap className="w-8 h-8 text-[#00E5FF]" />
                </div>
                <div>
                  <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-2 tracking-tight">
                    {marketplace.name}
                  </h1>
                  <p className="text-white/80 text-lg font-medium">
                    {marketplace.tagline}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-white/70 font-medium">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#00E5FF] animate-pulse" />
                  Live scanning
                </span>
                <span>•</span>
                <span>Refresh: {marketplace.refresh}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Live Deals Section */}
        <section className="py-12 bg-[#0A0A0A]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                Live Deals
              </h2>
              <p className="text-white/70 text-sm font-medium">
                Real-time opportunities from {marketplace.name}
              </p>
            </div>

            <LiveDealsGrid marketplaceSlug={slug} limit={18} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
