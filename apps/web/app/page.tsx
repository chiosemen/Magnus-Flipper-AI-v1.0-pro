"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

// Fake deal ticker data
const sampleDeals = [
  { title: "iPhone 13 – £220 → £340", profit: "+£120" },
  { title: "MacBook Pro 2019 – £380 → £560", profit: "+£180" },
  { title: "PS5 Bundle – £310 → £420", profit: "+£110" },
  { title: "Yeezy Slides – £22 → £60", profit: "+£38" },
];

export default function LandingPage() {
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setTickerIndex((i) => (i + 1) % sampleDeals.length),
      2400
    );
    return () => clearInterval(interval);
  }, []);

  const currentDeal = sampleDeals[tickerIndex];

  return (
    <main className="min-h-screen w-full bg-black text-white">
      {/* Sticky Navbar */}
      <div className="fixed top-0 left-0 w-full bg-black/70 backdrop-blur-sm z-50 border-b border-neutral-900">
        <nav className="max-w-6xl mx-auto flex items-center justify-between py-4 px-6">
          <div className="text-xl font-bold tracking-wide">Magnus Flipper</div>
          <div className="flex gap-6">
            <Link href="/login" className="text-neutral-400 hover:text-white">
              Login
            </Link>
            <Link
              href="/upgrade"
              className="px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-neutral-200 transition"
            >
              Pricing
            </Link>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="pt-40 pb-24 flex flex-col items-center text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-7xl font-extrabold bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent"
        >
          The Real-Time
          <br />
          Arbitrage Engine.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-lg md:text-xl text-neutral-400 max-w-2xl"
        >
          Find underpriced deals across every marketplace — analysed by Magnus
          AI with real profit projections. Like Swoopa, but turbocharged.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex gap-4"
        >
          <Link
            href="/login"
            className="px-8 py-3 rounded-xl bg-white text-black text-lg font-semibold hover:bg-neutral-200 transition"
          >
            Get Started
          </Link>
          <Link
            href="/upgrade"
            className="px-8 py-3 rounded-xl border border-neutral-700 text-lg hover:border-neutral-500 transition"
          >
            Pricing
          </Link>
        </motion.div>
      </section>

      {/* Deal Ticker */}
      <div className="w-full bg-neutral-950 border-y border-neutral-900 py-4">
        <motion.div
          key={tickerIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center text-neutral-300 text-lg"
        >
          🔥 {currentDeal.title} <span className="text-green-400">{currentDeal.profit}</span>
        </motion.div>
      </div>

      {/* Marketplaces Row */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-neutral-400 text-sm uppercase tracking-widest text-center mb-8">
          Scanning marketplaces
        </h2>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-6 justify-center opacity-70">
          {["Amazon", "eBay", "Facebook", "Gumtree", "Vinted", "Craigslist"].map(
            (mkt) => (
              <div
                key={mkt}
                className="text-center py-3 border border-neutral-900 rounded-lg text-neutral-400 text-sm"
              >
                {mkt}
              </div>
            )
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 max-w-6xl mx-auto pb-24">
        <FeatureCard
          title="Live Deal Scanner"
          text="Real-time monitoring of all major marketplaces with instant AI alerts."
        />
        <FeatureCard
          title="Profit Engine"
          text="Magnus AI scores every flip, calculates margins, and ranks opportunities."
        />
        <FeatureCard
          title="Trader Dashboard"
          text="Track ROI, deal-flow, and performance like a professional arbitrageur."
        />
      </section>

      {/* Pricing Section */}
      <section className="bg-neutral-950 py-24 px-6">
        <h2 className="text-center text-4xl font-bold mb-12">
          Simple, transparent pricing.
        </h2>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <PricingCard
            title="Starter"
            price="Free"
            features={["Basic marketplace access", "Daily scans", "Limited alerts"]}
          />
          <PricingCard
            title="Pro"
            price="£19/mo"
            highlight
            features={[
              "Unlimited scanning",
              "AI profit engine",
              "Deal prioritisation",
              "Pro dashboard",
            ]}
          />
          <PricingCard
            title="Agency"
            price="£49/mo"
            features={[
              "Bulk analysis",
              "Webhook integrations",
              "Team access",
              "Advanced reporting",
            ]}
          />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <h2 className="text-center text-3xl font-bold mb-12">
          Loved by real flippers.
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Testimonial
            name="James"
            text="Found £800 profit in my first week — insane tool."
          />
          <Testimonial
            name="Sarah"
            text="The live scanner alone is worth the subscription."
          />
          <Testimonial
            name="Omar"
            text="Replaced all my manual scouting. AI is ridiculously accurate."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="pb-10 text-neutral-600 text-sm text-center">
        Magnus Flipper © {new Date().getFullYear()}
      </footer>
    </main>
  );
}

/* --- COMPONENTS --- */

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="p-8 border border-neutral-900 rounded-xl bg-neutral-950/40">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-neutral-400 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function PricingCard({
  title,
  price,
  features,
  highlight,
}: {
  title: string;
  price: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-8 rounded-xl border ${
        highlight
          ? "border-white bg-white text-black shadow-xl scale-105"
          : "border-neutral-800 bg-neutral-900"
      }`}
    >
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-4xl font-extrabold mb-6">{price}</p>
      <ul className="space-y-2 mb-6 text-sm">
        {features.map((f) => (
          <li key={f} className="text-neutral-400">
            • {f}
          </li>
        ))}
      </ul>
      <Link
        href="/upgrade"
        className={`block w-full text-center py-3 rounded-lg font-semibold ${
          highlight ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        Choose Plan
      </Link>
    </div>
  );
}

function Testimonial({
  name,
  text,
}: {
  name: string;
  text: string;
}) {
  return (
    <div className="p-8 border border-neutral-800 rounded-xl bg-neutral-950/40">
      <p className="text-neutral-300 italic mb-4">"{text}"</p>
      <div className="text-neutral-500 text-sm">— {name}</div>
    </div>
  );
}
