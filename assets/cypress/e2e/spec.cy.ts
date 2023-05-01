describe("template spec", () => {
  it("passes", () => {
    cy.visit("/")

    // Call the API to clear out all pre-existing route tabs, giving
    // a clean slate for reproducible tests.
    // To actually work this will need the CSRF token. We can parse
    // it out of the page from the initial request
    cy.request({
      method: "PUT",
      url: "/api/route_tabs",
      body: JSON.stringify({ route_tabs: [] }),
      headers: {
        "content-type": "application/json",
      },
    })

    cy.visit("/")

    cy.findByRole("button", { name: /Swings View/i }).click()

    // In an actual test, you would add assertions here, or call
    // compareSnapshot for visual regression testing
  })
})
