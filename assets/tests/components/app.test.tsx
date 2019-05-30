import React from "react"
import renderer from "react-test-renderer"
import App from "../../src/components/app"
import { Route, TimepointsByRouteId, Vehicle } from "../../src/skate"

test("renders the empty state", () => {
  const tree = renderer
    .create(
      <App
        routes={null}
        timepointsByRouteId={{}}
        selectedRouteIds={[]}
        selectedRoutes={[]}
        vehiclesByRouteId={{}}
        selectedVehicleId={undefined}
        selectedVehicle={undefined}
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
        selectedRouteIds={[]}
        selectedRoutes={[]}
        vehiclesByRouteId={{}}
        selectedVehicleId={undefined}
        selectedVehicle={undefined}
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
        selectedRoutes={[]}
        vehiclesByRouteId={{}}
        selectedVehicleId={undefined}
        selectedVehicle={undefined}
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
        selectedRoutes={[]}
        vehiclesByRouteId={{ "28": [vehicle] }}
        selectedVehicleId={undefined}
        selectedVehicle={undefined}
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
        selectedRoutes={[]}
        vehiclesByRouteId={{ "28": [vehicle] }}
        selectedVehicleId="28"
        selectedVehicle={vehicle}
      />
    )
    .toJSON()
  expect(tree).toMatchSnapshot()
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
  run_id: "run1",
  timestamp: 0,
  latitude: 0,
  longitude: 0,
  direction_id: 1,
  route_id: "28",
  trip_id: "trip",
  headsign: null,
  via_variant: null,
  operator_id: "op1",
  operator_name: "SMITH",
  stop_status: {
    status: "in_transit_to",
    stop_id: "stop",
    stop_name: "stop",
  },
  timepoint_status: {
    timepoint_id: "MATPN",
    fraction_until_timepoint: 0.5,
  },
  route_status: "incoming",
}
