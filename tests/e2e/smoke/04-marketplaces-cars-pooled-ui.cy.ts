describe("Cars Marketplace (pooled) UI", () => {
  const now = Date.now();

  function isoMinutesAgo(mins: number) {
    return new Date(now - mins * 60_000).toISOString();
  }

  it("renders car cards with landscape images and vehicle overlays", () => {
    cy.intercept("GET", "/api/deals*", (req) => {
      const url = new URL(req.url);
      if (url.searchParams.get("marketplace") !== "cars") {
        req.reply({ statusCode: 200, body: { deals: [] } });
        return;
      }

      req.reply({
        statusCode: 200,
        body: {
          deals: [
            {
              id: "car-deal-1",
              search_id: null,
              marketplace: "cars",
              title: "2010 Honda Odyssey - Family van",
              price: 6500,
              currency: "£",
              score: 78,
              location: "London",
              url: "https://example.com/car1",
              images: [{ url: "https://placehold.co/800x500/png?text=Car+1" }],
              primary_image: "https://placehold.co/800x500/png?text=Car+1",
              thumbnail: null,
              attributes: {
                category: "car",
                year: 2010,
                make: "Honda",
                model: "Odyssey",
                mileage: 92000,
              },
              data: { demo: true },
              created_at: isoMinutesAgo(20),
              fetched_at: isoMinutesAgo(5),
              posted_at: isoMinutesAgo(30),
            },
          ],
        },
      });
    }).as("getCarDeals");

    cy.visit("/marketplaces/cars");
    cy.wait("@getCarDeals");

    cy.get(".columns-2").should("exist");
    cy.get(".aspect-\\[16\\/10\\]").should("exist");

    cy.get('a[href="https://example.com/car1"]')
      .closest(".group")
      .contains("2010 Honda Odyssey")
      .should("exist");

    cy.get('a[href="https://example.com/car1"]')
      .closest(".group")
      .contains("92,000")
      .should("exist");
  });
});

