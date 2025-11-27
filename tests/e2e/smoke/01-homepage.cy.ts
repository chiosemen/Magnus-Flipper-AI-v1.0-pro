describe("Homepage Smoke Test", () => {
  it("loads marketing homepage", () => {
    cy.visit("/");
    cy.contains("Magnus").should("exist");
  });
});
