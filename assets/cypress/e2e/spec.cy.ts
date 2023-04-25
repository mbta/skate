describe("template spec", () => {
  it("passes", () => {
    cy.visit("/")

    cy.findByRole("button", { name: /Swings View/i }).click()

    cy.compareSnapshot("swings")
  })
})
