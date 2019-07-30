import React from "react"
import renderer from "react-test-renderer"
import LadderPage, { findRouteById } from "../../src/components/ladderPage"
import StateDispatchProvider from "../../src/providers/stateDispatchProvider"
import { Route, TimepointsByRouteId } from "../../src/schedule.d"
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
    })
  })

  test("returns undefined if the route isn't found", () => {
    expect(findRouteById(routes, "missing")).toEqual(undefined)
  })

  test("returns undefined if routes is null", () => {
    expect(findRouteById(null, "does not matter")).toEqual(undefined)
  })
})

const routes: Route[] = [
  { id: "1", directionNames: { 0: "Outbound", 1: "Inbound" } },
  { id: "28", directionNames: { 0: "Outbound", 1: "Inbound" } },
]
const timepointsByRouteId: TimepointsByRouteId = {
  "1": ["WASMA", "MELWA", "HHGAT"],
  "28": ["MATPN", "WELLH", "MORTN"],
  "71": undefined,
  "73": null,
}
