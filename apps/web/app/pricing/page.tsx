"use client";

import { motion } from "framer-motion";

const plans = [
  {
    name: "Starter",
    price: "£15/mo",
    description: "Ideal for beginners testing the waters.",
    features: ["50 scans/day", "Basic profit estimates", "Community support"],
  },
  {
    name: "Pro",
    price: "£29/mo",
    highlight: true,
    description: "For active arbitrage traders.",
    features: [
      "Unlimited scans",
      "Real-time alerts",
      "Profit engine access",
      "Portfolio ROI tracking",
    ],
  },
  {
    name: "Agency",
    price: "£79/mo",
    description: "For full-time deal hunters and teams.",
    features: [
      "Unlimited everything",
      "Multi-market dashboards",
      "Deal prioritisation AI",
      "Team seats included",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-20"
      >
        <h1 className="text-5xl font-bold mb-4">Simple, transparent pricing.</h1>
        <p className="text-neutral-400 text-lg">
          No hidden fees. Cancel anytime.
        </p>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
        {plans.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-10 rounded-2xl border ${
              p.highlight
                ? "border-white bg-white text-black shadow-xl scale-105"
                : "border-neutral-700 bg-neutral-900"
            }`}
          >
            <h2 className="text-3xl font-bold mb-2">{p.name}</h2>
            <p className="text-4xl font-semibold mb-6">{p.price}</p>
            <p className="mb-6 text-neutral-400">{p.description}</p>
            <ul className="space-y-4 mb-10">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span>✔</span> {f}
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-4 rounded-xl font-semibold ${
                p.highlight
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-neutral-200"
              }`}
            >
              Choose Plan
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

