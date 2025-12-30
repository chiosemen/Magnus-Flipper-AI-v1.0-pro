'use client';

import { Zap, Brain, Globe, Filter, Search, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Zap,
    title: 'Instant Alerts',
    description: 'Get push notifications within seconds when a matching deal appears. Never miss a profitable flip again.',
    color: 'text-volt-400',
  },
  {
    icon: Brain,
    title: 'AI Price Analysis',
    description: 'Our AI compares listings against market values to identify underpriced items automatically.',
    color: 'text-flipper-400',
  },
  {
    icon: Globe,
    title: 'Multi-Marketplace',
    description: 'Monitor Facebook Marketplace, Craigslist, eBay, OfferUp, Nextdoor, and Kijiji from one dashboard.',
    color: 'text-blue-400',
  },
  {
    icon: Filter,
    title: 'Smart Filters',
    description: 'Set precise criteria by category, brand, condition, price range, and location to find exactly what you need.',
    color: 'text-purple-400',
  },
  {
    icon: Search,
    title: 'Keyword Tracking',
    description: 'Create unlimited keyword searches that run 24/7, scanning millions of new listings every day.',
    color: 'text-orange-400',
  },
  {
    icon: BarChart3,
    title: 'Profit Calculator',
    description: 'See instant ROI and margin estimates based on current market prices and platform fees.',
    color: 'text-pink-400',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function Features() {
  return (
    <section id="features" className="section bg-carbon-950">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="badge mb-4">
            <Zap className="w-3.5 h-3.5" />
            Powerful Features
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Everything You Need to{' '}
            <span className="text-gradient">Flip Smarter</span>
          </h2>
          <p className="text-lg text-carbon-300">
            Built for serious flippers who need professional tools to find and close deals faster than the competition.
          </p>
        </div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="card-hover group"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-carbon-800 ${feature.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-carbon-100">
                {feature.title}
              </h3>
              <p className="text-carbon-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
