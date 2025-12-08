"use client";

import Header from "../components/Header";
import Hero from "../components/Hero";
import Logos from "../components/Logos";
import AnimatedStats from "../components/AnimatedStats";
import Features from "../components/Features";
import MarketplaceGrid from "../components/MarketplaceGrid";
import HowItWorks from "../components/HowItWorks";
import Pricing from "../components/Pricing";
import Testimonials from "../components/Testimonials";
import CTA from "../components/CTA";
import Footer from "../components/Footer";
import SEOHead from "../components/SEOHead";

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
