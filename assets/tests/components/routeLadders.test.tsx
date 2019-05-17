import React from "react"
import renderer from "react-test-renderer"
import RouteLadders from "../../src/components/routeLadders"
import { Route, TimepointsByRouteId } from "../../src/skate"

test("renders a route ladder", () => {
  const routes: Route[] = [{ id: "1" }, { id: "28" }]
  const timepointsByRouteId: TimepointsByRouteId = {
    "1": [{ id: "WASMA" }, { id: "MELWA" }, { id: "HHGAT" }],
    "28": [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }],
    "71": undefined,
    "73": null,
  }

  const tree = renderer
    .create(
      <RouteLadders
        routes={routes}
        timepointsByRouteId={timepointsByRouteId}
        vehiclesByRouteId={{}}
        selectedVehicleId={undefined}
      />
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})
