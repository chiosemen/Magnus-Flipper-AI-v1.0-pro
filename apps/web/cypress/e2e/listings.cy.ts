// @ts-nocheck
describe("Listings", () => {
  it("renders listing cards", () => {
    cy.visit("/listings");
    cy.get("[data-testid='listing-card']").should("exist");
  });
});
