import * as React from 'react';

type MarketingSEOProps = {
  name: string;
  description: string;
  url: string;
};

export function MarketingSEO({ name, description, url }: MarketingSEOProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    brand: 'Magnus Flipper',
    url,
    offers: [{ '@type': 'Offer', availability: 'https://schema.org/InStock' }],
  };

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
