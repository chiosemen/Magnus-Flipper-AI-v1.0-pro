'use client';

import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRegion } from '@/hooks/useRegion';
import { TESTIMONIALS } from '@/data/testimonials';

const trustRatings = [
  { platform: 'App Store', rating: 4.9, reviews: '12K+' },
  { platform: 'Google Play', rating: 4.8, reviews: '8K+' },
  { platform: 'Trustpilot', rating: 4.7, reviews: '5K+' },
];

export default function Testimonials() {
  const { region } = useRegion();
  const testimonials = TESTIMONIALS[region];
  return (
    <section id="testimonials" className="section bg-carbon-950">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Loved by{' '}
            <span className="text-gradient">50,000+ Flippers</span>
          </h2>
          <p className="text-lg text-carbon-300">
            Join thousands of successful resellers who are finding more deals and making more profit with Magnus Flipper AI.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="card group"
            >
              {/* Rating Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-volt-400"
                    fill="currentColor"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-carbon-300 leading-relaxed mb-6">
                "{testimonial.quote}"
              </p>

              {/* Author Info */}
              <div className="border-t border-carbon-800 pt-4">
                <div className="font-semibold text-carbon-100 mb-1">
                  {testimonial.author}
                </div>
                <div className="text-sm text-carbon-400 mb-2">
                  {testimonial.role} • {testimonial.location}
                </div>
                <div className="inline-flex items-center gap-2 text-sm">
                  <span className="text-carbon-500">Avg. Monthly Profit:</span>
                  <span className="font-bold text-flipper-400">
                    {testimonial.monthlyProfit}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Ratings Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-carbon-900/50 border border-carbon-800 rounded-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {trustRatings.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-sm text-carbon-500 mb-2">
                    {item.platform}
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(item.rating)
                              ? 'text-volt-400'
                              : 'text-carbon-700'
                          }`}
                          fill="currentColor"
                        />
                      ))}
                    </div>
                    <span className="text-2xl font-bold text-carbon-100">
                      {item.rating}
                    </span>
                  </div>
                  <div className="text-xs text-carbon-500">
                    {item.reviews} reviews
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
