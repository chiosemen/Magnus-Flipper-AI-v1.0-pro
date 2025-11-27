// @ts-nocheck
describe("Alerts", () => {
  it("shows alerts list", () => {
    cy.visit("/alerts");
    cy.get("[data-testid='alert-row']").should("exist");
  });
});
