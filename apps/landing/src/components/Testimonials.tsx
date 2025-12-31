'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useRegion } from '@/hooks/useRegion'
import { getTestimonialsByRegion, type Testimonial } from '@/data/testimonials'

export default function Testimonials() {
  const { region, isLoading } = useRegion()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])

  useEffect(() => {
    if (!isLoading) {
      setTestimonials(getTestimonialsByRegion(region))
    }
  }, [region, isLoading])

  // Calculate stats based on region
  const totalFlippers = region === 'UK' ? '12,000+' : '50,000+'
  const regionLabel = region === 'UK' ? 'UK & Ireland' : 'Worldwide'

  return (
    <section id="testimonials" className="section bg-carbon-950">
      <div className="container-wide">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-white">Loved by </span>
            <span className="text-gradient">{totalFlippers} Flippers</span>
          </h2>
          <p className="text-carbon-400 text-lg max-w-2xl mx-auto">
            Join thousands of successful resellers {region === 'UK' ? 'across the UK' : ''} who are finding more deals and making more profit with Magnus Flipper AI.
          </p>

          {/* Region indicator */}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-carbon-900 border border-carbon-800">
            <span className="w-2 h-2 rounded-full bg-flipper-400 animate-pulse" />
            <span className="text-xs text-carbon-400">
              Showing testimonials from {regionLabel}
            </span>
          </div>
        </motion.div>

        {/* Testimonial Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Skeleton loading state
            [...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-carbon-900 rounded-2xl p-6 animate-pulse"
              >
                <div className="h-4 bg-carbon-800 rounded w-24 mb-4" />
                <div className="h-20 bg-carbon-800 rounded mb-4" />
                <div className="h-4 bg-carbon-800 rounded w-32" />
              </div>
            ))
          ) : (
            testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group card"
              >
                {/* Star Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-volt-400 text-volt-400"
                    />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-carbon-300 mb-6 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>

                {/* Divider */}
                <div className="border-t border-carbon-800 pt-4">
                  {/* Author */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-carbon-500">
                        {testimonial.role} &bull; {testimonial.location}
                      </p>
                    </div>
                  </div>

                  {/* Profit & Marketplace */}
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <p className="text-xs text-carbon-500 uppercase tracking-wider">
                        Avg. Monthly Profit
                      </p>
                      <p className="text-flipper-400 font-bold text-lg">
                        {testimonial.profit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-carbon-500 uppercase tracking-wider">
                        Primary Platform
                      </p>
                      <p className="text-carbon-300 text-sm">
                        {testimonial.marketplace}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Trust Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 flex flex-wrap justify-center items-center gap-8 md:gap-16"
        >
          <div className="text-center">
            <p className="text-3xl font-bold text-white">4.9</p>
            <div className="flex gap-0.5 justify-center my-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-volt-400 text-volt-400" />
              ))}
            </div>
            <p className="text-xs text-carbon-500">App Store Rating</p>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold text-flipper-400">{totalFlippers}</p>
            <p className="text-xs text-carbon-500 mt-1">Active Flippers</p>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold text-white">
              {region === 'UK' ? '£2.1M+' : '$8.5M+'}
            </p>
            <p className="text-xs text-carbon-500 mt-1">
              Profits Generated {region === 'UK' ? '(UK)' : ''}
            </p>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold text-volt-400">&lt;30s</p>
            <p className="text-xs text-carbon-500 mt-1">Alert Speed</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
