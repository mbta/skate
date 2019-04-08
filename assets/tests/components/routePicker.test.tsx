import React from "react"
import renderer from "react-test-renderer"
import RoutePicker from "../../src/components/routePicker"
import { Route } from "../../src/skate"

test("renders a list of routes", () => {
  const routes: Route[] = [
    { id: "28" },
    { id: "39" },
    { id: "71" },
    { id: "73" },
    { id: "111" },
  ]

  const tree = renderer.create(<RoutePicker routes={routes} />).toJSON()

  expect(tree).toMatchSnapshot()
})

test("renders a loading message while waiting ƒor routes", () => {
  const tree = renderer.create(<RoutePicker routes={null} />).toJSON()

  expect(tree).toMatchSnapshot()
})
