"use client";

import { motion } from "framer-motion";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-black text-white px-10 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <h1 className="text-5xl font-bold mb-6">Your Deal Dashboard</h1>
        <p className="text-neutral-400 mb-12">
          Track ROI, monitor active flips, and view your arbitrage portfolio in
          real-time.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-neutral-900 p-8 rounded-2xl border border-neutral-700">
            <h2 className="text-2xl font-semibold mb-2">Active Deals</h2>
            <p className="text-4xl font-bold">0</p>
          </div>
          <div className="bg-neutral-900 p-8 rounded-2xl border border-neutral-700">
            <h2 className="text-2xl font-semibold mb-2">Monthly ROI</h2>
            <p className="text-4xl font-bold">£0</p>
          </div>
          <div className="bg-neutral-900 p-8 rounded-2xl border border-neutral-700">
            <h2 className="text-2xl font-semibold mb-2">Alerts</h2>
            <p className="text-4xl font-bold">0</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

