"use client";

import Header from "@swoopa/components/Header";
import Hero from "@swoopa/components/Hero";
import Logos from "@swoopa/components/Logos";
import AnimatedStats from "@swoopa/components/AnimatedStats";
import Features from "@swoopa/components/Features";
import MarketplaceGrid from "@swoopa/components/MarketplaceGrid";
import HowItWorks from "@swoopa/components/HowItWorks";
import Pricing from "@swoopa/components/Pricing";
import Testimonials from "@swoopa/components/Testimonials";
import CTA from "@swoopa/components/CTA";
import Footer from "@swoopa/components/Footer";
import SEOHead from "@swoopa/components/SEOHead";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <SEOHead />
      <Header />
      <main>
        <Hero />
        <AnimatedStats />
        <Logos />
        <Features />
        <MarketplaceGrid />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
