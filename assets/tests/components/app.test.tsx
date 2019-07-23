import React from "react"
import renderer from "react-test-renderer"
import App, { findRouteById } from "../../src/components/app"
import { Route, TimepointsByRouteId, Vehicle } from "../../src/skate"

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

  test("renders with selectedRoutes in different order than routes data", () => {
    const tree = renderer
      .create(
        <App
          routes={routes}
          timepointsByRouteId={{}}
          selectedRouteIds={["28", "1"]}
          vehiclesByRouteId={{}}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders with timepoints", () => {
    const tree = renderer
      .create(
        <App
          routes={routes}
          timepointsByRouteId={timepointsByRouteId}
          selectedRouteIds={[]}
          vehiclesByRouteId={{}}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders with vehicles", () => {
    const tree = renderer
      .create(
        <App
          routes={routes}
          timepointsByRouteId={timepointsByRouteId}
          selectedRouteIds={[]}
          vehiclesByRouteId={{ "28": [vehicle] }}
          selectedVehicleId={undefined}
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders with a selected vehicle", () => {
    const tree = renderer
      .create(
        <App
          routes={routes}
          timepointsByRouteId={timepointsByRouteId}
          selectedRouteIds={[]}
          vehiclesByRouteId={{ "28": [vehicle] }}
          selectedVehicleId="28"
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})

describe("findRouteById", () => {
  test("finds a route in a list by its id", () => {
    expect(findRouteById(routes, "28")).toEqual({
      directionNames: { 0: "Outbound", 1: "Inbound" },
      id: "28",
    })
  })

  test("returns undefined if the route isn't found", () => {
    expect(findRouteById(routes, "missing")).toEqual(undefined)
  })

  test("returns undefined if routes is null", () => {
    expect(findRouteById(null, "does not matter")).toEqual(undefined)
  })
})

const routes: Route[] = [
  { id: "1", directionNames: { 0: "Outbound", 1: "Inbound" } },
  { id: "28", directionNames: { 0: "Outbound", 1: "Inbound" } },
]
const timepointsByRouteId: TimepointsByRouteId = {
  "1": [{ id: "WASMA" }, { id: "MELWA" }, { id: "HHGAT" }],
  "28": [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }],
  "71": undefined,
  "73": null,
}
const vehicle: Vehicle = {
  id: "v1",
  label: "v1",
  runId: "run1",
  timestamp: 0,
  latitude: 0,
  longitude: 0,
  directionId: 1,
  routeId: "28",
  tripId: "trip",
  headsign: null,
  viaVariant: null,
  operatorId: "op1",
  operatorName: "SMITH",
  bearing: 33,
  speed: 50.0,
  blockId: "block-1",
  headwaySecs: 859.1,
  headwaySpacing: "ok",
  previousVehicleId: "v2",
  scheduleAdherenceSecs: 0,
  scheduleAdherenceString: "0.0 sec (ontime)",
  scheduleAdherenceStatus: "on-time",
  scheduledHeadwaySecs: 120,
  isOffCourse: false,
  blockIsActive: false,
  dataDiscrepancies: [],
  stopStatus: {
    status: "in_transit_to",
    stopId: "stop",
    stopName: "stop",
  },
  timepointStatus: {
    fractionUntilTimepoint: 0.5,
    timepointId: "WELLH",
  },
  scheduledLocation: {
    directionId: 1,
    timepointStatus: {
      timepointId: "MORTN",
      fractionUntilTimepoint: 0.8,
    },
  },
  routeStatus: "incoming",
}
