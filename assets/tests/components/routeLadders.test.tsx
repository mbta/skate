import React from "react"
import renderer from "react-test-renderer"
import RouteLadders from "../../src/components/routeLadders"
import { Route, TimepointsByRouteId } from "../../src/skate"

test("renders a route ladder", () => {
  const routes: Route[] = [{ id: "1" }, { id: "28" }]
  const timepointsByRouteId: TimepointsByRouteId = {
    "1": ["WASMA", "MELWA", "HHGAT"],
    "28": ["MATPN", "WELLH", "MORTN"],
    "71": undefined,
    "73": null,
  }

  const tree = renderer
    .create(
      <RouteLadders
        routes={routes}
        timepointsByRouteId={timepointsByRouteId}
        vehiclesByRouteId={{}}
      />
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})
