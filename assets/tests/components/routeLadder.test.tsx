import React from "react"
import renderer from "react-test-renderer"
import RouteLadder from "../../src/components/routeLadder"
import { LoadableTimepoints, Route } from "../../src/skate"

const dispatch = () => undefined

test("renders a route ladder", () => {
  const route: Route = { id: "28" }
  const timepointsForRouteId = (): LoadableTimepoints => [
    { id: "MATPN" },
    { id: "WELLH" },
    { id: "MORTN" },
  ]

  const tree = renderer
    .create(
      <RouteLadder
        route={route}
        dispatch={dispatch}
        timepointsForRouteId={timepointsForRouteId}
      />
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})
