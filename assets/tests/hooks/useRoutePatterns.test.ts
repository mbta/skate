import { renderHook } from "@testing-library/react"
import * as Api from "../../src/api"
import useRoutePatterns from "../../src/hooks/useRoutePatterns"
import { routePatternFactory } from "../factories/routePattern"
import { instantPromise } from "../testHelpers/mockHelpers"

jest.mock("../../src/api", () => ({
  __esModule: true,

  fetchRoutePatterns: jest.fn(() => new Promise(() => [])),
}))

describe("useRoutePatterns", () => {
  test("returns null while loading", () => {
    const mockFetchRoutePatterns: jest.Mock =
      Api.fetchRoutePatterns as jest.Mock
    const { result } = renderHook(() => {
      return useRoutePatterns("1")
    })
    expect(mockFetchRoutePatterns).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(null)
  })

  test("returns result when loaded", () => {
    const routePatterns = routePatternFactory.buildList(2, { routeId: "66" })
    const mockFetchRoutePatterns: jest.Mock =
      Api.fetchRoutePatterns as jest.Mock
    mockFetchRoutePatterns.mockReturnValueOnce(instantPromise(routePatterns))
    const { result } = renderHook(() => {
      return useRoutePatterns("66")
    })
    expect(mockFetchRoutePatterns).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(routePatterns)
  })

  test("doesn't refetch routes on every render", () => {
    const mockFetchRoutePatterns: jest.Mock =
      Api.fetchRoutePatterns as jest.Mock
    mockFetchRoutePatterns.mockReturnValueOnce(
      instantPromise([routePatternFactory.buildList(2)])
    )
    const { rerender } = renderHook(() => {
      return useRoutePatterns("66")
    })
    rerender()
    expect(mockFetchRoutePatterns).toHaveBeenCalledTimes(1)
  })
})
