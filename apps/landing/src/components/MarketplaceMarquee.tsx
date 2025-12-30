'use client';

import Image from 'next/image';

const marketplaces = [
  { name: 'Facebook Marketplace', logo: '/logos/facebook.svg', url: 'https://www.facebook.com/marketplace' },
  { name: 'eBay', logo: '/logos/ebay.svg', url: 'https://www.ebay.com' },
  { name: 'Craigslist', logo: '/logos/craigslist.svg', url: 'https://www.craigslist.org' },
  { name: 'OfferUp', logo: '/logos/offerup.svg', url: 'https://offerup.com' },
  { name: 'Vinted', logo: '/logos/vinted.svg', url: 'https://www.vinted.com' },
  { name: 'Gumtree', logo: '/logos/gumtree.svg', url: 'https://www.gumtree.com' },
  { name: 'Nextdoor', logo: '/logos/nextdoor.svg', url: 'https://nextdoor.com' },
  { name: 'Kijiji', logo: '/logos/kijiji.svg', url: 'https://www.kijiji.ca' },
];

export default function MarketplaceMarquee() {
  // Duplicate array for seamless loop
  const duplicatedLogos = [...marketplaces, ...marketplaces];

  return (
    <section className="relative py-8 bg-carbon-900/50 border-y border-carbon-800 overflow-hidden">
      <div className="container-wide mb-4">
        <p className="text-center text-xs text-carbon-500 uppercase tracking-wider">
          Monitoring 8+ Marketplaces 24/7
        </p>
      </div>

      <div className="marquee-container">
        <div className="marquee-track">
          {duplicatedLogos.map((mp, index) => (
            <a
              key={`${mp.name}-${index}`}
              href={mp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="marquee-item"
              aria-label={`Visit ${mp.name}`}
            >
              <Image
                src={mp.logo}
                alt={`${mp.name} logo`}
                width={32}
                height={32}
                className="w-auto h-6"
              />
              <span className="text-sm font-medium whitespace-nowrap">
                {mp.name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
