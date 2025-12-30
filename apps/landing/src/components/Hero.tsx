'use client';

import { Zap, PlayCircle, CheckCircle, Clock, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const stats = [
  { value: '<30s', label: 'Alert Speed' },
  { value: '50K+', label: 'Active Users' },
  { value: '2M+', label: 'Deals Found' },
  { value: '4.9', label: 'App Rating', icon: Star },
];

const dealNotifications = [
  {
    title: 'Dyson Vacuum',
    price: '$180',
    market: 'Facebook Marketplace',
    savings: '$220 below retail',
    delay: 0
  },
  {
    title: 'iPhone 13 Pro',
    price: '£450',
    market: 'Gumtree',
    savings: '£180 profit margin',
    delay: 0.2
  },
  {
    title: 'Nintendo Switch',
    price: '€120',
    market: 'Vinted',
    savings: '€80 below market',
    delay: 0.4
  },
];

const marketplaceLogos = [
  'Facebook Marketplace',
  'eBay',
  'Vinted',
  'Gumtree',
  'Craigslist',
  'Amazon',
  'CEX',
];

export default function Hero() {
  return (
    <section className="relative section pt-32 md:pt-40 pb-20 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-dark opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-flipper-500/10 via-transparent to-transparent" />

      <div className="container-wide relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex mb-6"
          >
            <div className="badge">
              <Zap className="w-3.5 h-3.5" fill="currentColor" />
              AI-Powered Deal Detection
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
          >
            Find Profitable Flips{' '}
            <span className="text-gradient">Before Anyone Else</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-carbon-300 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Magnus Flipper AI monitors 7+ marketplaces 24/7, analyzing millions of listings with AI to send you instant alerts on underpriced items before they're gone.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <Link href="/signup" className="btn-primary text-base px-8 py-4">
              <Zap className="w-5 h-5" />
              Start 7-Day Free Trial
            </Link>
            <Link href="#demo" className="btn-secondary text-base px-8 py-4">
              <PlayCircle className="w-5 h-5" />
              Watch Demo
            </Link>
          </motion.div>

          {/* Trust Signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-carbon-400 mb-12"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-flipper-400" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-flipper-400" />
              Cancel anytime
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-flipper-400" />
              Setup in 2 minutes
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-16"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 0.6 + index * 0.1,
                  type: "spring",
                  stiffness: 200,
                }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-1 text-3xl md:text-4xl font-bold text-gradient mb-2">
                  {stat.value}
                  {stat.icon && <stat.icon className="w-6 h-6 text-volt-400" fill="currentColor" />}
                </div>
                <div className="text-sm text-carbon-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Floating Deal Notifications */}
          <div className="relative max-w-2xl mx-auto mb-16 h-64 md:h-80">
            {dealNotifications.map((deal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50, y: 50 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  y: [0, -10, 0],
                }}
                transition={{
                  opacity: { duration: 0.5, delay: 0.6 + deal.delay },
                  x: { duration: 0.5, delay: 0.6 + deal.delay },
                  y: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: deal.delay
                  }
                }}
                className={`absolute ${
                  index === 0 ? 'top-0 left-0' :
                  index === 1 ? 'top-1/3 right-0' :
                  'bottom-0 left-1/4'
                } card-glass p-4 max-w-xs`}
                style={{
                  transform: `rotate(${index % 2 === 0 ? -2 : 2}deg)`
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-carbon-100">{deal.title}</div>
                    <div className="text-xs text-carbon-400">{deal.market}</div>
                  </div>
                  <div className="text-xl font-bold text-flipper-400">{deal.price}</div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Zap className="w-3 h-3 text-volt-400" fill="currentColor" />
                  <span className="text-volt-400">{deal.savings}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Marketplace Logos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-16"
          >
            <p className="text-sm text-carbon-500 mb-6 uppercase tracking-wider">
              Monitoring 7+ Marketplaces
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
              {marketplaceLogos.map((marketplace, index) => (
                <div
                  key={index}
                  className="text-sm font-medium text-carbon-600 hover:text-carbon-400 transition-colors"
                >
                  {marketplace}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
