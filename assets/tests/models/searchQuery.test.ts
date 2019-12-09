import { SearchQuery, isValidSearchQuery } from "../../src/models/searchQuery"

describe("isValidSearchQuery", () => {
  test("returns true if the search text contains at least 2 characters", () => {
    const validQuery: SearchQuery = {
      text: "12",
      property: "run",
    }

    expect(isValidSearchQuery(validQuery)).toBeTruthy()
  })

  test("returns false if the search text contains fewer than 2 characters", () => {
    const invalidQuery: SearchQuery = {
      text: "1",
      property: "run",
    }

    expect(isValidSearchQuery(invalidQuery)).toBeFalsy()
  })

  test("returns false if the search contains more than 2 characters but they're not alphanumeric", () => {
    const invalidQuery: SearchQuery = {
      text: " -1 -",
      property: "run",
    }

    expect(isValidSearchQuery(invalidQuery)).toBeFalsy()
  })
})
