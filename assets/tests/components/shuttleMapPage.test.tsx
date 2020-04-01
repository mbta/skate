import React from "react"
import renderer from "react-test-renderer"
import ShuttleMapPage, {
  allTrainVehicles,
} from "../../src/components/shuttleMapPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import useShuttleVehicles from "../../src/hooks/useShuttleVehicles"
import { HeadwaySpacing } from "../../src/models/vehicleStatus"
import { TrainVehicle, Vehicle } from "../../src/realtime"
import { ByRouteId } from "../../src/schedule"
import { initialState } from "../../src/state"
import * as dateTime from "../../src/util/dateTime"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

jest.spyOn(Date, "now").mockImplementation(() => 234000)
jest.mock("../../src/hooks/useShuttleVehicles", () => ({
  __esModule: true,
  default: jest.fn(),
}))

const shuttle: Vehicle = {
  id: "y1818",
  label: "1818",
  runId: "999-0555",
  timestamp: 1557160307,
  latitude: 0,
  longitude: 0,
  directionId: 0,
  routeId: "1",
  tripId: "39914237",
  headsign: "h1",
  viaVariant: "4",
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
  isShuttle: true,
  isOverload: false,
  isOffCourse: false,
  layoverDepartureTime: null,
  dataDiscrepancies: [],
  stopStatus: {
    stopId: "57",
    stopName: "57",
  },
  timepointStatus: {
    fractionUntilTimepoint: 0.5,
    timepointId: "MATPN",
  },
  scheduledLocation: null,
  routeStatus: "on_route",
  endOfTripType: "another_trip",
  blockWaivers: [],
}

describe("Shuttle Map Page", () => {
  test("renders", () => {
    ;(useShuttleVehicles as jest.Mock).mockImplementationOnce(() => [shuttle])
    const tree = renderer.create(<ShuttleMapPage />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders selected shuttle routes", () => {
    const dispatch = jest.fn()
    ;(useShuttleVehicles as jest.Mock).mockImplementationOnce(() => [shuttle])
    const tree = renderer
      .create(
        <StateDispatchProvider
          state={{ ...initialState, selectedShuttleRunIds: [shuttle.runId!] }}
          dispatch={dispatch}
        >
          <ShuttleMapPage />
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders with all shuttles selected", () => {
    const dispatch = jest.fn()
    ;(useShuttleVehicles as jest.Mock).mockImplementationOnce(() => [shuttle])
    const tree = renderer
      .create(
        <StateDispatchProvider
          state={{ ...initialState, selectedShuttleRunIds: "all" }}
          dispatch={dispatch}
        >
          <ShuttleMapPage />
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders a selected shuttle vehicle", () => {
    const dispatch = jest.fn()
    const state = {
      ...initialState,
      selectedShuttleRunIds: [shuttle.runId!],
      selectedVehicleId: shuttle.id,
    }
    ;(useShuttleVehicles as jest.Mock).mockImplementationOnce(() => [shuttle])
    const tree = renderer
      .create(
        <StateDispatchProvider state={state} dispatch={dispatch}>
          <ShuttleMapPage />
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})

describe("allTrainVehicles", () => {
  test("returns all train vehicles in a single list", () => {
    const trainVehicle: TrainVehicle = {
      id: "R-5463D2D3",
      latitude: 42.24615,
      longitude: -71.00369,
      bearing: 15,
    }
    const trainVehiclesByRouteId: ByRouteId<TrainVehicle[]> = {
      Red: [trainVehicle],
    }

    expect(allTrainVehicles(trainVehiclesByRouteId)).toEqual([trainVehicle])
  })
})
