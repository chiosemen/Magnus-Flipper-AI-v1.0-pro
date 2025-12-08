"use client";

import { useState } from "react";
import { FileText, Settings, Play, MessageSquare, Check } from "lucide-react";

const steps = [
  {
    id: "apply",
    label: "Apply for Access",
    icon: FileText,
    title: "Apply for Access",
    bullets: [
      "Fill out the application form",
      "Our team will review your request and will be in contact with you",
      "We will arrange an onboarding call to help you get started",
    ],
  },
  {
    id: "configure",
    label: "Configure",
    icon: Settings,
    title: "Configure",
    bullets: [
      "Link your Marketplace Monitor account",
      "Upload your pricing sheet",
      "Enter message templates",
    ],
  },
  {
    id: "activate",
    label: "Activate",
    icon: Play,
    title: "Activate",
    bullets: [
      "Create a search",
      "Link your pricing sheet",
      "Start the search",
    ],
  },
  {
    id: "auto-message",
    label: "Auto-Message",
    icon: MessageSquare,
    title: "Auto-Message",
    bullets: [
      "Instantly validate and message listings",
      "MM Agent runs 24/7 until you stop it",
    ],
  },
];

export const MMAgentProcess = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="user-flow" className="py-20 px-6">
      <div className="container mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-mm-dark text-center mb-16">
          Step-by-Step Process
        </h2>

        {/* Step Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(index)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                activeStep === index
                  ? "bg-mm-primary text-white shadow-lg shadow-mm-primary/30"
                  : "bg-white text-mm-text border border-mm-border hover:border-mm-primary/50"
              }`}
            >
              <step.icon size={16} />
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-mm-border overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Left - Content */}
              <div className="p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-mm-primary rounded-full flex items-center justify-center text-white font-bold">
                    {activeStep + 1}
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-mm-dark">
                    {steps[activeStep].title}
                  </h3>
                </div>

                <ul className="space-y-4">
                  {steps[activeStep].bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-mm-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={12} className="text-mm-accent" />
                      </div>
                      <span className="text-mm-text">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right - Visual */}
              <div className="bg-mm-light p-8 flex items-center justify-center">
                <div className="w-full max-w-xs">
                  <div className="bg-white rounded-xl shadow-lg border border-mm-border p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-mm-primary rounded-lg flex items-center justify-center">
                        {(() => {
                          const Icon = steps[activeStep].icon;
                          return <Icon className="w-5 h-5 text-white" />;
                        })()}
                      </div>
                      <div>
                        <div className="font-heading font-semibold text-mm-dark">
                          {steps[activeStep].title}
                        </div>
                        <div className="text-xs text-mm-text">
                          Step {activeStep + 1} of {steps.length}
                        </div>
                      </div>
                    </div>
                    <div className="h-2 bg-mm-light rounded-full overflow-hidden">
                      <div
                        className="h-full bg-mm-primary rounded-full transition-all duration-500"
                        style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
