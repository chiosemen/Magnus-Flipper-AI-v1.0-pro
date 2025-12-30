'use client';

import { Check, Zap, Crown, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: 47,
    description: 'Perfect for beginners testing the waters',
    icon: Zap,
    alertSpeed: '5-min alerts',
    keywords: '6 keywords',
    marketplaces: 'Facebook Marketplace only',
    features: [
      'Basic price analysis',
      'Email notifications',
      'Mobile app access',
      'Basic filters',
      'Community support',
    ],
    popular: false,
  },
  {
    name: 'Pro',
    price: 144,
    description: 'Most popular for serious flippers',
    icon: Crown,
    alertSpeed: '3-min alerts',
    keywords: '13 keywords',
    marketplaces: 'All 6+ platforms',
    features: [
      'AI price analysis',
      'Push notifications',
      'Mobile app access',
      'Advanced filters',
      'Priority support',
      'Profit calculator',
      'Deal history tracking',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 352,
    description: 'For professional reselling businesses',
    icon: Rocket,
    alertSpeed: 'Instant alerts',
    keywords: '18 keywords',
    marketplaces: 'All platforms + API',
    features: [
      'Advanced AI analysis',
      'Instant push notifications',
      'Mobile + desktop apps',
      'Custom filters',
      'Dedicated account manager',
      'API access',
      'Team collaboration',
      'White-label reports',
      'Priority deal queue',
    ],
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="section bg-carbon-900/50">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Simple, Transparent{' '}
            <span className="text-gradient">Pricing</span>
          </h2>
          <p className="text-lg text-carbon-300">
            Choose the plan that fits your flipping goals. All plans include a 7-day free trial.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative ${
                plan.popular
                  ? 'md:-mt-4 md:mb-4'
                  : ''
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="badge-volt px-4 py-1.5">
                    <Crown className="w-3.5 h-3.5" />
                    Most Popular
                  </div>
                </div>
              )}

              <div
                className={`card h-full flex flex-col ${
                  plan.popular
                    ? 'border-flipper-500 shadow-xl shadow-flipper-500/20'
                    : ''
                }`}
              >
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 ${
                    plan.popular
                      ? 'bg-gradient-primary'
                      : 'bg-carbon-800'
                  }`}>
                    <plan.icon className={`w-7 h-7 ${
                      plan.popular ? 'text-white' : 'text-flipper-400'
                    }`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-carbon-100">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-carbon-400 mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gradient">
                      ${plan.price}
                    </span>
                    <span className="text-carbon-500">/month</span>
                  </div>
                </div>

                {/* Key Stats */}
                <div className="space-y-3 mb-6 pb-6 border-b border-carbon-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-carbon-400">Alert Speed:</span>
                    <span className="font-semibold text-carbon-100">
                      {plan.alertSpeed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-carbon-400">Keywords:</span>
                    <span className="font-semibold text-carbon-100">
                      {plan.keywords}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-carbon-400">Marketplaces:</span>
                    <span className="font-semibold text-carbon-100">
                      {plan.marketplaces}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check className="w-5 h-5 text-flipper-400 flex-shrink-0 mt-0.5" />
                      <span className="text-carbon-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link
                  href="/signup"
                  className={`${
                    plan.popular ? 'btn-primary' : 'btn-secondary'
                  } w-full justify-center`}
                >
                  Start 7-Day Free Trial
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Money-Back Guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-flipper-500/10 border border-flipper-500/20 text-flipper-400">
            <Check className="w-5 h-5" />
            <span className="font-semibold">
              30-Day Money-Back Guarantee • Cancel Anytime
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
