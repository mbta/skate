import React from "react"
import renderer from "react-test-renderer"
import SearchForm from "../../src/components/searchForm"

describe("SearchForm", () => {
  test("renders", () => {
    const tree = renderer.create(<SearchForm />).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
