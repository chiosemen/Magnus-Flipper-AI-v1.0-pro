"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PRICING_FAQ, type FAQItem } from "@/lib/pricing/constants";

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-zinc-800 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="pr-4 text-base font-medium text-white">
          {item.question}
        </span>
        <svg
          className={cn(
            "h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-96 pb-5" : "max-h-0"
        )}
      >
        <p className="text-sm leading-relaxed text-zinc-400">{item.answer}</p>
      </div>
    </div>
  );
}

interface PricingFAQProps {
  className?: string;
}

export function PricingFAQ({ className }: PricingFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className={cn("py-16 px-6", className)}>
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className="inline-block rounded-full bg-zinc-500/10 px-4 py-1.5 text-sm font-medium text-zinc-400 ring-1 ring-zinc-500/20">
            FAQ
          </span>
          <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-zinc-400">
            Everything you need to know about Magnus Flipper.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-6 backdrop-blur-sm">
          {PRICING_FAQ.map((item, index) => (
            <FAQAccordion
              key={item.question}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

