import React from "react"
import renderer from "react-test-renderer"
import routeFactory from "../../factories/route"
import * as map from "../../../src/components/map"
import VehiclePropertiesPanel from "../../../src/components/propertiesPanel/vehiclePropertiesPanel"
import { RoutesProvider } from "../../../src/contexts/routesContext"
import { VehiclesByRouteIdProvider } from "../../../src/contexts/vehiclesByRouteIdContext"
import { useNearestIntersection } from "../../../src/hooks/useNearestIntersection"
import { useStations } from "../../../src/hooks/useStations"
import useVehiclesForRoute from "../../../src/hooks/useVehiclesForRoute"
import {
  BlockWaiver,
  Ghost,
  VehicleInScheduledService,
} from "../../../src/realtime"
import { Route } from "../../../src/schedule"
import * as dateTime from "../../../src/util/dateTime"
import vehicleFactory, { invalidVehicleFactory } from "../../factories/vehicle"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

jest.spyOn(Date, "now").mockImplementation(() => 234000)

jest.spyOn(map, "MapFollowingPrimaryVehicles")

jest.mock("../../../src/hooks/useVehiclesForRoute", () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock("../../../src/hooks/useNearestIntersection", () => ({
  __esModule: true,
  useNearestIntersection: jest.fn(() => {
    return {
      is_loading: true,
    }
  }),
}))

jest.mock("../../../src/hooks/useStations", () => ({
  __esModule: true,
  useStations: jest.fn(() => []),
}))

const vehicle: VehicleInScheduledService = vehicleFactory.build({
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
  operatorFirstName: "PATTI",
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

describe("VehiclePropertiesPanel", () => {
  test("renders a vehicle properties panel", () => {
    const tree = renderer
      .create(<VehiclePropertiesPanel selectedVehicle={vehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders with route data", () => {
    const route: Route = routeFactory.build({
      id: "39",
      name: "39",
    })
    const tree = renderer
      .create(
        <RoutesProvider routes={[route]}>
          <VehiclePropertiesPanel selectedVehicle={vehicle} />
        </RoutesProvider>
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for an early vehicle", () => {
    const earlyVehicle: VehicleInScheduledService = {
      ...vehicle,
      scheduleAdherenceSecs: -61,
    }
    const tree = renderer
      .create(<VehiclePropertiesPanel selectedVehicle={earlyVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("Includes invalid bus banner when vehicle is off course", () => {
    render(
      <VehiclePropertiesPanel selectedVehicle={invalidVehicleFactory.build()} />
    )
    expect(screen.getByRole("heading", { name: "Invalid Bus" })).toBeVisible()
  })

  test("renders for a late vehicle", () => {
    const earlyVehicle: VehicleInScheduledService = {
      ...vehicle,
      scheduleAdherenceSecs: 361,
    }
    const tree = renderer
      .create(<VehiclePropertiesPanel selectedVehicle={earlyVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for an off-course vehicle", () => {
    const offCourseVehicle: VehicleInScheduledService = {
      ...vehicle,
      isOffCourse: true,
    }

    const tree = renderer
      .create(<VehiclePropertiesPanel selectedVehicle={offCourseVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for a shuttle", () => {
    const shuttleVehicle: VehicleInScheduledService = {
      ...vehicle,
      runId: "999-0555",
      isShuttle: true,
    }

    const tree = renderer
      .create(<VehiclePropertiesPanel selectedVehicle={shuttleVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for a vehicle with block waivers", () => {
    const blockWaiver: BlockWaiver = {
      startTime: new Date("1970-01-01T05:05:00.000Z"),
      endTime: new Date("1970-01-01T12:38:00.000Z"),
      causeId: 0,
      causeDescription: "Block Waiver",
      remark: null,
    }
    const vehicleWithBlockWaivers: VehicleInScheduledService = {
      ...vehicle,
      blockWaivers: [blockWaiver],
    }

    const tree = renderer
      .create(
        <VehiclePropertiesPanel selectedVehicle={vehicleWithBlockWaivers} />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("shows the nearest intersection", () => {
    ;(useNearestIntersection as jest.Mock).mockReturnValueOnce({
      ok: "Atlantic Ave & Summer St",
    })
    const result = render(<VehiclePropertiesPanel selectedVehicle={vehicle} />)
    expect(result.getByText("Atlantic Ave & Summer St")).toBeInTheDocument()
  })

  test("renders data discrepancies when in debug mode", () => {
    jest
      .spyOn(URLSearchParams.prototype, "get")
      .mockImplementation((_key) => "1")

    const result = render(<VehiclePropertiesPanel selectedVehicle={vehicle} />)

    expect(result.queryAllByTestId("data-discrepancy")).toHaveLength(2)
  })

  test("does not render data discrepancies when not in debug mode", () => {
    jest
      .spyOn(URLSearchParams.prototype, "get")
      .mockImplementation((_key) => null)

    const result = render(<VehiclePropertiesPanel selectedVehicle={vehicle} />)

    expect(result.queryAllByTestId("data-discrepancy")).toHaveLength(0)
  })

  test("map includes other vehicles on the route", () => {
    const thisVehicle = vehicle
    const otherVehicle = { ...vehicle, id: "other" }
    const ghost = { id: "ghost" } as Ghost
    jest.spyOn(map, "MapFollowingPrimaryVehicles")
    renderer.create(
      <VehiclesByRouteIdProvider
        vehiclesByRouteId={{ "39": [thisVehicle, otherVehicle, ghost] }}
      >
        <VehiclePropertiesPanel selectedVehicle={thisVehicle} />
      </VehiclesByRouteIdProvider>
    )
    expect(map.MapFollowingPrimaryVehicles).toHaveBeenCalledTimes(1)
    const mapArgs: map.Props = (map.MapFollowingPrimaryVehicles as jest.Mock)
      .mock.calls[0][0]
    expect(mapArgs.secondaryVehicles).toEqual([otherVehicle])
  })

  test("fetches other vehicles on the route if they don't already exist", () => {
    const thisVehicle = vehicle
    const otherVehicle = { ...vehicle, id: "other" }
    const ghost = { id: "ghost" } as Ghost
    jest.spyOn(map, "MapFollowingPrimaryVehicles")
    ;(useVehiclesForRoute as jest.Mock).mockImplementationOnce(() => [
      thisVehicle,
      otherVehicle,
      ghost,
    ])
    renderer.create(<VehiclePropertiesPanel selectedVehicle={thisVehicle} />)
    expect(useVehiclesForRoute).toHaveBeenCalled()
    expect(map.MapFollowingPrimaryVehicles).toHaveBeenCalledTimes(1)
    const mapArgs: map.Props = (map.MapFollowingPrimaryVehicles as jest.Mock)
      .mock.calls[0][0]
    expect(mapArgs.secondaryVehicles).toEqual([otherVehicle])
  })

  test("map includes station icons when in map beta test group", () => {
    ;(useStations as jest.Mock).mockReturnValue([
      {
        id: "station-id",
        locationType: "station",
        name: "Station 1",
        lat: vehicle.latitude,
        lon: vehicle.longitude,
      },
    ])

    const { container } = render(
      <VehiclePropertiesPanel selectedVehicle={vehicle} />
    )

    expect(container.innerHTML).toContain("c-station-icon")
  })
})
