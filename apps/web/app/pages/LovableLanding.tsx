"use client";

import LovableHeader from "../../components/lovable/LovableHeader";
import LovableHero from "../../components/lovable/LovableHero";
import LovableFeatureShowcase from "../../components/lovable/LovableFeatureShowcase";
import LovableFeatures from "../../components/lovable/LovableFeatures";
import LovableHowItWorks from "../../components/lovable/LovableHowItWorks";
import LovablePricing from "../../components/lovable/LovablePricing";
import LovableFooter from "../../components/lovable/LovableFooter";

const LovableLanding = () => {
  return (
    <div className="min-h-screen bg-background">
      <LovableHeader />
      <main>
        <LovableHero />
        <LovableFeatureShowcase />
        <LovableFeatures />
        <LovableHowItWorks />
        <LovablePricing />
      </main>
      <LovableFooter />
    </div>
  );
};

export default LovableLanding;

