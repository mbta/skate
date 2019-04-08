import React from "react"
import renderer from "react-test-renderer"
import App from "../../src/components/app"

it("renders", () => {
  const tree = renderer.create(<App />).toJSON()

  expect(tree).toMatchSnapshot()
})
