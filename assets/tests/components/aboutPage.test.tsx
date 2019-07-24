import React from "react"
import renderer from "react-test-renderer"
import AboutPage from "../../src/components/aboutPage"

describe("About page", () => {
  test("renders", () => {
    const tree = renderer.create(<AboutPage />).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
