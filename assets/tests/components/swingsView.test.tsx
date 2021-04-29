import React from "react"
import renderer from "react-test-renderer"
import SwingsView from "../../src/components/swingsView"
import useSwings from "../../src/hooks/useSwings"
import useVehiclesForRunIds from "../../src/hooks/useVehiclesForRunIds"
import { Swing } from "../../src/schedule"
import { Vehicle, Ghost, VehicleOrGhost } from "../../src/realtime"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import * as dateTime from "../../src/util/dateTime"

jest.mock("../../src/hooks/useSwings", () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock("../../src/hooks/useVehiclesForRunIds", () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock("../../src/hooks/useRoutes", () => ({
  __esModule: true,
  useRoutes: jest.fn(),
}))

jest.spyOn(dateTime, "now").mockImplementation(() => {
  return new Date(18000 * 1000)
})

const vehicle: Vehicle = {
  id: "v1",
  label: "v1-label",
  runId: "123-456",
  timestamp: 123,
  latitude: 0,
  longitude: 0,
  directionId: 0,
  routeId: "1",
  tripId: "1234",
  headsign: "Forest Hills",
  viaVariant: "X",
  operatorId: "op1",
  operatorFirstName: "PATTI",
  operatorLastName: "SMITH",
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
  isRevenue: true,
  layoverDepartureTime: null,
  dataDiscrepancies: [],
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

const ghost: Ghost = {
  id: "ghost-trip",
  directionId: 0,
  routeId: "39",
  tripId: "5678",
  headsign: "headsign",
  blockId: "block",
  runId: "124-456",
  viaVariant: "X",
  layoverDepartureTime: null,
  scheduledTimepointStatus: {
    timepointId: "t0",
    fractionUntilTimepoint: 0.0,
  },
  routeStatus: "on_route",
  blockWaivers: [],
}

describe("SwingsView", () => {
  test("renders loading message", () => {
    ;(useSwings as jest.Mock).mockImplementationOnce(() => null)
    const tree = renderer.create(<SwingsView />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("omits past swings", () => {
    ;(useSwings as jest.Mock).mockImplementationOnce((): Swing[] => [
      {
        fromRouteId: "1",
        fromRunId: "123-456",
        fromTripId: "1234",
        toRouteId: "1",
        toRunId: "123-789",
        toTripId: "5678",
        time: 1000,
      },
    ])
    const tree = renderer.create(<SwingsView />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders future swings, active and inactive", () => {
    ;(useSwings as jest.Mock).mockImplementationOnce((): Swing[] => [
      {
        fromRouteId: "1",
        fromRunId: "123-456",
        fromTripId: "1234",
        toRouteId: "1",
        toRunId: "123-789",
        toTripId: "5678",
        time: 19000,
      },
      {
        fromRouteId: "2",
        fromRunId: "124-456",
        fromTripId: "1235",
        toRouteId: "2",
        toRunId: "124-789",
        toTripId: "5679",
        time: 20000,
      },
      {
        fromRouteId: "3",
        fromRunId: "125-456",
        fromTripId: "1236",
        toRouteId: "3",
        toRunId: "125-789",
        toTripId: "5680",
        time: 21000,
      },
    ])
    ;(useVehiclesForRunIds as jest.Mock).mockImplementationOnce(
      (): VehicleOrGhost[] => [vehicle, ghost]
    )
    const tree = renderer.create(<SwingsView />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
