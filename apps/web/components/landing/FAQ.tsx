'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    question: 'How fast are the alerts?',
    answer: 'Alert speed depends on your plan. Starter gets 5-minute alerts, Pro gets 3-minute alerts, and Enterprise gets instant alerts (under 30 seconds). All plans monitor marketplaces 24/7 and send notifications as soon as matching items appear.',
  },
  {
    question: 'Which marketplaces do you monitor?',
    answer: 'We monitor Facebook Marketplace, Craigslist, eBay, OfferUp, Nextdoor, and Kijiji. Starter plans include Facebook Marketplace only, while Pro and Enterprise plans include all 6+ platforms. We\'re constantly adding new marketplaces based on user feedback.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! All plans include a 7-day free trial with full access to all features. No credit card required to start. You can cancel anytime during the trial with zero charges.',
  },
  {
    question: 'How does AI price analysis work?',
    answer: 'Our AI compares each listing against millions of historical sales, current market prices, and retail values to identify underpriced items. It analyzes photos, descriptions, and seller behavior to calculate potential profit margins in real-time.',
  },
  {
    question: 'Can I use Magnus Flipper on mobile?',
    answer: 'Absolutely! We have native iOS and Android apps with push notifications. You can create searches, receive alerts, and manage deals from anywhere. The mobile experience is fully optimized for flippers on the go.',
  },
  {
    question: 'How many searches can I create?',
    answer: 'You can create unlimited searches within your keyword limit. Starter allows 6 active keywords, Pro allows 13, and Enterprise allows 18. Each keyword can have multiple filters for category, price range, location, condition, and more.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied with Magnus Flipper for any reason within the first 30 days, contact support for a full refund - no questions asked.',
  },
  {
    question: 'Can I upgrade/downgrade my plan?',
    answer: 'You can upgrade or downgrade anytime. Upgrades take effect immediately with prorated billing. Downgrades take effect at your next billing cycle. All your searches and settings are preserved when changing plans.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="section bg-carbon-950">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Frequently Asked{' '}
            <span className="text-gradient">Questions</span>
          </h2>
          <p className="text-lg text-carbon-300">
            Everything you need to know about Magnus Flipper AI. Can't find what you're looking for? Contact our support team.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="card"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between gap-4 text-left"
              >
                <h3 className="text-lg font-semibold text-carbon-100">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`w-5 h-5 text-carbon-400 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="pt-4 text-carbon-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
