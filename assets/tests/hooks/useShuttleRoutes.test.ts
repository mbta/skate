import { renderHook } from "@testing-library/react"
import * as Api from "../../src/api"
import useShuttleRoutes, { sortByName } from "../../src/hooks/useShuttleRoutes"
import { Route } from "../../src/schedule"
import { instantPromise } from "../testHelpers/mockHelpers"

jest.mock("../../src/api", () => ({
  __esModule: true,

  fetchShuttleRoutes: jest.fn(() => new Promise(() => {})),
}))

describe("useShuttleRoutes", () => {
  test("returns null while loading", () => {
    const mockFetchShuttles: jest.Mock = Api.fetchShuttleRoutes as jest.Mock
    const { result } = renderHook(() => {
      return useShuttleRoutes()
    })
    expect(mockFetchShuttles).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(null)
  })

  test("returns result when loaded", () => {
    const shuttles = [{ id: "shuttle", name: "shuttle" }]
    const mockFetchShuttles: jest.Mock = Api.fetchShuttleRoutes as jest.Mock
    mockFetchShuttles.mockImplementationOnce(() =>
      instantPromise({ sort: () => instantPromise(shuttles) })
    )

    const { result } = renderHook(() => {
      return useShuttleRoutes()
    })
    expect(mockFetchShuttles).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(shuttles)
  })

  test("doesn't refetch shuttles on every render", () => {
    const mockFetchShuttles: jest.Mock = Api.fetchShuttleRoutes as jest.Mock
    const { rerender } = renderHook(() => {
      useShuttleRoutes()
    })
    rerender()
    expect(mockFetchShuttles).toHaveBeenCalledTimes(1)
  })
})

describe("sortByName", () => {
  test("sorts routes alphabetically by name", () => {
    const shuttleA: Route = { id: "2", name: "a" } as Route
    const shuttleB: Route = { id: "1", name: "b" } as Route
    const shuttleC: Route = { id: "3", name: "c" } as Route
    const shuttleBCaps: Route = { id: "4", name: "B" } as Route
    const unsortedShuttles: Route[] = [
      shuttleB,
      shuttleA,
      shuttleC,
      shuttleBCaps,
    ]
    const sortedShuttles: Route[] = [shuttleA, shuttleB, shuttleBCaps, shuttleC]

    expect(sortByName(unsortedShuttles)).toEqual(sortedShuttles)
  })
})
