import React from "react"
import renderer from "react-test-renderer"
import routeFactory from "../factories/route"
import RouteLadders from "../../src/components/routeLadders"
import { Route, TimepointsByRouteId } from "../../src/schedule.d"

test("renders a route ladder", () => {
  const routes: Route[] = [
    routeFactory.build({ id: "1", name: "1" }),
    routeFactory.build({ id: "28", name: "28" }),
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
