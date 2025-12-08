"use client";

const Logos = () => {
  const logos = [
    { name: "kijiji", display: "kijiji" },
    { name: "ebay", display: "ebay" },
    { name: "marketplace", display: "Marketplace" },
    { name: "craigslist", display: "craigslist" },
    { name: "offerup", display: "OfferUp" },
  ];

  return (
    <section className="relative py-8 bg-[#121212]/30 border-y border-white/10 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...logos, ...logos, ...logos].map((logo, index) => (
          <div
            key={index}
            className="mx-12 flex items-center justify-center text-white/60 font-heading text-xl md:text-2xl font-extrabold tracking-tight"
          >
            {logo.name === "marketplace" && (
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            )}
            {logo.name === "craigslist" && (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z"/>
              </svg>
            )}
            {logo.display}
          </div>
        ))}
      </div>
    </section>
  );
};

export default Logos;
