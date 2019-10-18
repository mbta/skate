import React from "react"
import renderer from "react-test-renderer"
import SearchPage from "../../src/components/searchPage"

describe("SearchPage", () => {
  test("renders", () => {
    const tree = renderer.create(<SearchPage />).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
