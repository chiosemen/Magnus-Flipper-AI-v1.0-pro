import * as React from 'react';
import { CheckCircle2, Radar, Zap, Shield, Sparkles, BellRing } from 'lucide-react';

type CTAProps = {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
};

type HeroSectionProps = {
  title: string;
  subtitle: string;
  badges?: string[];
  primaryCta?: CTAProps;
  secondaryCta?: CTAProps;
};

export function HeroSection({
  title,
  subtitle,
  badges = [],
  primaryCta,
  secondaryCta,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-500 to-cyan-400 px-6 py-12 text-white shadow-2xl sm:px-10 sm:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%)]" />
      <div className="relative space-y-6">
        <div className="space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            Instant marketplace alerts
          </p>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{title}</h1>
          <p className="max-w-3xl text-base text-white/90 sm:text-lg">{subtitle}</p>
        </div>
        {badges.length ? (
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-3">
          {primaryCta ? (
            <a
              href={primaryCta.href}
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:translate-y-[1px] hover:shadow-xl"
            >
              {primaryCta.label}
            </a>
          ) : null}
          {secondaryCta ? (
            <a
              href={secondaryCta.href}
              className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              {secondaryCta.label}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

type SocialProofStripProps = {
  headline: string;
  items: string[];
};

export function SocialProofStrip({ headline, items }: SocialProofStripProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-6 shadow-lg sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-200">{headline}</p>
        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wide text-slate-400">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-slate-800/80 px-3 py-1 font-semibold text-slate-200"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

type Feature = { title: string; description: string; icon?: React.ReactNode };

type FeatureGridSectionProps = {
  title: string;
  description: string;
  features: Feature[];
};

export function FeatureGridSection({ title, description, features }: FeatureGridSectionProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
        <p className="text-slate-300">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-inner transition hover:-translate-y-1 hover:border-cyan-300/50 hover:shadow-cyan-500/20"
          >
            <div className="flex items-center gap-2 text-cyan-200">
              {feature.icon || <Sparkles className="h-5 w-5" />}
              <h3 className="text-base font-semibold text-white">{feature.title}</h3>
            </div>
            <p className="text-sm text-slate-300">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

type UseCase = {
  title: string;
  description: string;
  bullets: string[];
  href: string;
};

type UseCaseSectionProps = {
  title: string;
  description: string;
  items: UseCase[];
};

export function UseCaseSection({ title, description, items }: UseCaseSectionProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
        <p className="text-slate-300">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-inner"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="text-sm text-slate-300">{item.description}</p>
            </div>
            <ul className="space-y-2 text-sm text-slate-200">
              {item.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <a
              href={item.href}
              className="inline-flex items-center justify-center rounded-full border border-cyan-300/60 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-400/20"
            >
              See workflow
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

type HowItWorksStep = { title: string; body: string };

type HowItWorksSectionProps = {
  title: string;
  steps: HowItWorksStep[];
};

export function HowItWorksSection({ title, steps }: HowItWorksSectionProps) {
  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg sm:p-10">
      <h2 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step, idx) => (
          <div key={step.title} className="relative rounded-2xl border border-white/10 bg-slate-950/70 p-5">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-base font-semibold text-cyan-100">
              {idx + 1}
            </div>
            <h3 className="text-lg font-semibold text-white">{step.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

type PricingTier = { name: string; blurb: string; highlight?: string };

type PricingPreviewSectionProps = {
  title: string;
  tiers: PricingTier[];
  ctaHref: string;
  ctaLabel: string;
};

export function PricingPreviewSection({ title, tiers, ctaHref, ctaLabel }: PricingPreviewSectionProps) {
  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-lg sm:p-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
          <p className="text-sm text-slate-300">Choose the plan that matches your daily deal volume.</p>
        </div>
        <a
          href={ctaHref}
          className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow hover:translate-y-[1px]"
        >
          {ctaLabel}
        </a>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-inner"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-300" />
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-100">{tier.name}</p>
            </div>
            <p className="text-sm text-slate-300">{tier.blurb}</p>
            {tier.highlight ? (
              <span className="inline-flex w-fit rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-100">
                {tier.highlight}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

type FAQ = { question: string; answer: string };

type FAQSectionProps = {
  title: string;
  faqs: FAQ[];
};

export function FAQSection({ title, faqs }: FAQSectionProps) {
  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg sm:p-10">
      <h2 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
      <div className="space-y-4">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-2xl border border-white/10 bg-slate-950/70 p-4 transition hover:border-cyan-300/40"
          >
            <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-white">
              {faq.question}
              <span className="text-xs text-cyan-200 transition group-open:rotate-180">⌄</span>
            </summary>
            <p className="mt-2 text-sm text-slate-300">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

type FooterLink = { label: string; href: string };

type FooterSectionProps = {
  links: FooterLink[];
};

export function FooterSection({ links }: FooterSectionProps) {
  return (
    <footer className="mt-12 border-t border-white/10 bg-slate-950/80 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">Magnus Flipper / Findr</p>
          <p className="text-xs text-slate-400">Marketplace alerts for serious flippers.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-slate-300">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 transition hover:border-cyan-300/60 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="text-xs text-slate-500">
          © {new Date().getFullYear()} Magnus Flipper. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
