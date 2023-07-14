import { isValidSearchQuery, SearchQuery } from "../../src/models/searchQuery"

describe("isValidSearchQuery", () => {
  test("returns true if the query text contains at least 2 characters", () => {
    const validQuery: SearchQuery = {
      text: "123",
      property: "run",
    }

    expect(isValidSearchQuery(validQuery)).toBeTruthy()
  })

  test("returns false if the query text contains fewer than 2 characters", () => {
    const invalidQuery: SearchQuery = {
      text: "1",
      property: "run",
    }

    expect(isValidSearchQuery(invalidQuery)).toBeFalsy()
  })

  test("returns false if the query contains more than 2 characters but they're not alphanumeric", () => {
    const invalidQuery: SearchQuery = {
      text: " -1 -",
      property: "run",
    }

    expect(isValidSearchQuery(invalidQuery)).toBeFalsy()
  })
})
