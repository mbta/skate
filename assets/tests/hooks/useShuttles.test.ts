import { renderHook } from "@testing-library/react-hooks"
import * as Api from "../../src/api"
import useShuttleRoutes from "../../src/hooks/useShuttleRoutes"
import { instantPromise } from "../testHelpers/mockHelpers"

// tslint:disable: react-hooks-nesting no-empty

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
    const shuttles = [{ id: "shuttle" }]
    const mockFetchShuttles: jest.Mock = Api.fetchShuttleRoutes as jest.Mock
    mockFetchShuttles.mockImplementationOnce(() => instantPromise(shuttles))
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
