import React from "react"
import renderer from "react-test-renderer"
import RouteLadder from "../../src/components/routeLadder"
import { Route, TimepointsByRouteId } from "../../src/skate"

const dispatch = () => undefined

test("renders a route ladder", () => {
  const route: Route = { id: "28" }
  const timepointsByRoute: TimepointsByRouteId = {
    "28": [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }],
  }

  const tree = renderer
    .create(
      <RouteLadder
        route={route}
        dispatch={dispatch}
        timepointsByRoute={timepointsByRoute}
      />
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})
