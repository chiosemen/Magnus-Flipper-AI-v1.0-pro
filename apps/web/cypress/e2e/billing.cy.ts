// @ts-nocheck
describe("Billing", () => {
  it("shows billing page contents", () => {
    cy.visit("/pricing");
    cy.contains("Find Your Perfect Flipping Plan");
  });
});
