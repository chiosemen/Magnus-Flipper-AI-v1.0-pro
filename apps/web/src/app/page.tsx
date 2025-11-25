import { Hero } from "@/components/marketing/Hero";
import { FlipValueProps } from "@/components/marketing/FlipValueProps";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { PricingSection } from "@/components/marketing/PricingSection";
import { PricingCalculator } from "@/components/marketing/PricingCalculator";
import { ScreenshotsSection } from "@/components/marketing/ScreenshotsSection";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { CtaSection } from "@/components/marketing/CtaSection";

export default function MarketingHome() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <Hero />
        <FlipValueProps />
        <HowItWorks />
        <ScreenshotsSection />
        <PricingSection />
        <PricingCalculator />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection />
      </div>
    </main>
  );
}
