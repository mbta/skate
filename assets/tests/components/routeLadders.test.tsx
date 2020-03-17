import React from "react"
import renderer from "react-test-renderer"
import RouteLadders from "../../src/components/routeLadders"
import { Route, TimepointsByRouteId } from "../../src/schedule.d"

test("renders a route ladder", () => {
  const routes: Route[] = [
    { id: "1", directionNames: { 0: "Outbound", 1: "Inbound" }, name: "1" },
    { id: "28", directionNames: { 0: "Outbound", 1: "Inbound" }, name: "28" },
  ]
  const timepointsByRouteId: TimepointsByRouteId = {
    "1": [
      { id: "WASMA", name: "WASMA Name" },
      { id: "MELWA", name: "MELWA Name" },
      { id: "HHGAT", name: "HHGAT Name" },
    ],
    "28": [
      { id: "MATPN", name: "MATPN Name" },
      { id: "WELLH", name: "WELLH Name" },
      { id: "MORTN", name: "MORTN Name" },
    ],
    "71": undefined,
    "73": null,
  }

  const tree = renderer
    .create(
      <RouteLadders
        routes={routes}
        timepointsByRouteId={timepointsByRouteId}
        selectedVehicleId={undefined}
      />
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})
