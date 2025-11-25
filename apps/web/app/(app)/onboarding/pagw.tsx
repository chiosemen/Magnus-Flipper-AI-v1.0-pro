"use client";

import { AppShell } from "@/components/AppShell";
import { StepIntro } from "@/components/onboarding/StepIntro";
import { StepConnectMarketplaces } from "@/components/onboarding/StepConnectMarketplaces";
import { StepFirstSearch } from "@/components/onboarding/StepFirstSearch";
import { StepSuccess } from "@/components/onboarding/StepSuccess";
import { useState } from "react";

const STEPS = ["intro", "connect", "search", "done"] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("intro");

  const next = () => {
    const idx = STEPS.indexOf(step);
    setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]);
  };
  const back = () => {
    const idx = STEPS.indexOf(step);
    setStep(STEPS[Math.max(0, idx - 1)]);
  };

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {step === "intro" && <StepIntro onNext={next} />}
        {step === "connect" && <StepConnectMarketplaces onNext={next} onBack={back} />}
        {step === "search" && <StepFirstSearch onNext={next} onBack={back} />}
        {step === "done" && <StepSuccess />}
      </div>
    </AppShell>
  );
}
