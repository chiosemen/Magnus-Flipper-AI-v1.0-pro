"use client";

export default function SEOHead() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Magnus Flipper AI",
            "applicationCategory": "BusinessApplication",
            "description": "Real-time cross-marketplace scanning, pricing intelligence, and deal alerts powered by AI.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "1240",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Magnus Flipper AI",
            "description": "AI Marketplace Intelligence platform for real-time deal scanning and alerts",
            "url": "https://magnusflipper.com",
          }),
        }}
      />
    </>
  );
}
