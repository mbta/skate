import React from "react"
import renderer from "react-test-renderer"
import FAQPage from "../../src/components/faqPage"

describe("FAQ page", () => {
  test("renders", () => {
    const tree = renderer.create(<FAQPage />).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
