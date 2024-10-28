import { describe, test, expect } from "@jest/globals"
import { isValidSearchQuery, SearchQuery } from "../../src/models/searchQuery"
import { searchQueryRunFactory } from "../factories/searchQuery"

describe("isValidSearchQuery", () => {
  test("returns true if the query text contains at least 2 characters", () => {
    const validQuery: SearchQuery = searchQueryRunFactory.build({ text: "123" })

    expect(isValidSearchQuery(validQuery)).toBeTruthy()
  })

  test("returns false if the query text contains fewer than 2 characters", () => {
    const invalidQuery: SearchQuery = searchQueryRunFactory.build({ text: "1" })

    expect(isValidSearchQuery(invalidQuery)).toBeFalsy()
  })

  test("returns false if the query contains more than 3 characters but they're not alphanumeric", () => {
    const invalidQuery: SearchQuery = searchQueryRunFactory.build({
      text: " -1 -",
    })

    expect(isValidSearchQuery(invalidQuery)).toBeFalsy()
  })
})
