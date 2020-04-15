import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import VehiclePropertiesPanel from "../../../src/components/propertiesPanel/vehiclePropertiesPanel"
import { HeadwaySpacing } from "../../../src/models/vehicleStatus"
import { BlockWaiver, Vehicle } from "../../../src/realtime"
import { Route } from "../../../src/schedule"
import * as dateTime from "../../../src/util/dateTime"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

jest.spyOn(Date, "now").mockImplementation(() => 234000)

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
}

describe("VehiclePropertiesPanel", () => {
  test("renders a vehicle properties panel", () => {
    const tree = renderer
      .create(<VehiclePropertiesPanel selectedVehicle={vehicle} />)
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
        <VehiclePropertiesPanel selectedVehicle={vehicle} route={route} />
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
      .create(<VehiclePropertiesPanel selectedVehicle={earlyVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for a late vehicle", () => {
    const earlyVehicle: Vehicle = {
      ...vehicle,
      scheduleAdherenceSecs: 361,
    }
    const tree = renderer
      .create(<VehiclePropertiesPanel selectedVehicle={earlyVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for an off-course vehicle", () => {
    const offCourseVehicle: Vehicle = {
      ...vehicle,
      isOffCourse: true,
    }

    const tree = renderer
      .create(<VehiclePropertiesPanel selectedVehicle={offCourseVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for a headway-based vehicle", () => {
    const offCourseVehicle: Vehicle = {
      ...vehicle,
      headwaySpacing: HeadwaySpacing.Ok,
    }

    const tree = renderer
      .create(<VehiclePropertiesPanel selectedVehicle={offCourseVehicle} />)
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
      .create(<VehiclePropertiesPanel selectedVehicle={shuttleVehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders for a vehicle with block waivers", () => {
    const blockWaiver: BlockWaiver = {
      startTime: new Date("1970-01-01T05:05:00.000Z"),
      endTime: new Date("1970-01-01T12:38:00.000Z"),
      remark: "E:1106",
    }
    const vehicleWithBlockWaivers: Vehicle = {
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

  test("renders data discrepancies when in debug mode", () => {
    jest
      .spyOn(URLSearchParams.prototype, "get")
      .mockImplementation((_key) => "1")

    const wrapper = mount(<VehiclePropertiesPanel selectedVehicle={vehicle} />)

    expect(
      wrapper.find(".m-vehicle-properties-panel__data-discrepancies").length
    ).toBeGreaterThan(0)
  })

  test("does not render data discrepancies when not in debug mode", () => {
    jest
      .spyOn(URLSearchParams.prototype, "get")
      .mockImplementation((_key) => null)

    const wrapper = mount(<VehiclePropertiesPanel selectedVehicle={vehicle} />)

    expect(
      wrapper.find(".m-vehicle-properties-panel__data-discrepancies").length
    ).toBe(0)
  })
})
