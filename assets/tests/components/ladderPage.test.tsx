import React from "react"
import renderer from "react-test-renderer"
import LadderPage, {
  findRouteById,
  findSelectedVehicleOrGhost,
} from "../../src/components/ladderPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import useRoutes from "../../src/hooks/useRoutes"
import useVehicles from "../../src/hooks/useVehicles"
import { Ghost, Vehicle, VehicleOrGhost } from "../../src/realtime"
import { ByRouteId, Route, TimepointsByRouteId } from "../../src/schedule.d"
import { initialState } from "../../src/state"

jest.mock("../../src/hooks/useRoutes", () => ({
  __esModule: true,
  default: jest.fn(() => routes),
}))
jest.mock("../../src/hooks/useVehicles", () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}))

const mockDispatch = jest.fn()

describe("LadderPage", () => {
  test("renders the empty state", () => {
    ;(useRoutes as jest.Mock).mockImplementationOnce(() => null)
    const tree = renderer.create(<LadderPage />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders with routes", () => {
    const mockState = { ...initialState, selectedRouteIds: ["1"] }
    const tree = renderer
      .create(
        <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
          <LadderPage />
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders with selectedRoutes in different order than routes data", () => {
    const mockState = { ...initialState, selectedRouteIds: ["28", "1"] }
    const tree = renderer
      .create(
        <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
          <LadderPage />
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders with timepoints", () => {
    const mockState = {
      ...initialState,
      timepointsByRouteId,
    }
    const tree = renderer
      .create(
        <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
          <LadderPage />
        </StateDispatchProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("renders with vehicles and selected vehicles", () => {
    const vehicle: VehicleOrGhost = {
      id: "ghost-id",
      directionId: 0,
      routeId: "1",
      tripId: "trip",
      headsign: "headsign",
      blockId: "block",
      runId: null,
      viaVariant: null,
      layoverDepartureTime: null,
      scheduledTimepointStatus: {
        timepointId: "hhgat",
        fractionUntilTimepoint: 0.0,
      },
      routeStatus: "on_route",
      blockWaivers: [],
    }
    ;(useVehicles as jest.Mock).mockImplementationOnce(() => ({
      ["1"]: [vehicle],
    }))
    const mockState = {
      ...initialState,
      selectedRouteIds: ["1"],
      selectedVehicleId: "ghost-id",
    }
    const tree = renderer
      .create(
        <StateDispatchProvider state={mockState} dispatch={mockDispatch}>
          <LadderPage />
        </StateDispatchProvider>
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
      name: "28",
    })
  })

  test("returns undefined if the route isn't found", () => {
    expect(findRouteById(routes, "missing")).toEqual(undefined)
  })

  test("returns undefined if routes is null", () => {
    expect(findRouteById(null, "does not matter")).toEqual(undefined)
  })
})

describe("findSelectedVehicleOrGhost", () => {
  test("returns the requested vehicle if it is on the route", () => {
    expect(
      findSelectedVehicleOrGhost(vehiclesByRouteId, "on-route-39")
    ).toEqual({
      id: "on-route-39",
      routeStatus: "on_route",
    })
  })

  test("returns the requested vehicle if it is pulling out", () => {
    expect(
      findSelectedVehicleOrGhost(vehiclesByRouteId, "pulling-out-39")
    ).toEqual({
      id: "pulling-out-39",
      routeStatus: "pulling_out",
    })
  })

  test("returns the requested vehicle if it is a ghost bus", () => {
    expect(findSelectedVehicleOrGhost(vehiclesByRouteId, "ghost-39")).toEqual({
      id: "ghost-39",
    })
  })

  test("returns undefined if the vehicle is not found", () => {
    expect(
      findSelectedVehicleOrGhost(vehiclesByRouteId, "missing-23")
    ).toBeUndefined()
  })

  test("returns undefined if selectedVehicleId is undefined", () => {
    expect(
      findSelectedVehicleOrGhost(vehiclesByRouteId, undefined)
    ).toBeUndefined()
  })
})

const routes: Route[] = [
  { id: "1", directionNames: { 0: "Outbound", 1: "Inbound" }, name: "1" },
  { id: "28", directionNames: { 0: "Outbound", 1: "Inbound" }, name: "28" },
]
const timepointsByRouteId: TimepointsByRouteId = {
  "1": [
    { id: "WASMA", name: "WASMA Name" },
    { id: "MELWA", name: "MELWA Name" },
    { id: "HHGAT", name: "HHGAT Name" },
  ],
  "28": [
    { id: "MATPN", name: "MATPN Name" },
    { id: "WELLH", name: "WELLH Name" },
    { id: "MORTN", name: "MORTN Name" },
  ],
  "71": undefined,
  "73": null,
}

const vehiclesByRouteId: ByRouteId<VehicleOrGhost[]> = {
  "23": [
    {
      id: "on-route-23",
      routeStatus: "on_route",
    } as Vehicle,
    {
      id: "pulling-out-23",
      routeStatus: "pulling_out",
    } as Vehicle,
    {
      id: "ghost-23",
    } as Ghost,
  ],
  "39": [
    {
      id: "on-route-39",
      routeStatus: "on_route",
    } as Vehicle,
    {
      id: "pulling-out-39",
      routeStatus: "pulling_out",
    } as Vehicle,
    {
      id: "ghost-39",
    } as Ghost,
  ],
}
