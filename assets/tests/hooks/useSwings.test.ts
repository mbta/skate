import { renderHook } from "@testing-library/react-hooks"
import * as Api from "../../src/api"
import useSwings from "../../src/hooks/useSwings"
import { instantPromise } from "../testHelpers/mockHelpers"

// tslint:disable: react-hooks-nesting no-empty

jest.mock("../../src/api", () => ({
  __esModule: true,
  fetchSwings: jest.fn(() => new Promise(() => {})),
}))

describe("useSwings", () => {
  test("returns null while loading", () => {
    const mockFetchSwings: jest.Mock = Api.fetchSwings as jest.Mock
    const { result } = renderHook(() => {
      return useSwings()
    })
    expect(mockFetchSwings).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(null)
  })

  test("returns result when loaded", () => {
    const routes = [
      {
        from_route_id: "1",
        from_run_id: "123-456",
        from_trip_id: "1234",
        to_route_id: "1",
        to_run_id: "123-789",
        to_trip_id: "5678",
        time: 100,
      },
    ]
    const mockFetchSwings: jest.Mock = Api.fetchSwings as jest.Mock
    mockFetchSwings.mockImplementationOnce(() => instantPromise(routes))
    const { result } = renderHook(() => {
      return useSwings()
    })
    expect(mockFetchSwings).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(routes)
  })

  test("doesn't refetch routes on every render", () => {
    const mockFetchSwings: jest.Mock = Api.fetchSwings as jest.Mock
    const { rerender } = renderHook(() => {
      useSwings()
    })
    rerender()
    expect(mockFetchSwings).toHaveBeenCalledTimes(1)
  })
})
