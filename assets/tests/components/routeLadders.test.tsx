import React from "react"
import renderer from "react-test-renderer"
import RouteLadders from "../../src/components/routeLadders"
import { Route, TimepointsByRouteId } from "../../src/skate"

const dispatch = () => undefined

test("renders a route ladder", () => {
  const routes: Route[] = [{ id: "1" }, { id: "28" }]
  const timepointsByRoute: TimepointsByRouteId = {
    "1": [{ id: "WASMA" }, { id: "MELWA" }, { id: "HHGAT" }],
    "28": [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }],
  }

  const tree = renderer
    .create(
      <RouteLadders
        routes={routes}
        dispatch={dispatch}
        timepointsByRoute={timepointsByRoute}
      />
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})
