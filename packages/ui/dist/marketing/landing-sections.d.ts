import * as React from 'react';
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
export declare function HeroSection({ title, subtitle, badges, primaryCta, secondaryCta, }: HeroSectionProps): import("react/jsx-runtime").JSX.Element;
type SocialProofStripProps = {
    headline: string;
    items: string[];
};
export declare function SocialProofStrip({ headline, items }: SocialProofStripProps): import("react/jsx-runtime").JSX.Element;
type Feature = {
    title: string;
    description: string;
    icon?: React.ReactNode;
};
type FeatureGridSectionProps = {
    title: string;
    description: string;
    features: Feature[];
};
export declare function FeatureGridSection({ title, description, features }: FeatureGridSectionProps): import("react/jsx-runtime").JSX.Element;
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
export declare function UseCaseSection({ title, description, items }: UseCaseSectionProps): import("react/jsx-runtime").JSX.Element;
type HowItWorksStep = {
    title: string;
    body: string;
};
type HowItWorksSectionProps = {
    title: string;
    steps: HowItWorksStep[];
};
export declare function HowItWorksSection({ title, steps }: HowItWorksSectionProps): import("react/jsx-runtime").JSX.Element;
type PricingTier = {
    name: string;
    blurb: string;
    highlight?: string;
};
type PricingPreviewSectionProps = {
    title: string;
    tiers: PricingTier[];
    ctaHref: string;
    ctaLabel: string;
};
export declare function PricingPreviewSection({ title, tiers, ctaHref, ctaLabel }: PricingPreviewSectionProps): import("react/jsx-runtime").JSX.Element;
type FAQ = {
    question: string;
    answer: string;
};
type FAQSectionProps = {
    title: string;
    faqs: FAQ[];
};
export declare function FAQSection({ title, faqs }: FAQSectionProps): import("react/jsx-runtime").JSX.Element;
type FooterLink = {
    label: string;
    href: string;
};
type FooterSectionProps = {
    links: FooterLink[];
};
export declare function FooterSection({ links }: FooterSectionProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=landing-sections.d.ts.map