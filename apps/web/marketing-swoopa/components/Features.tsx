"use client";

import { DollarSign, TrendingUp, Zap } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: DollarSign,
      title: "Buy Your Profits",
      description: "The best flippers make money by finding deals so good that they would already be profitable, even without refurbishing. Magnus Flipper helps you find these deals easily through AI Marketplace Intelligence and by automatically scanning every marketplace in real-time.",
    },
    {
      icon: TrendingUp,
      title: "Buy More to Sell More",
      description: "Get more good deals regularly with Magnus Flipper so that you can buy and sell more items. Instead of wasting time scouring multiple platforms, you'll receive AI Deal Alerts for every platform automatically.",
    },
    {
      icon: Zap,
      title: "Outpace Your Competition",
      description: "There are only so many things to flip in your market. Magnus Flipper's AI Deal Alerts ensure you're the first to see the best deals, covering platforms like OfferUp, Nextdoor, Kijiji, and Craigslist.",
    },
  ];

  return (
    <section id="features" className="relative py-24 lg:py-32 overflow-hidden bg-[#0A0A0A]">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-br from-[#00E5FF]/40 to-[#7B2FFF]/40 blur-3xl opacity-30" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16 lg:mb-20">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-tight">
            One Feed. Every Marketplace.
          </h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto font-medium">
            The best cars, trucks, furniture, electronics, and more from every marketplace, delivered to you first.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative gradient-card rounded-2xl p-8 border border-white/10 hover:border-[#00E5FF]/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(0,229,255,0.4)]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 gradient-glow opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              
              <div className="relative z-10">
                {/* Icon */}
                <div className="w-14 h-14 bg-[#00E5FF]/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-[#00E5FF]" />
                </div>
                
                <h3 className="font-heading text-xl font-extrabold text-white mb-4 tracking-tight">
                  {feature.title}
                </h3>
                
                <p className="text-white/80 leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
