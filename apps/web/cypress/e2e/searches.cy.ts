// @ts-nocheck
describe("Searches", () => {
  it("shows saved searches", () => {
    cy.visit("/searches");
    cy.get("[data-testid='saved-search-list']").should("exist");
    cy.get("[data-testid='saved-search-row']").first().should("exist");
  });
});
