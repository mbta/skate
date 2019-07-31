import React from "react"
import renderer from "react-test-renderer"
import LadderPageContext from "../../src/components/ladderPageContext"

test("renders", () => {
  const tree = renderer.create(<LadderPageContext />).toJSON()
  expect(tree).toMatchSnapshot()
})
