import {
  isGhost,
  isLateVehicleIndicator,
  isRecentlyLoggedOn,
  isShuttle,
  isVehicle,
  shouldShowHeadwayDiagram,
} from "../../src/models/vehicle"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { Ghost, Vehicle, VehicleTimepointStatus } from "../../src/realtime"
import * as dateTime from "../../src/util/dateTime"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2020-03-17T12:00:00.000Z"))

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => true),
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
  headwaySpacing: null,
  previousVehicleId: "v2",
  scheduleAdherenceSecs: 0,
  scheduledHeadwaySecs: 120,
  isOffCourse: false,
  layoverDepartureTime: null,
  blockIsActive: true,
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
    {
      attribute: "route_id",
      sources: [
        {
          id: "swiftly",
          value: null,
        },
        {
          id: "busloc",
          value: "busloc-route-id",
        },
      ],
    },
  ],
  stopStatus: {
    stopId: "s1",
    stopName: "Stop Name",
  },
  timepointStatus: {
    timepointId: "tp1",
    fractionUntilTimepoint: 0.5,
  } as VehicleTimepointStatus,
  scheduledLocation: {
    routeId: "39",
    directionId: 0,
    tripId: "scheduled trip",
    runId: "scheduled run",
    timeSinceTripStartTime: 0,
    headsign: "scheduled headsign",
    viaVariant: "scheduled via variant",
    timepointStatus: {
      timepointId: "tp1",
      fractionUntilTimepoint: 0.5,
    },
  },
  routeStatus: "on_route",
  endOfTripType: "another_trip",
  blockWaivers: [],
}
const ghost: Ghost = {
  id: "ghost-trip",
  directionId: 0,
  routeId: "1",
  tripId: "trip",
  headsign: "headsign",
  blockId: "block",
  runId: null,
  viaVariant: null,
  layoverDepartureTime: null,
  scheduledTimepointStatus: {
    timepointId: "t0",
    fractionUntilTimepoint: 0.0,
  },
  routeStatus: "on_route",
  blockWaivers: [],
}

describe("isVehicle", () => {
  test("returns true for a Vehicle", () => {
    expect(isVehicle(vehicle)).toBeTruthy()
  })

  test("returns false for a Ghost", () => {
    expect(isVehicle(ghost)).toBeFalsy()
  })
})

describe("isGhost", () => {
  test("returns true for a Ghost", () => {
    expect(isGhost(ghost)).toBeTruthy()
  })

  test("returns false for a Vehicle", () => {
    expect(isGhost(vehicle)).toBeFalsy()
  })
})

describe("isLateVehicleIndicator", () => {
  test("returns true for a late vehicle indicator", () => {
    const lateVehicleIndicatorGhost: Ghost = {
      id: "ghost-incoming-123",
    } as Ghost

    expect(isLateVehicleIndicator(lateVehicleIndicatorGhost)).toBeTruthy()
  })

  test("returns false for a normal ghost", () => {
    const regularGhost: Ghost = {
      id: "ghost-123",
    } as Ghost

    expect(isLateVehicleIndicator(regularGhost)).toBeFalsy()
  })
})

describe("isShuttle", () => {
  test("true if the vehicle's runId starts with 999", () => {
    const shuttle = { runId: "999-0555" } as Vehicle
    const notShuttle = { runId: "998-0555" } as Vehicle

    expect(isShuttle(shuttle)).toBeTruthy()
    expect(isShuttle(notShuttle)).toBeFalsy()
  })
})

describe("isRecentlyLoggedOn", () => {
  test("true if the operatorLogonTime is within the past 30 minutes", () => {
    const recentVehicle = {
      id: "1",
      operatorLogonTime: new Date("2020-03-17T11:31:00.000Z"),
    } as Vehicle

    expect(isRecentlyLoggedOn(recentVehicle)).toBeTruthy()
  })

  test("false if the operatorLogonTime is more than 30 minutes ago", () => {
    const oldVehicle = {
      id: "1",
      operatorLogonTime: new Date("2020-03-17T11:29:00.000Z"),
    } as Vehicle

    expect(isRecentlyLoggedOn(oldVehicle)).toBeFalsy()
  })

  test("false if operatorLogonTime is null", () => {
    const vehicleMissingLogonTime = {
      id: "1",
      operatorLogonTime: null,
    } as Vehicle

    expect(isRecentlyLoggedOn(vehicleMissingLogonTime)).toBeFalsy()
  })

  test("false if given a ghost", () => {
    expect(isRecentlyLoggedOn(ghost)).toBeFalsy()
  })
})

describe("shouldShowHeadwayDiagram", () => {
  test("returns false if vehicle headwaySpacing is null", () => {
    const nullHeadwaySpacingVehicle = {
      headwaySpacing: null,
    } as Vehicle

    expect(shouldShowHeadwayDiagram(nullHeadwaySpacingVehicle)).toBeFalsy()
  })

  test("returns false if not on route", () => {
    const notOnRouteVehicle = {
      headwaySpacing: HeadwaySpacing.Ok,
      routeStatus: "pulling_out",
    } as Vehicle

    expect(shouldShowHeadwayDiagram(notOnRouteVehicle)).toBeFalsy()
  })

  test("returns true if measuring headway spacing and is on route", () => {
    const onRouteHeadwaySpacingVehicle = {
      headwaySpacing: HeadwaySpacing.Ok,
      routeStatus: "on_route",
    } as Vehicle

    expect(shouldShowHeadwayDiagram(onRouteHeadwaySpacingVehicle)).toBeTruthy()
  })
})
