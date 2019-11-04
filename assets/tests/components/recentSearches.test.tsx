import React from "react"
import renderer from "react-test-renderer"
import RecentSearches from "../../src/components/recentSearches"

describe("RecentSearches", () => {
  test("renders", () => {
    const tree = renderer.create(<RecentSearches />).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
