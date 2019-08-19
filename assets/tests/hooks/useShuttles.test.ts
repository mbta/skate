import { renderHook } from "@testing-library/react-hooks"
import * as Api from "../../src/api"
import useShuttles from "../../src/hooks/useShuttles"
import { instantPromise } from "../testHelpers/mockHelpers"

// tslint:disable: react-hooks-nesting no-empty

jest.mock("../../src/api", () => ({
  __esModule: true,
  fetchShuttles: jest.fn(() => new Promise(() => {})),
}))

describe("useShuttles", () => {
  test("returns null while loading", () => {
    const mockFetchShuttles: jest.Mock = Api.fetchShuttles as jest.Mock
    const { result } = renderHook(() => {
      return useShuttles()
    })
    expect(mockFetchShuttles).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(null)
  })

  test("returns result when loaded", () => {
    const shuttles = [{ id: "shuttle" }]
    const mockFetchShuttles: jest.Mock = Api.fetchShuttles as jest.Mock
    mockFetchShuttles.mockImplementationOnce(() => instantPromise(shuttles))
    const { result } = renderHook(() => {
      return useShuttles()
    })
    expect(mockFetchShuttles).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(shuttles)
  })

  test("doesn't refetch shuttles on every render", () => {
    const mockFetchShuttles: jest.Mock = Api.fetchShuttles as jest.Mock
    const { rerender } = renderHook(() => {
      useShuttles()
    })
    rerender()
    expect(mockFetchShuttles).toHaveBeenCalledTimes(1)
  })
})
