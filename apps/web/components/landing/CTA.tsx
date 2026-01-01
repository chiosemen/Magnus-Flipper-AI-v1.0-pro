'use client';

import { Zap, Apple, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CTA() {
  return (
    <section className="section bg-carbon-900/50 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-flipper-500/20 via-transparent to-volt-400/20 opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-flipper-500/10 via-transparent to-transparent" />

      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Find Deals{' '}
            <span className="text-gradient">Before Everyone Else?</span>
          </h2>

          <p className="text-lg md:text-xl text-carbon-300 mb-10 max-w-2xl mx-auto">
            Join 50,000+ successful flippers using Magnus Flipper AI to discover profitable deals instantly. Start your 7-day free trial today.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/signup"
              className="btn-primary text-lg px-10 py-5 glow-green hover:glow-green"
            >
              <Zap className="w-6 h-6" />
              Start scanning markets in under 60 seconds
            </Link>
          </div>

          {/* App Download Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 bg-carbon-900 border border-carbon-700 rounded-lg hover:border-carbon-600 transition-all duration-200 group"
            >
              <Apple className="w-8 h-8 text-carbon-100 group-hover:text-flipper-400 transition-colors" />
              <div className="text-left">
                <div className="text-xs text-carbon-500">Download on the</div>
                <div className="text-base font-semibold text-carbon-100">
                  App Store
                </div>
              </div>
            </a>

            <a
              href="https://play.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 bg-carbon-900 border border-carbon-700 rounded-lg hover:border-carbon-600 transition-all duration-200 group"
            >
              <Play className="w-8 h-8 text-carbon-100 group-hover:text-flipper-400 transition-colors" />
              <div className="text-left">
                <div className="text-xs text-carbon-500">Get it on</div>
                <div className="text-base font-semibold text-carbon-100">
                  Google Play
                </div>
              </div>
            </a>
          </div>

          {/* Trust Line */}
          <p className="mt-8 text-sm text-carbon-500">
            Trusted by 50,000+ flippers • 2M+ deals found • 4.9 average rating
          </p>
        </motion.div>
      </div>
    </section>
  );
}
