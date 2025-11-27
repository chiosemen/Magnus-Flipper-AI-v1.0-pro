import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  HeroSection,
  SocialProofStrip,
  FeatureGridSection,
  UseCaseSection,
  HowItWorksSection,
  PricingPreviewSection,
  FAQSection,
  FooterSection,
} from "@/components/marketing/shared";
import { isDemoMode } from "@/lib/config/demo-mode";

export const metadata: Metadata = {
  title: "Magnus Flipper/Findr – Instant Marketplace Search & Alerts for Serious Flippers",
  description:
    "Track deals across Facebook Marketplace, Craigslist, OfferUp, and more. Built for phone, car, and couch flippers who want to see opportunities before casual buyers.",
  openGraph: {
    title: "Magnus Flipper/Findr",
    description: "Instant marketplace alerts for serious flippers.",
    url: "https://flipperagents.com",
    siteName: "Magnus Flipper/Findr",
    type: "website",
  },
};

export default function HomePage() {
  const demo = isDemoMode();
  const badges = ["Facebook Marketplace", "Craigslist", "OfferUp", "Gumtree", "Kijiji", "eBay Local"];
  if (demo) badges.unshift("LIVE DEMO — Sample Listings");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 lg:px-8 sm:py-16">
        <HeroSection
          title="Your instant marketplace co-pilot for profitable flips."
          subtitle="Magnus Flipper (Findr) scans marketplaces every few minutes, filters junk, and routes you only the deals you can win — phones, cars, couches, and more."
          badges={badges}
          primaryCta={{ label: "Start 7-day free trial", href: "/pricing" }}
          secondaryCta={{ label: "View live demo", href: "#how-it-works" }}
        />

        <SocialProofStrip
          headline="Built for serious flippers, not hobby scrollers."
          items={["Phone resellers", "Car traders", "Sofa flippers", "Local pickup pros", "Online arbitrage teams"]}
        />

        <FeatureGridSection
          title="Why flippers choose Magnus"
          description="Speed, precision, and noise reduction across every marketplace you care about."
          features={[
            { title: "Instant cross-marketplace search", description: "Scan multiple platforms at once with one query." },
            { title: "Saved searches with precise filters", description: "Dial in price, distance, SKU, and condition." },
            { title: "Real-time alerts to inbox & mobile", description: "Get notified within minutes, not hours." },
            { title: "Noise reduction & spam filtering", description: "Strip out rentals, dealers, and bait pricing." },
          ]}
        />

        <UseCaseSection
          title="Built for your flipping playbook"
          description="Three core verticals — tuned signals and playbooks for each."
          items={[
            {
              title: "Phones",
              description: "SKU-aware alerts with carrier, storage, and condition filters.",
              bullets: ["2–5 min latency", "Spam & refurb filters", "Deal scores & comps"],
              href: "/flip/phones",
            },
            {
              title: "Cars",
              description: "VIN-aware signals with radius sweeps and title visibility.",
              bullets: ["Trim + drivetrain tagging", "Dealer/broker suppression", "Offer guidance"],
              href: "/flip/cars",
            },
            {
              title: "Couches",
              description: "Local pickup-ready alerts with condition and material filters.",
              bullets: ["Photo-first filtering", "Pickup fit hints", "Designer brand prioritization"],
              href: "/flip/couches",
            },
          ]}
        />

        <HowItWorksSection
          title="How Magnus works"
          steps={[
            { title: "Set your filters", body: "Define price, distance, keywords, condition, and SKUs." },
            { title: "We scan 24/7", body: "Crawlers sweep every marketplace, filtering spam and bait posts." },
            { title: "You get alerts first", body: "Alerts route to your inbox and mobile before casual buyers see them." },
          ]}
        />

        <PricingPreviewSection
          title="Plans for every volume"
          tiers={[
            { name: "Starter", blurb: "Up to 3 saved searches, 50 alerts/day", highlight: "Best for new flippers" },
            { name: "Basic", blurb: "Up to 8 saved searches, 150 alerts/day" },
            { name: "Premium", blurb: "Up to 20 saved searches, 400 alerts/day", highlight: "Most popular" },
            { name: "Ultra", blurb: "Unlimited saved searches, priority crawling" },
          ]}
          ctaHref="/pricing"
          ctaLabel="Compare all plans"
        />

        <FAQSection
          title="FAQ"
          faqs={[
            {
              question: "Which marketplaces do you support?",
              answer: "Facebook Marketplace, Craigslist, OfferUp, Gumtree, Kijiji, and eBay Local with more coming.",
            },
            {
              question: "Is this allowed by marketplace terms?",
              answer:
                "We respect platform limits and throttle responsibly. You control filters and pacing to stay compliant.",
            },
            { question: "Can I cancel any time?", answer: "Yes. Cancel anytime inside settings with no lock-in." },
            {
              question: "How does the 7-day trial work?",
              answer: "Start any plan, test alerts and filters for 7 days, cancel anytime during the trial.",
            },
          ]}
        />

        <FooterSection
          links={[
            { label: "Pricing", href: "/pricing" },
            { label: "Marketplace coverage", href: "/marketplace" },
            { label: "Flip phones", href: "/flip/phones" },
            { label: "Flip cars", href: "/flip/cars" },
            { label: "Flip couches", href: "/flip/couches" },
            { label: "Settings", href: "/settings" },
          ]}
        />
      </div>
    </main>
  );
}
