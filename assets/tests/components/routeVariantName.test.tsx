import React from "react"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom"
import routeFactory from "../factories/route"
import { RouteVariantName } from "../../src/components/routeVariantName"
import { RoutesProvider } from "../../src/contexts/routesContext"
import { Vehicle } from "../../src/realtime"
import { Route } from "../../src/schedule"
import vehicleFactory from "../factories/vehicle"

const vehicle: Vehicle = vehicleFactory.build({
  id: "v1",
  label: "v1-label",
  runId: "run-1",
  timestamp: 123,
  latitude: 0,
  longitude: 0,
  directionId: 0,
  routeId: "39",
  tripId: "t1",
  headsign: "Forest Hills",
  viaVariant: "X",
  operatorId: "op1",
  operatorFirstName: "WILL",
  operatorLastName: "SMITH",
  operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
  bearing: 33,
  blockId: "block-1",
  previousVehicleId: "v2",
  scheduleAdherenceSecs: 0,
  isShuttle: false,
  isOverload: false,
  isOffCourse: false,
  isRevenue: true,
  layoverDepartureTime: null,
  dataDiscrepancies: [
    {
      attribute: "trip_id",
      sources: [
        {
          id: "swiftly",
          value: "swiftly-trip-id",
        },
        {
          id: "busloc",
          value: "busloc-trip-id",
        },
      ],
    },
  ],
  stopStatus: {
    stopId: "s1",
    stopName: "Stop Name",
  },
  timepointStatus: {
    fractionUntilTimepoint: 0.5,
    timepointId: "tp1",
  },
  scheduledLocation: null,
  routeStatus: "on_route",
  endOfTripType: "another_trip",
  blockWaivers: [],
  crowding: null,
})

describe("RouteVariantName", () => {
  test("renders for a vehicle with variant and headsign", () => {
    const result = render(<RouteVariantName vehicle={vehicle} />)

    expect(result.getByTestId("variant-name")).toHaveTextContent(
      "39_X Forest Hills"
    )
  })

  test("renders for a vehicle missing variant and headsign", () => {
    const testVehicle: Vehicle = {
      ...vehicle,
      headsign: null,
      viaVariant: null,
    }

    const result = render(<RouteVariantName vehicle={testVehicle} />)

    expect(result.getByTestId("variant-name")).toHaveTextContent("39_")
  })

  test("doesn't show underscore variant character", () => {
    const testVehicle: Vehicle = {
      ...vehicle,
      headsign: null,
      viaVariant: "_",
    }

    const result = render(<RouteVariantName vehicle={testVehicle} />)

    expect(result.getByTestId("variant-name")).toHaveTextContent("39_")
  })

  test("renders a static label for a shuttle", () => {
    const testVehicle: Vehicle = {
      ...vehicle,
      isShuttle: true,
    }

    const result = render(<RouteVariantName vehicle={testVehicle} />)

    expect(result.getByText("Shuttle")).toBeInTheDocument()
  })

  test("uses route name if available", () => {
    const route: Route = routeFactory.build({
      id: "39",
      name: "ThirtyNine",
    })

    const result = render(
      <RoutesProvider routes={[route]}>
        <RouteVariantName vehicle={vehicle} />
      </RoutesProvider>
    )
    expect(result.getByTestId("variant-name")).toHaveTextContent(
      "ThirtyNine_X Forest Hills"
    )
  })
})
