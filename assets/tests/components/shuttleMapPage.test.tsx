import React from "react"
import { render } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import ShuttleMapPage, {
  allTrainVehicles,
} from "../../src/components/shuttleMapPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { useRouteShapes, useTripShape } from "../../src/hooks/useShapes"
import useShuttleVehicles from "../../src/hooks/useShuttleVehicles"
import useTrainVehicles from "../../src/hooks/useTrainVehicles"
import { TrainVehicle, Vehicle } from "../../src/realtime"
import { ByRouteId, Shape } from "../../src/schedule"
import { initialState } from "../../src/state"
import * as dateTime from "../../src/util/dateTime"
import vehicleFactory from "../factories/vehicle"

jest
  .spyOn(dateTime, "now")
  .mockImplementation(() => new Date("2018-08-15T17:41:21.000Z"))

jest.spyOn(Date, "now").mockImplementation(() => 234000)
jest.mock("../../src/hooks/useShuttleRoutes", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))
jest.mock("../../src/hooks/useShapes", () => ({
  __esModule: true,
  useRouteShapes: jest.fn(() => []),
  useTripShape: jest.fn(() => []),
}))
jest.mock("../../src/hooks/useShuttleVehicles", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))
jest.mock("../../src/hooks/useTrainVehicles", () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}))

const shuttle: Vehicle = vehicleFactory.build({
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
  operatorFirstName: "PATTI",
  operatorLastName: "SMITH",
  operatorLogonTime: new Date("2018-08-15T13:38:21.000Z"),
  bearing: 33,
  blockId: "block-1",
  previousVehicleId: "v2",
  scheduleAdherenceSecs: 0,
  isShuttle: true,
  isOverload: false,
  isOffCourse: false,
  isRevenue: true,
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
  crowding: null,
})

const shape: Shape = {
  id: "shape",
  points: [],
}

describe("Shuttle Map Page", () => {
  test("renders", () => {
    ;(useShuttleVehicles as jest.Mock).mockImplementationOnce(() => [shuttle])
    const result = render(
      <BrowserRouter>
        <ShuttleMapPage />
      </BrowserRouter>
    )
    expect(result.asFragment()).toMatchSnapshot()
  })

  // TODO: based on the snapshot, this test does not appear to be correctly testing
  // the intended functionality
  test("renders with shapes selected", () => {
    ;(useRouteShapes as jest.Mock).mockImplementationOnce(() => [shape])
    ;(useTripShape as jest.Mock).mockImplementationOnce(() => [shape])
    const result = render(
      <BrowserRouter>
        <ShuttleMapPage />
      </BrowserRouter>
    )
    expect(result.asFragment()).toMatchSnapshot()
  })

  test("renders with train vehicles", () => {
    ;(useShuttleVehicles as jest.Mock).mockImplementationOnce(() => [shuttle])
    const trainVehicle: TrainVehicle = {
      id: "R-5463D2D3",
      latitude: 42.24615,
      longitude: -71.00369,
      bearing: 15,
    }
    ;(useTrainVehicles as jest.Mock).mockImplementationOnce(() => ({
      [trainVehicle.id]: trainVehicle,
    }))

    const result = render(
      <BrowserRouter>
        <ShuttleMapPage />
      </BrowserRouter>
    )
    expect(result.asFragment()).toMatchSnapshot()
  })

  test("renders selected shuttle routes", () => {
    const dispatch = jest.fn()
    ;(useShuttleVehicles as jest.Mock).mockImplementationOnce(() => [shuttle])
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, selectedShuttleRunIds: [shuttle.runId!] }}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <ShuttleMapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(result.asFragment()).toMatchSnapshot()
  })

  test("renders with all shuttles selected", () => {
    const dispatch = jest.fn()
    ;(useShuttleVehicles as jest.Mock).mockImplementationOnce(() => [shuttle])
    const result = render(
      <StateDispatchProvider
        state={{ ...initialState, selectedShuttleRunIds: "all" }}
        dispatch={dispatch}
      >
        <BrowserRouter>
          <ShuttleMapPage />
        </BrowserRouter>
      </StateDispatchProvider>
    )
    expect(result.asFragment()).toMatchSnapshot()
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
