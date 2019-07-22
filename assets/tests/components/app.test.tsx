import React from "react"
import renderer from "react-test-renderer"
import App from "../../src/components/app"
import { Route } from "../../src/skate"

describe("App", () => {
  test("renders the empty state", () => {
    const tree = renderer
      .create(
        <App
          routes={null}
          timepointsByRouteId={{}}
          selectedRouteIds={[]}
          vehiclesByRouteId={{}}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders with routes", () => {
    const tree = renderer
      .create(
        <App
          routes={routes}
          timepointsByRouteId={{}}
          selectedRouteIds={["1"]}
          vehiclesByRouteId={{}}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})

const routes: Route[] = [
  { id: "1", directionNames: { 0: "Outbound", 1: "Inbound" } },
  { id: "28", directionNames: { 0: "Outbound", 1: "Inbound" } },
]
