import React from "react"
import renderer from "react-test-renderer"
import RouteLadders from "../../src/components/routeLadders"
import { Route, TimepointsByRouteId } from "../../src/schedule.d"

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: () => true,
}))

test("renders a route ladder", () => {
  const routes: Route[] = [
    { id: "1", directionNames: { 0: "Outbound", 1: "Inbound" }, name: "1" },
    { id: "28", directionNames: { 0: "Outbound", 1: "Inbound" }, name: "28" },
  ]
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
        selectedVehicleId={undefined}
      />
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})
