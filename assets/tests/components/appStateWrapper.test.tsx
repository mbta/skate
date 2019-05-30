import React from "react"
import renderer from "react-test-renderer"
import AppStateWrapper from "../../src/components/appStateWrapper"

test("renders", () => {
  const tree = renderer.create(<AppStateWrapper />).toJSON()
  expect(tree).toMatchSnapshot()
})
