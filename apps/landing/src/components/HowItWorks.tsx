'use client';

import { Search, Bell, MessageSquare, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Set Searches',
    description: 'Create keyword searches with filters for category, price, location, and more in under 2 minutes.',
  },
  {
    number: '02',
    icon: Bell,
    title: 'Get Alerts',
    description: 'Receive instant push notifications when profitable deals matching your criteria appear.',
  },
  {
    number: '03',
    icon: MessageSquare,
    title: 'Message First',
    description: 'Be the first to contact sellers before other flippers even see the listing.',
  },
  {
    number: '04',
    icon: TrendingUp,
    title: 'Flip for Profit',
    description: 'Close deals on underpriced items and resell for consistent profit margins.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section bg-carbon-900/50">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Start Finding Deals in{' '}
            <span className="text-gradient">4 Simple Steps</span>
          </h2>
          <p className="text-lg text-carbon-300">
            From setup to your first profitable flip in minutes, not days.
          </p>
        </div>

        {/* Steps Timeline */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-flipper-500 via-volt-400 to-flipper-500 opacity-20" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                {/* Step Card */}
                <div className="relative bg-carbon-900 border border-carbon-800 rounded-2xl p-6 hover:border-carbon-700 transition-all duration-300">
                  {/* Number Badge */}
                  <div className="absolute -top-4 left-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-white shadow-lg">
                      {step.number}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="mt-4 mb-4">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-carbon-800 text-flipper-400">
                      <step.icon className="w-7 h-7" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3 text-carbon-100">
                    {step.title}
                  </h3>
                  <p className="text-carbon-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Connecting Arrow (Desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-24 -right-3 w-6 h-6 text-flipper-500/30">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-12 text-center"
        >
          <div>
            <div className="text-2xl font-bold text-gradient mb-1">2 min</div>
            <div className="text-sm text-carbon-400">Setup time</div>
          </div>
          <div className="w-px h-8 bg-carbon-800" />
          <div>
            <div className="text-2xl font-bold text-gradient mb-1">&lt;30s</div>
            <div className="text-sm text-carbon-400">Alert speed</div>
          </div>
          <div className="w-px h-8 bg-carbon-800" />
          <div>
            <div className="text-2xl font-bold text-gradient mb-1">24/7</div>
            <div className="text-sm text-carbon-400">Monitoring</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
