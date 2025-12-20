describe("Facebook Marketplace (pooled) UI", () => {
  const now = Date.now();

  function isoMinutesAgo(mins: number) {
    return new Date(now - mins * 60_000).toISOString();
  }

  it("shows intentional skeleton state when deals are empty", () => {
    cy.intercept("GET", "/api/deals*", {
      statusCode: 200,
      body: { deals: [] },
    }).as("getDealsEmpty");

    cy.intercept("GET", "/api/facebook/deals/last-updated", {
      statusCode: 200,
      body: { lastUpdatedAt: new Date(now).toISOString() },
    });

    cy.visit("/marketplaces/facebook");
    cy.wait("@getDealsEmpty");

    cy.contains("Market is warming up — scanning for fresh opportunities.").should("exist");
    cy.get(".columns-2").find(".animate-pulse").should("have.length.at.least", 6);
  });

  it("renders masonry deal cards with lazy images and safe fallbacks", () => {
    cy.intercept("GET", "/api/deals*", (req) => {
      // Only stub pooled reads for the facebook marketplace.
      const url = new URL(req.url);
      if (url.searchParams.get("marketplace") !== "facebook") {
        req.reply({ statusCode: 200, body: { deals: [] } });
        return;
      }

      req.reply({
        statusCode: 200,
        body: {
          deals: [
            {
              id: "deal-hot-1",
              search_id: null,
              marketplace: "facebook",
              title: "iPhone 14 Pro Max 256GB Unlocked",
              price: 399,
              currency: "£",
              score: 90,
              location: "London",
              url: "https://example.com/hot",
              images: [{ url: "https://placehold.co/800x800/png?text=Hot+Deal" }],
              primary_image: "https://placehold.co/800x800/png?text=Hot+Deal",
              thumbnail: null,
              attributes: { category: "tech" },
              data: { demo: true },
              created_at: isoMinutesAgo(5),
              fetched_at: isoMinutesAgo(2),
              posted_at: isoMinutesAgo(8),
            },
            {
              id: "deal-warm-1",
              search_id: null,
              marketplace: "facebook",
              title: "PlayStation 5 Disc Edition",
              price: 320,
              currency: "£",
              score: 75,
              location: "Manchester",
              url: "https://example.com/warm",
              images: [{ url: "https://placehold.co/800x800/png?text=Warm+Deal" }],
              primary_image: null,
              thumbnail: null,
              attributes: { category: "tech" },
              data: { demo: true },
              created_at: isoMinutesAgo(45),
              fetched_at: isoMinutesAgo(10),
              posted_at: isoMinutesAgo(50),
            },
            {
              id: "deal-no-image-1",
              search_id: null,
              marketplace: "facebook",
              title: "Xbox Series X - Barely used",
              price: 280,
              currency: "£",
              score: 40,
              location: "Leeds",
              url: "https://example.com/normal",
              images: [],
              primary_image: null,
              thumbnail: null,
              attributes: { category: "tech" },
              data: { demo: true },
              created_at: isoMinutesAgo(180),
              fetched_at: isoMinutesAgo(30),
              posted_at: isoMinutesAgo(200),
            },
          ],
        },
      });
    }).as("getDeals");

    cy.intercept("GET", "/api/facebook/deals/last-updated", {
      statusCode: 200,
      body: { lastUpdatedAt: new Date(now).toISOString() },
    });

    cy.visit("/marketplaces/facebook");
    cy.wait("@getDeals");

    cy.get(".columns-2").should("exist");
    cy.contains("View listing").should("exist");
    cy.get('img[loading="lazy"]').should("have.length.at.least", 1);

    // Fallback image: if primary_image and images are empty, DealCard uses /placeholder.png.
    cy.contains("Xbox Series X - Barely used")
      .parents(".group")
      .first()
      .find('img[src="/placeholder.png"]')
      .should("exist");

    // Free/Basic tier: do not reveal HOT/WARM labels; HOT shows a locked "Upgrade" badge.
    cy.get('a[href="https://example.com/hot"]')
      .closest(".group")
      .contains("Upgrade")
      .should("exist");

    cy.contains("HOT").should("not.exist");
    cy.contains("WARM").should("not.exist");
  });
});

