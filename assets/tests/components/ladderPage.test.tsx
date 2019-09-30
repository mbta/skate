import React from "react"
import renderer from "react-test-renderer"
import LadderPage, {
  findRouteById,
  findSelectedVehicleOrGhost,
} from "../../src/components/ladderPage"
import { StateDispatchProvider } from "../../src/contexts/stateDispatchContext"
import { Ghost, Vehicle, VehiclesForRoute } from "../../src/realtime"
import { ByRouteId, Route, TimepointsByRouteId } from "../../src/schedule.d"
import { initialState } from "../../src/state"

jest.mock("../../src/hooks/useRoutes", () => ({
  __esModule: true,
  default: jest
    .fn()
    // Ipmlementation sequence matches tests
    .mockImplementationOnce(() => null)
    .mockImplementation(() => routes),
}))

const mockDispatch = jest.fn()

describe("LadderPage", () => {
  test("renders the empty state", () => {
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
      findSelectedVehicleOrGhost(vehiclesByRouteId, "on-route-23")
    ).toEqual({
      id: "on-route-23",
    })
    expect(
      findSelectedVehicleOrGhost(vehiclesByRouteId, "on-route-39")
    ).toEqual({
      id: "on-route-39",
    })
  })

  test("returns the requested vehicle if it is incoming", () => {
    expect(
      findSelectedVehicleOrGhost(vehiclesByRouteId, "incoming-23")
    ).toEqual({
      id: "incoming-23",
    })
    expect(
      findSelectedVehicleOrGhost(vehiclesByRouteId, "incoming-39")
    ).toEqual({
      id: "incoming-39",
    })
  })

  test("returns the requested vehicle if it is a ghost bus", () => {
    expect(findSelectedVehicleOrGhost(vehiclesByRouteId, "ghost-23")).toEqual({
      id: "ghost-23",
    })
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
  "1": ["WASMA", "MELWA", "HHGAT"],
  "28": ["MATPN", "WELLH", "MORTN"],
  "71": undefined,
  "73": null,
}

const vehiclesByRouteId: ByRouteId<VehiclesForRoute> = {
  "23": {
    onRouteVehicles: [
      {
        id: "on-route-23",
      } as Vehicle,
    ],
    incomingVehicles: [
      {
        id: "incoming-23",
      } as Vehicle,
    ],
    ghosts: [
      {
        id: "ghost-23",
      } as Ghost,
    ],
  },
  "39": {
    onRouteVehicles: [
      {
        id: "on-route-39",
      } as Vehicle,
    ],
    incomingVehicles: [
      {
        id: "incoming-39",
      } as Vehicle,
    ],
    ghosts: [
      {
        id: "ghost-39",
      } as Ghost,
    ],
  },
}
