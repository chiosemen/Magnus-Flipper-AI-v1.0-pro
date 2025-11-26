"use client";

import { useState } from "react";
import { WizardShell } from "@/components/searches/wizard/WizardShell";
import { WizardStepCategory } from "@/components/searches/wizard/WizardStepCategory";
import { WizardStepMarketplace } from "@/components/searches/wizard/WizardStepMarketplace";
import { WizardStepKeywords } from "@/components/searches/wizard/WizardStepKeywords";
import { WizardStepFilters } from "@/components/searches/wizard/WizardStepFilters";
import { WizardStepFrequency } from "@/components/searches/wizard/WizardStepFrequency";
import { WizardStepNotifications } from "@/components/searches/wizard/WizardStepNotifications";
import { WizardStepReview } from "@/components/searches/wizard/WizardStepReview";

const steps = [
  "category",
  "marketplace",
  "keywords",
  "filters",
  "frequency",
  "notifications",
  "review",
] as const;

type Step = (typeof steps)[number];

export default function NewSearchWizardPage() {
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<string | null>(null);
  const [marketplaces, setMarketplaces] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [filters, setFilters] = useState<{ minPrice?: number; maxPrice?: number; radius?: number }>({
    radius: 25,
  });
  const [frequency, setFrequency] = useState("3");
  const [notifications, setNotifications] = useState<string[]>(["web"]);

  const currentIndex = steps.indexOf(step);
  const next = () => setStep(steps[Math.min(currentIndex + 1, steps.length - 1)]);

  const handleSubmit = () => {
    // Submission to API would go here; for now we simply acknowledge.
    alert("Saved search created (demo).");
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-16 pt-10 text-slate-50 sm:px-6 lg:px-8">
      <WizardShell currentStep={currentIndex}>
        {step === "category" && (
          <WizardStepCategory value={category} onChange={setCategory} onNext={() => category && next()} />
        )}
        {step === "marketplace" && (
          <WizardStepMarketplace value={marketplaces} onChange={setMarketplaces} onNext={next} />
        )}
        {step === "keywords" && (
          <WizardStepKeywords value={keywords} onChange={setKeywords} onNext={next} />
        )}
        {step === "filters" && (
          <WizardStepFilters filters={filters} onChange={setFilters} onNext={next} />
        )}
        {step === "frequency" && (
          <WizardStepFrequency value={frequency} onChange={setFrequency} onNext={next} />
        )}
        {step === "notifications" && (
          <WizardStepNotifications value={notifications} onChange={setNotifications} onNext={next} />
        )}
        {step === "review" && (
          <WizardStepReview
            data={{ category, marketplaces, keywords, filters, frequency, notifications }}
            onSubmit={handleSubmit}
          />
        )}
      </WizardShell>
    </main>
  );
}
