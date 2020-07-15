import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import * as map from "../../../src/components/map"
import VehiclePropertiesPanel from "../../../src/components/propertiesPanel/vehiclePropertiesPanel"
import { VehiclesByRouteIdProvider } from "../../../src/contexts/vehiclesByRouteIdContext"
import useVehiclesForRoute from "../../../src/hooks/useVehiclesForRoute"
import { HeadwaySpacing } from "../../../src/models/vehicleStatus"
import { BlockWaiver, Ghost, Vehicle } from "../../../src/realtime"
import { Route } from "../../../src/schedule"
import * as dateTime from "../../../src/util/dateTime"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

jest.spyOn(Date, "now").mockImplementation(() => 234000)

jest.spyOn(map, "default")

jest.mock("../../../src/hooks/useVehiclesForRoute", () => ({
  __esModule: true,
  default: jest.fn(),
}))

const vehicle: Vehicle = {
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
  operatorName: "SMITH",
  operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
  bearing: 33,
  blockId: "block-1",
  headwaySecs: 859.1,
  headwaySpacing: HeadwaySpacing.Ok,
  previousVehicleId: "v2",
  scheduleAdherenceSecs: 0,
  scheduledHeadwaySecs: 120,
  isShuttle: false,
  isOverload: false,
  isOffCourse: false,
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
}

describe("VehiclePropertiesPanel", () => {
  test("renders a vehicle properties panel", () => {
    const tree = renderer
      .create(<VehiclePropertiesPanel selectedVehicle={vehicle} routes={[]} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders with route data", () => {
    const route: Route = {
      id: "39",
      directionNames: {
        0: "Outbound",
        1: "Inbound",
      },
      name: "39",
    }
    const tree = renderer
      .create(
        <VehiclePropertiesPanel
          selectedVehicle={vehicle}
          route={route}
          routes={[]}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for an early vehicle", () => {
    const earlyVehicle: Vehicle = {
      ...vehicle,
      scheduleAdherenceSecs: -61,
    }
    const tree = renderer
      .create(
        <VehiclePropertiesPanel selectedVehicle={earlyVehicle} routes={[]} />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for a late vehicle", () => {
    const earlyVehicle: Vehicle = {
      ...vehicle,
      scheduleAdherenceSecs: 361,
    }
    const tree = renderer
      .create(
        <VehiclePropertiesPanel selectedVehicle={earlyVehicle} routes={[]} />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for an off-course vehicle", () => {
    const offCourseVehicle: Vehicle = {
      ...vehicle,
      isOffCourse: true,
    }

    const tree = renderer
      .create(
        <VehiclePropertiesPanel
          selectedVehicle={offCourseVehicle}
          routes={[]}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for a headway-based vehicle", () => {
    const offCourseVehicle: Vehicle = {
      ...vehicle,
      headwaySpacing: HeadwaySpacing.Ok,
    }

    const tree = renderer
      .create(
        <VehiclePropertiesPanel
          selectedVehicle={offCourseVehicle}
          routes={[]}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for a shuttle", () => {
    const shuttleVehicle: Vehicle = {
      ...vehicle,
      runId: "999-0555",
      isShuttle: true,
    }

    const tree = renderer
      .create(
        <VehiclePropertiesPanel selectedVehicle={shuttleVehicle} routes={[]} />
      )
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
    const vehicleWithBlockWaivers: Vehicle = {
      ...vehicle,
      blockWaivers: [blockWaiver],
    }

    const tree = renderer
      .create(
        <VehiclePropertiesPanel
          selectedVehicle={vehicleWithBlockWaivers}
          routes={[]}
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders data discrepancies when in debug mode", () => {
    jest
      .spyOn(URLSearchParams.prototype, "get")
      .mockImplementation((_key) => "1")

    const wrapper = mount(
      <VehiclePropertiesPanel selectedVehicle={vehicle} routes={[]} />
    )

    expect(
      wrapper.find(".m-vehicle-properties-panel__data-discrepancies").length
    ).toBeGreaterThan(0)
  })

  test("does not render data discrepancies when not in debug mode", () => {
    jest
      .spyOn(URLSearchParams.prototype, "get")
      .mockImplementation((_key) => null)

    const wrapper = mount(
      <VehiclePropertiesPanel selectedVehicle={vehicle} routes={[]} />
    )

    expect(
      wrapper.find(".m-vehicle-properties-panel__data-discrepancies").length
    ).toBe(0)
  })

  test("map includes other vehicles on the route", () => {
    const thisVehicle = vehicle
    const otherVehicle = { ...vehicle, id: "other" }
    const ghost = { id: "ghost" } as Ghost
    jest.spyOn(map, "default")
    renderer.create(
      <VehiclesByRouteIdProvider
        vehiclesByRouteId={{ "39": [thisVehicle, otherVehicle, ghost] }}
      >
        <VehiclePropertiesPanel selectedVehicle={thisVehicle} routes={[]} />
      </VehiclesByRouteIdProvider>
    )
    expect(map.default).toHaveBeenCalledTimes(1)
    const mapArgs: map.Props = (map.default as jest.Mock).mock.calls[0][0]
    expect(mapArgs.secondaryVehicles).toEqual([otherVehicle])
  })

  test("fetches other vehicles on the route if they don't already exist", () => {
    const thisVehicle = vehicle
    const otherVehicle = { ...vehicle, id: "other" }
    const ghost = { id: "ghost" } as Ghost
    jest.spyOn(map, "default")
    ;(useVehiclesForRoute as jest.Mock).mockImplementationOnce(() => [
      thisVehicle,
      otherVehicle,
      ghost,
    ])
    renderer.create(
      <VehiclePropertiesPanel selectedVehicle={thisVehicle} routes={[]} />
    )
    expect(useVehiclesForRoute).toHaveBeenCalled()
    expect(map.default).toHaveBeenCalledTimes(1)
    const mapArgs: map.Props = (map.default as jest.Mock).mock.calls[0][0]
    expect(mapArgs.secondaryVehicles).toEqual([otherVehicle])
  })
})
