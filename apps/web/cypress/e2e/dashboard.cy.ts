// @ts-nocheck
describe("Dashboard", () => {
  it("shows plan summary and listings", () => {
    cy.visit("/dashboard");
    cy.get("[data-testid='dashboard-plan-summary']").should("exist");
    cy.get("[data-testid='dashboard-alerts']").should("exist");
    cy.get("[data-testid='listing-card']").should("exist");
  });
});
