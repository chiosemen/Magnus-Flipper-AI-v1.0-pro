describe("Dashboard Smoke Test", () => {
  it("loads dashboard shell (unauthenticated)", () => {
    cy.visit("/dashboard");
    cy.contains("Sign in").should("exist");
  });
});
